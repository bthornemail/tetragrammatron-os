import React from "react";
import { AssetNode } from "./AssetNode";
import type { NodeMeta } from "../lib/model";

type Props = {
  position: [number, number, number];
  meta: NodeMeta;
  base: string;
  assetCandidates?: string[];
  onPick: (meta: NodeMeta) => void;
};

function postOpenPath(path: string) {
  window.postMessage({ type: "ulp-open-path", path }, "*");
}

export function NodeMesh({
  position,
  meta,
  base,
  assetCandidates = [],
  onPick
}: Props) {
  return (
    <group position={position}>
      {/* Interaction shell */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onPick(meta);
          if (meta.kind === "entry" && meta.entry.path) {
            postOpenPath(meta.entry.path);
          }
        }}
      >
        <sphereGeometry args={[0.55, 16, 12]} />
        <meshStandardMaterial metalness={0.05} roughness={0.85} />
      </mesh>

      {/* Asset payload */}
      <AssetNode base={base} candidates={assetCandidates} />
    </group>
  );
}

