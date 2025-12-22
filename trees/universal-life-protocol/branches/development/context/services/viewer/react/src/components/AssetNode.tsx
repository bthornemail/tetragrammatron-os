import React, { Suspense } from "react";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader";

type Props = {
  base: string;
  candidates: string[];
};

function normalize(base: string, p: string) {
  return base.replace(/\/+$/, "") + "/" + p.replace(/^\/+/, "");
}

/* ---------- GLB ---------- */

function GLB({ url }: { url: string }) {
  const gltf = useGLTF(url);
  return <primitive object={gltf.scene} scale={0.8} />;
}

/* ---------- OBJ + MTL ---------- */

function OBJMTL({ objUrl, mtlUrl }: { objUrl: string; mtlUrl: string }) {
  const materials = useLoader(MTLLoader, mtlUrl);
  const obj = useLoader(OBJLoader, objUrl, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });
  return <primitive object={obj} scale={0.8} />;
}

/* ---------- SVG ---------- */

function SVG({ url }: { url: string }) {
  const data = useLoader(SVGLoader, url);

  const group = new THREE.Group();
  data.paths.forEach((path) => {
    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geom = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshStandardMaterial({
        color: path.color || "#999",
        side: THREE.DoubleSide,
        metalness: 0,
        roughness: 0.9
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);
    });
  });

  group.scale.setScalar(0.02);
  group.rotation.x = -Math.PI / 2;

  return <primitive object={group} />;
}

/* ---------- Resolver ---------- */

export function AssetNode({ base, candidates }: Props) {
  // Normalize + classify
  const urls = candidates.map((p) => normalize(base, p));

  const glb = urls.find((u) => u.endsWith(".glb"));
  if (glb) {
    return (
      <Suspense fallback={null}>
        <GLB url={glb} />
      </Suspense>
    );
  }

  const obj = urls.find((u) => u.endsWith(".obj"));
  if (obj) {
    const mtl = obj.replace(/\.obj$/, ".mtl");
    return (
      <Suspense fallback={null}>
        <OBJMTL objUrl={obj} mtlUrl={mtl} />
      </Suspense>
    );
  }

  const svg = urls.find((u) => u.endsWith(".svg"));
  if (svg) {
    return (
      <Suspense fallback={null}>
        <SVG url={svg} />
      </Suspense>
    );
  }

  return null;
}

