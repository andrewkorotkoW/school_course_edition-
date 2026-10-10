"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

export type Building = { key: string; name: string; cost: number; emoji: string };

// Real low-poly models (Kenney "City Kit Commercial", CC0) mapped by eye to
// our catalog keys - see public/models/buildings/CREDITS.md for which
// original file each one is and why (no literal fountain/zoo/circus models
// exist in the pack, so cheaper buildings got smaller models, pricier ones
// got taller/grander ones).
const MODEL_URLS: Record<string, string> = {
  house: "/models/buildings/house.glb",
  stall: "/models/buildings/stall.glb",
  park: "/models/buildings/park.glb",
  library: "/models/buildings/library.glb",
  fountain: "/models/buildings/fountain.glb",
  zoo: "/models/buildings/zoo.glb",
  circus: "/models/buildings/circus.glb",
  tower: "/models/buildings/tower.glb",
};

Object.values(MODEL_URLS).forEach((url) => useGLTF.preload(url));

// The pack's own palette (via its shared colormap.png texture) is mostly
// white/grey concrete with blue glass - accurate, but flat and samey at a
// glance. Tinting each building type with its catalog color (material.color
// multiplies the texture) keeps the real architectural detail (windows,
// awnings, floor lines) while giving the town the lively, distinguishable
// colors the shop/catalog already promises.
const TINT: Record<string, string> = {
  house: "#f3d9a8",
  stall: "#f0a98f",
  park: "#bfe6c4",
  library: "#aac3eb",
  fountain: "#b9e8ef",
  zoo: "#dcbdf0",
  circus: "#f7b8cf",
  tower: "#f8dd94",
};

function tintScene(scene: THREE.Object3D, hex: string): THREE.Object3D {
  const clone = scene.clone(true);
  const tint = new THREE.Color(hex);
  clone.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const applyTint = (mat: THREE.Material) => {
      const cloned = mat.clone();
      if (cloned instanceof THREE.MeshStandardMaterial) {
        cloned.color = cloned.color.clone().multiply(tint);
      }
      return cloned;
    };
    obj.material = Array.isArray(obj.material) ? obj.material.map(applyTint) : applyTint(obj.material);
  });
  return clone;
}

function BuildingMesh({ building, position }: { building: Building; position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const url = MODEL_URLS[building.key] ?? MODEL_URLS.house;
  const { scene } = useGLTF(url);
  const tinted = tintScene(scene, TINT[building.key] ?? "#ffffff");

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Spring the scale up toward 1 every frame rather than a one-shot
    // delayed animation - if frames arrive late (tab was hidden) this just
    // catches up next tick instead of silently never firing.
    const next = THREE.MathUtils.damp(g.scale.x, 1, 6, delta);
    g.scale.setScalar(next);
  });

  return (
    <group ref={group} position={position} scale={0.01}>
      <primitive object={tinted} castShadow receiveShadow />
    </group>
  );
}

function Scene({ buildings }: { buildings: Building[] }) {
  const cols = 4;
  const spacing = 2.2;

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#8fd18c" />
      </mesh>

      {buildings.map((b, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = (col - (cols - 1) / 2) * spacing;
        const z = (row - 0.5) * spacing;
        return <BuildingMesh key={b.key} building={b} position={[x, 0, z]} />;
      })}

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.6}
        enablePan={false}
        minDistance={4}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export default function Town3D({ buildings }: { buildings: Building[] }) {
  return (
    <div style={{ width: "100%", height: 420, borderRadius: 12, overflow: "hidden" }}>
      <Canvas shadows camera={{ position: [8, 7, 10], fov: 45 }}>
        <color attach="background" args={["#bfe3ff"]} />
        {buildings.length > 0 ? (
          <Scene buildings={buildings} />
        ) : (
          <>
            <ambientLight intensity={0.7} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[24, 24]} />
              <meshStandardMaterial color="#8fd18c" />
            </mesh>
            <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan={false} />
          </>
        )}
      </Canvas>
    </div>
  );
}
