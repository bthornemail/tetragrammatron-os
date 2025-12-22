import * as THREE from "three";
import React, { useMemo, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { GroupRecord, NodeRecord } from "../lib/lattice";
import { SchemaClass } from "../lib/model";

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

export function SceneView({ nodes, groups }: { nodes: NodeRecord[]; groups: GroupRecord[] }) {
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
