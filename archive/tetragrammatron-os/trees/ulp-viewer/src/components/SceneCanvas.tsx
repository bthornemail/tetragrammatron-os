import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TreeScene } from "./TreeScene";
import type { NodeMeta } from "../lib/model";

export function SceneCanvas({
  base,
  graph,
  onPick
}: {
  base: string;
  graph: any;
  onPick: (m: NodeMeta) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 18, 42], fov: 55 }}>
      <ambientLight intensity={0.9} />
      <directionalLight intensity={0.6} position={[20, 30, 10]} />
      <OrbitControls enableDamping />
      <TreeScene base={base} graph={graph} onPick={onPick} />
    </Canvas>
  );
}

