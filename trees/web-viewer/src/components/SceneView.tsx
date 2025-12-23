import * as THREE from "three";
import React, { useMemo, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GroupRecord, NodeRecord } from "../lib/lattice";
import { SchemaClass } from "../lib/model";
import { TrustConfig } from "../lib/trust-config";

function classToOpacity(cls: SchemaClass) {
  if (cls === "private") return 0.25;
  if (cls === "protected") return 0.55;
  return 0.85;
}
function opacityWithValidation(cls: SchemaClass, v?: any) {
  if (!v) return 0.3;
  if (v.kind === "invalid") return 0.15;
  if (v.kind === "unknown-schema") return 0.35;
  return classToOpacity(cls);
}
function classToSize(cls: SchemaClass) {
  if (cls === "private") return 2.0;
  if (cls === "protected") return 3.5;
  return 5.0;
}

// Deterministic pseudo-layout: map addr bytes into 3D
function posFromAddr(n: NodeRecord): THREE.Vector3 {
  const b = n.addr.bytes;
  // Use first 6 bytes to set position in a stable cube
  const x = (b[1]! / 255) * 20 - 10;
  const y = (b[2]! / 255) * 20 - 10;
  const z = (b[3]! / 255) * 20 - 10;
  return new THREE.Vector3(x, y, z);
}

function GroupPlane({ g, center, onFocus }: { g: GroupRecord; center: THREE.Vector3; onFocus?: (point: THREE.Vector3) => void }) {
  const opacity = classToOpacity(g.class);
  const size = 6 + Math.min(12, g.nodes.length); // scale by density
  return (
    <mesh position={center} onClick={(e) => { e.stopPropagation(); onFocus?.(center); }}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial transparent opacity={opacity} />
      <Html distanceFactor={12} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "4px 6px",
          borderRadius: 6,
          fontSize: 12,
          maxWidth: 260
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

function NodesPoints({ nodes, onNodeClick }: { nodes: NodeRecord[]; onNodeClick?: (point: THREE.Vector3) => void }) {
  const { positions, sizes, opacities } = useMemo(() => {
    const positions = new Float32Array(nodes.length * 3);
    const sizes = new Float32Array(nodes.length);
    const opacities = new Float32Array(nodes.length);
    nodes.forEach((n, i) => {
      const p = posFromAddr(n);
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      sizes[i] = classToSize(n.class);
      opacities[i] = classToOpacity(n.class);
    });
    return { positions, sizes, opacities };
  }, [nodes]);

  const handleClick = useCallback((event: any) => {
    if (!onNodeClick) return;
    event.stopPropagation();
    if (typeof event.index !== "number") return;
    const node = nodes[event.index];
    if (!node) return;
    onNodeClick(posFromAddr(node));
  }, [nodes, onNodeClick]);

  return (
    <points onClick={handleClick}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={3} transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

// Protected edges: naive example — connect nodes with same prefix40 inside group
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

// Trust graph visualization: show relationships between schemas and their signers
function TrustGraph({ 
  groups, 
  schemaStatus, 
  trustConfig 
}: { 
  groups: GroupRecord[]; 
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
}) {
  // Build trust relationships: schema -> signer pubkey
  const { trustedLines, untrustedLines, hasTrusted } = useMemo(() => {
    if (!schemaStatus || !trustConfig) return { trustedLines: [], untrustedLines: [], hasTrusted: false };
    
    const trustedSegs: number[] = [];
    const untrustedSegs: number[] = [];
    let hasAnyTrusted = false;
    
    // For each trusted schema, create a visual connection
    for (const [key, status] of schemaStatus.entries()) {
      if (status !== "ok") continue;
      
      const [realmHex, hash] = key.split("|");
      const group = groups.find(g => 
        g.realmHex === realmHex && g.schemaHash === hash
      );
      
      if (!group || group.nodes.length === 0) continue;
      
      // Find group center
      const center = new THREE.Vector3(0, 0, 0);
      for (const n of group.nodes) center.add(posFromAddr(n));
      center.divideScalar(Math.max(1, group.nodes.length));
      
      // Check if pubkey is trusted
      const trusted = trustConfig.trustedPubkeys.get(realmHex)?.length > 0;
      if (trusted) hasAnyTrusted = true;
      
      // Create edge from schema to a "trust anchor" point above
      const anchor = center.clone().add(new THREE.Vector3(0, 8, 0));
      
      // Add line segment to appropriate array
      const seg = [center.x, center.y, center.z, anchor.x, anchor.y, anchor.z];
      if (trusted) {
        trustedSegs.push(...seg);
      } else {
        untrustedSegs.push(...seg);
      }
    }
    
    return {
      trustedLines: new Float32Array(trustedSegs),
      untrustedLines: new Float32Array(untrustedSegs),
      hasTrusted: hasAnyTrusted
    };
  }, [groups, schemaStatus, trustConfig]);

  if (trustedLines.length === 0 && untrustedLines.length === 0) return null;

  return (
    <>
      {/* Trusted lines */}
      {trustedLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[trustedLines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#51cf66" transparent opacity={0.6} linewidth={2} />
        </lineSegments>
      )}
      
      {/* Untrusted lines */}
      {untrustedLines.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[untrustedLines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#ffa94d" transparent opacity={0.3} linewidth={1} />
        </lineSegments>
      )}
      
      {/* Trust anchor visualization */}
      {hasTrusted && (
        <mesh position={[0, 12, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#51cf66" transparent opacity={0.7} />
          <Html distanceFactor={15} style={{ pointerEvents: "none" }}>
            <div style={{
              background: "rgba(81, 207, 102, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              whiteSpace: "nowrap"
            }}>
              Trust Anchor
            </div>
          </Html>
        </mesh>
      )}
    </>
  );
}

export function SceneView({ 
  nodes, 
  groups,
  schemaStatus,
  trustConfig
}: { 
  nodes: NodeRecord[]; 
  groups: GroupRecord[];
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
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

      {/* Trust graph visualization */}
      <TrustGraph groups={groups} schemaStatus={schemaStatus} trustConfig={trustConfig} />

      {/* Origin axes helper */}
      <axesHelper args={[8]} />
      <gridHelper args={[40, 40]} />
    </Canvas>
  );
}
