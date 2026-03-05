/**
 * Web Viewer Integration: React Three Fiber + Schema-Aware Lattice
 * 
 * Demonstrates building a 3D lattice visualization from JSONL events and
 * attestations, with schema-aware validation and trust layer visualization.
 */

import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import React, { useMemo, useState, useEffect } from "react";

// Types (from model.ts)
export type SchemaClass = "private" | "protected" | "public";

export type JsonlEvent = {
  t?: string;
  a?: string; // addr "AA:BB:.."
  k?: string;
  v?: any;
};

export type ExecAttest = {
  t?: string;
  k?: string;
  v?: {
    addr?: string;
    realm?: string;
    schema_hash?: string;
    schema_class?: SchemaClass;
    status?: string;
    node_id?: string;
  };
};

export type Addr8 = {
  bytes: number[];
  text: string;
  realm: number;
  prefix40: string;
};

export type NodeRecord = {
  addr: Addr8;
  lastSeenUtc?: string;
  class: SchemaClass;
  schemaHash?: string;
  attestCount: number;
  validation?: "valid" | "invalid" | "unknown-schema";
};

export type GroupRecord = {
  key: string;
  realmHex: string;
  schemaHash: string;
  class: SchemaClass;
  prefix40: string;
  nodes: NodeRecord[];
};

/**
 * Parse address string to Addr8
 */
function parseAddr8(s: string): Addr8 | null {
  const parts = s.split(":").map(p => p.trim()).filter(Boolean);
  if (parts.length !== 8) return null;
  const bytes = parts.map(p => parseInt(p, 16));
  if (bytes.some(b => Number.isNaN(b) || b < 0 || b > 255)) return null;
  const text = parts.map(p => p.toUpperCase().padStart(2, "0")).join(":");
  const realm = bytes[0]!;
  const prefix40 = `${text.split(":").slice(0, 5).join(":")}::/40`;
  return { bytes, text, realm, prefix40 };
}

/**
 * Build lattice from events and attestations
 */
function buildLattice(events: JsonlEvent[], atts: ExecAttest[]): {
  nodes: NodeRecord[];
  groups: GroupRecord[];
} {
  const nodesByAddr = new Map<string, NodeRecord>();

  // From events.jsonl: record "seen" + addr presence
  for (const e of events) {
    if (!e?.a) continue;
    const addr = parseAddr8(e.a);
    if (!addr) continue;
    const cur = nodesByAddr.get(addr.text);
    if (!cur) {
      nodesByAddr.set(addr.text, {
        addr,
        lastSeenUtc: e.t,
        class: "public",
        schemaHash: undefined,
        attestCount: 0
      });
    } else {
      if (e.t && (!cur.lastSeenUtc || e.t > cur.lastSeenUtc)) {
        cur.lastSeenUtc = e.t;
      }
    }
  }

  // From attestations: bind schema hash + class + status
  for (const a of atts) {
    const v = a?.v;
    const addrS = v?.addr;
    const realmS = v?.realm;
    const hash = v?.schema_hash;
    if (!addrS || !realmS || !hash) continue;
    const addr = parseAddr8(addrS);
    if (!addr) continue;
    const cls = v?.schema_class ?? "public";
    const cur = nodesByAddr.get(addr.text) ?? {
      addr,
      lastSeenUtc: a.t,
      class: cls,
      schemaHash: hash,
      attestCount: 0
    };
    cur.attestCount += 1;
    cur.class = maxClass(cur.class, cls);
    cur.schemaHash = hash;
    if (a.t && (!cur.lastSeenUtc || a.t > cur.lastSeenUtc)) {
      cur.lastSeenUtc = a.t;
    }
    nodesByAddr.set(addr.text, cur);
  }

  // Group by (realm|schema_hash|prefix40)
  const groupsByKey = new Map<string, GroupRecord>();

  for (const n of nodesByAddr.values()) {
    const realmHex = n.addr.bytes[0]!.toString(16).toUpperCase().padStart(2, "0");
    const schemaHash = (n.schemaHash ?? "unknown").toLowerCase();
    const key = `${realmHex}|${schemaHash}|${n.addr.prefix40}`;

    const g = groupsByKey.get(key);
    if (!g) {
      groupsByKey.set(key, {
        key,
        realmHex,
        schemaHash,
        class: n.class,
        prefix40: n.addr.prefix40,
        nodes: [n]
      });
    } else {
      g.nodes.push(n);
      g.class = maxClass(g.class, n.class);
    }
  }

  const groups = [...groupsByKey.values()].sort((a, b) => {
    const ak = `${a.realmHex}|${a.schemaHash}|${a.prefix40}`;
    const bk = `${b.realmHex}|${b.schemaHash}|${b.prefix40}`;
    return ak.localeCompare(bk);
  });

  return { nodes: [...nodesByAddr.values()], groups };
}

