import * as THREE from "three";
import React, { useMemo, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GroupRecord, NodeRecord } from "../lib/lattice";
import { SchemaClass } from "../lib/model";
import { TrustConfig } from "../lib/trust-config";
import { Esp32TelemetryData, ExecutionState } from "../lib/esp32-telemetry";
import { parseAddr8 } from "../lib/model";

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

// Convert ESP32 address string to 3D position
function posFromAddrString(addrStr: string): THREE.Vector3 {
  const addr = parseAddr8(addrStr);
  if (!addr) {
    // Fallback: hash the string
    let hash = 0;
    for (let i = 0; i < addrStr.length; i++) {
      hash = ((hash << 5) - hash) + addrStr.charCodeAt(i);
      hash = hash & hash;
    }
    const x = ((hash & 0xFF) / 255) * 20 - 10;
    const y = (((hash >> 8) & 0xFF) / 255) * 20 - 10;
    const z = (((hash >> 16) & 0xFF) / 255) * 20 - 10;
    return new THREE.Vector3(x, y, z);
  }
  const b = addr.bytes;
  const x = (b[1]! / 255) * 20 - 10;
  const y = (b[2]! / 255) * 20 - 10;
  const z = (b[3]! / 255) * 20 - 10;
  return new THREE.Vector3(x, y, z);
}

// Get color for execution status
function statusToColor(status: ExecutionState["status"]): string {
  switch (status) {
    case "ok": return "#51cf66";
    case "halt": return "#ffd43b";
    case "trap": return "#ff6b6b";
    case "pc_overflow": return "#ff8787";
    case "unknown_opcode": return "#ff8787";
    case "admiss_violation": return "#ff6b6b";
    case "error": return "#ff6b6b";
    case "running": return "#4dabf7";
    default: return "#868e96";
  }
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

// Execution nodes: visualize CAN VM executions
function ExecutionNodes({ telemetry }: { telemetry: Esp32TelemetryData }) {
  const { activeNodes, completedNodes } = useMemo(() => {
    const active: Array<{ pos: THREE.Vector3; exec: ExecutionState }> = [];
    const completed: Array<{ pos: THREE.Vector3; exec: ExecutionState }> = [];
    
    for (const exec of telemetry.executions.values()) {
      const pos = posFromAddrString(exec.address);
      active.push({ pos, exec });
    }
    
    for (const exec of telemetry.completedExecutions.slice(-20)) { // Last 20 completed
      const pos = posFromAddrString(exec.address);
      completed.push({ pos, exec });
    }
    
    return { activeNodes: active, completedNodes: completed };
  }, [telemetry]);

  return (
    <>
      {/* Active executions - pulsing spheres */}
      {activeNodes.map(({ pos, exec }, i) => (
        <mesh key={`active-${exec.address}`} position={pos}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial 
            color={statusToColor(exec.status)} 
            transparent 
            opacity={0.7}
          />
          <Html distanceFactor={15} style={{ pointerEvents: "none" }}>
            <div style={{
              background: "rgba(0,0,0,0.7)",
              color: "white",
              padding: "4px 6px",
              borderRadius: 6,
              fontSize: 11,
              whiteSpace: "nowrap"
            }}>
              <div><b>{exec.address}</b></div>
              <div>status: {exec.status}</div>
              <div>steps: {exec.steps}</div>
              <div>ticks: {exec.ticks}</div>
            </div>
          </Html>
        </mesh>
      ))}
      
      {/* Completed executions - smaller static spheres */}
      {completedNodes.map(({ pos, exec }, i) => (
        <mesh key={`completed-${exec.address}-${i}`} position={pos}>
          <sphereGeometry args={[0.4, 12, 12]} />
          <meshBasicMaterial 
            color={statusToColor(exec.status)} 
            transparent 
            opacity={0.5}
          />
        </mesh>
      ))}
    </>
  );
}

// Execution trails: connect execution events
function ExecutionTrails({ telemetry }: { telemetry: Esp32TelemetryData }) {
  const trails = useMemo(() => {
    const segs: number[] = [];
    
    // Create trails for active executions with multiple emit events
    for (const exec of telemetry.executions.values()) {
      if (exec.emitEvents.length < 2) continue;
      
      const basePos = posFromAddrString(exec.address);
      
      // Create a trail from base position through emit events
      let prevPos = basePos;
      for (let i = 0; i < exec.emitEvents.length; i++) {
        const offset = (i + 1) * 0.3;
        const nextPos = basePos.clone().add(new THREE.Vector3(0, offset, 0));
        segs.push(prevPos.x, prevPos.y, prevPos.z, nextPos.x, nextPos.y, nextPos.z);
        prevPos = nextPos;
      }
    }
    
    return new Float32Array(segs);
  }, [telemetry]);

  if (trails.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[trails, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#4dabf7" transparent opacity={0.4} />
    </lineSegments>
  );
}

// Error markers: visualize schema violations and input errors
function ErrorMarkers({ telemetry }: { telemetry: Esp32TelemetryData }) {
  const markers = useMemo(() => {
    // Place errors at fixed positions (could be improved to map to addresses)
    const positions: THREE.Vector3[] = [];
    const colors: string[] = [];
    
    // Place recent errors in a grid pattern
    const recentErrors = telemetry.errors.slice(-10);
    recentErrors.forEach((err, i) => {
      const x = -8 + (i % 5) * 4;
      const y = 8 - Math.floor(i / 5) * 4;
      positions.push(new THREE.Vector3(x, y, 0));
      colors.push(err.kind === "schema_violation" ? "#ff6b6b" : "#ffa94d");
    });
    
    return { positions, colors };
  }, [telemetry]);

  if (markers.positions.length === 0) return null;

  return (
    <>
      {markers.positions.map((pos, i) => (
        <mesh key={`error-${i}`} position={pos}>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshBasicMaterial 
            color={markers.colors[i]} 
            transparent 
            opacity={0.8}
          />
        </mesh>
      ))}
    </>
  );
}

export function SceneView({ 
  nodes, 
  groups,
  schemaStatus,
  trustConfig,
  telemetry
}: { 
  nodes: NodeRecord[]; 
  groups: GroupRecord[];
  schemaStatus?: Map<string, "ok" | "unsigned" | "invalid" | "untrusted">;
  trustConfig?: TrustConfig | null;
  telemetry?: Esp32TelemetryData | null;
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

      {/* CAN VM Execution visualization */}
      {telemetry && (
        <>
          <ExecutionNodes telemetry={telemetry} />
          <ExecutionTrails telemetry={telemetry} />
          <ErrorMarkers telemetry={telemetry} />
        </>
      )}

      {/* Origin axes helper */}
      <axesHelper args={[8]} />
      <gridHelper args={[40, 40]} />
    </Canvas>
  );
}