function maxClass(a: SchemaClass, b: SchemaClass): SchemaClass {
  const rank: Record<SchemaClass, number> = { private: 0, protected: 1, public: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Deterministic position from address bytes
 */
function posFromAddr(n: NodeRecord): THREE.Vector3 {
  const b = n.addr.bytes;
  const x = (b[1]! / 255) * 20 - 10;
  const y = (b[2]! / 255) * 20 - 10;
  const z = (b[3]! / 255) * 20 - 10;
  return new THREE.Vector3(x, y, z);
}

/**
 * Class to opacity mapping
 */
function classToOpacity(cls: SchemaClass): number {
  if (cls === "private") return 0.25;
  if (cls === "protected") return 0.55;
  return 0.85;
}

/**
 * Render nodes as points
 */
function NodesPoints({ nodes }: { nodes: NodeRecord[] }) {
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const colors = new Float32Array(nodes.length * 3);
    
    nodes.forEach((n, i) => {
      const p = posFromAddr(n);
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      
      // Color by validation status
      const color = n.validation === "invalid" 
        ? new THREE.Color(1, 0, 0)  // red
        : n.validation === "unknown-schema"
        ? new THREE.Color(1, 0.65, 0.3)  // orange
        : new THREE.Color(1, 1, 1);  // white
      
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    
    return { positions, colors };
  }, [nodes]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={3} transparent vertexColors />
    </points>
  );
}

/**
 * Render protected groups as lines
 */
function ProtectedLines({ groups }: { groups: GroupRecord[] }) {
  const lines = useMemo(() => {
    const segs: number[] = [];
    for (const g of groups) {
      if (g.class !== "protected") continue;
      const ns = g.nodes;
      for (let i = 1; i < ns.length; i++) {
        const a = posFromAddr(ns[i - 1]!);
        const b = posFromAddr(ns[i]!);
        segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    return new Float32Array(segs);
  }, [groups]);

  if (lines.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[lines, 3]} />
      </bufferGeometry>
      <lineBasicMaterial transparent opacity={0.6} />
    </lineSegments>
  );
}

/**
 * Render public groups as planes
 */
function GroupPlane({ g, center }: { g: GroupRecord; center: THREE.Vector3 }) {
  const opacity = classToOpacity(g.class);
  const size = 6 + Math.min(12, g.nodes.length);
  
  return (
    <mesh position={center}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={opacity} />
      <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "4px 6px",
          borderRadius: 6,
          fontSize: 12
        }}>
          <div><b>{g.prefix40}</b></div>
          <div>class: {g.class}</div>
          <div>schema: {g.realmHex}|{g.schemaHash.slice(0, 10)}…</div>
          <div>nodes: {g.nodes.length}</div>
        </div>
      </Html>
    </mesh>
  );
}

/**
 * Main scene component
 */
export function SceneView({ nodes, groups }: { 
  nodes: NodeRecord[]; 
  groups: GroupRecord[] 
}) {
  const publicGroups = groups.filter(g => g.class === "public");
  const groupCenters = useMemo(() => {
    return publicGroups.map(g => {
      const acc = new THREE.Vector3(0, 0, 0);
      for (const n of g.nodes) acc.add(posFromAddr(n));
      acc.divideScalar(Math.max(1, g.nodes.length));
      return { g, center: acc };
    });
  }, [groups]);

  return (
    <Canvas camera={{ position: [18, 14, 18], fov: 50 }}>
      <ambientLight intensity={0.9} />
      <OrbitControls makeDefault />

      {/* Points: all nodes */}
      <NodesPoints nodes={nodes} />

      {/* Lines: protected groups */}
      <ProtectedLines groups={groups} />

      {/* Planes: public groups */}
      {groupCenters.map(({ g, center }) => (
        <GroupPlane key={g.key} g={g} center={center} />
      ))}

      {/* Origin axes helper */}
      <axesHelper args={[8]} />
      <gridHelper args={[40, 40]} />
    </Canvas>
  );
}

/**
 * HUD component
 */
export function Hud({ nodes, groups }: { 
  nodes: NodeRecord[]; 
  groups: GroupRecord[] 
}) {
  const byClass = (cls: SchemaClass) => groups.filter(g => g.class === cls).length;
  const invalid = nodes.filter(n => n.validation === "invalid").length;
  const unknown = nodes.filter(n => n.validation === "unknown-schema").length;

  return (
    <div style={{
      position: "absolute", top: 12, left: 12, zIndex: 10,
      background: "rgba(0,0,0,0.6)", color: "white",
      padding: "10px 12px", borderRadius: 10, width: 320
    }}>
      <div style={{ fontSize: 14, marginBottom: 6 }}>
        <b>Tetragrammatron Web Viewer</b>
      </div>
      <div>nodes: <b>{nodes.length}</b></div>
      <div>groups: <b>{groups.length}</b></div>
      <div style={{ marginTop: 6 }}>
        <div>public planes: <b>{byClass("public")}</b></div>
        <div>protected linesets: <b>{byClass("protected")}</b></div>
        <div>private pointsets: <b>{byClass("private")}</b></div>
      </div>
      <div style={{ marginTop: 6 }}>
        <div>valid nodes: <b>{nodes.length - invalid - unknown}</b></div>
        <div style={{ color: "#ff6b6b" }}>invalid nodes: <b>{invalid}</b></div>
        <div style={{ color: "#ffa94d" }}>unknown schema: <b>{unknown}</b></div>
      </div>
    </div>
  );
}

/**
 * Main app component
 */
export function App() {
  const [events, setEvents] = useState<JsonlEvent[]>([]);
  const [atts, setAtts] = useState<ExecAttest[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [e, a] = await Promise.all([
          fetch("/data/events.jsonl").then(r => r.text()).then(t => 
            t.split(/\r?\n/).map(l => {
              try { return JSON.parse(l.trim()); } catch { return null; }
            }).filter(Boolean)
          ),
          fetch("/data/attestations.jsonl").then(r => r.text()).then(t =>
            t.split(/\r?\n/).map(l => {
              try { return JSON.parse(l.trim()); } catch { return null; }
            }).filter(Boolean)
          )
        ]);
        setEvents(e);
        setAtts(a);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();
  }, []);

  const { nodes, groups } = buildLattice(events, atts);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Hud nodes={nodes} groups={groups} />
      {err ? (
        <div style={{ color: "white", padding: 16 }}>Error: {err}</div>
      ) : (
        <SceneView nodes={nodes} groups={groups} />
      )}
    </div>
  );
}

