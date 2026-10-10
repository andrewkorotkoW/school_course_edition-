"use client";

import { useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export type Building = { key: string; name: string; cost: number; emoji: string };

type Style = {
  color: string;
  roofColor: string;
  height: number;
  roof: "pyramid" | "cone" | "flat";
};

// Same catalog keys as app/core/catalog.py - low-poly stand-ins for the
// emoji, not meant to replace them (the 2D shop still uses emoji icons).
const BUILDING_STYLE: Record<string, Style> = {
  house: { color: "#e8c07d", roofColor: "#b5542a", height: 1, roof: "pyramid" },
  stall: { color: "#d97b5f", roofColor: "#7a4b2b", height: 0.7, roof: "flat" },
  park: { color: "#7ed695", roofColor: "#4caf7d", height: 0.4, roof: "flat" },
  library: { color: "#8aa6d6", roofColor: "#4a6fa5", height: 1.3, roof: "pyramid" },
  fountain: { color: "#9fd8e0", roofColor: "#4bacc2", height: 0.5, roof: "cone" },
  zoo: { color: "#c99be0", roofColor: "#8a5aa8", height: 0.9, roof: "cone" },
  circus: { color: "#f28ba8", roofColor: "#d14f74", height: 1.6, roof: "cone" },
  tower: { color: "#f2c14e", roofColor: "#c9941f", height: 2.4, roof: "cone" },
};

function BuildingMesh({ building, position }: { building: Building; position: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const style = BUILDING_STYLE[building.key] ?? BUILDING_STYLE.house;

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
      <mesh position={[0, style.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, style.height, 1]} />
        <meshStandardMaterial color={style.color} flatShading />
      </mesh>

      {style.roof === "pyramid" && (
        <mesh position={[0, style.height + 0.35, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[0.8, 0.7, 4]} />
          <meshStandardMaterial color={style.roofColor} flatShading />
        </mesh>
      )}
      {style.roof === "cone" && (
        <mesh position={[0, style.height + 0.4, 0]} castShadow>
          <coneGeometry args={[0.6, 0.8, 16]} />
          <meshStandardMaterial color={style.roofColor} flatShading />
        </mesh>
      )}
      {style.roof === "flat" && (
        <mesh position={[0, style.height + 0.05, 0]} castShadow>
          <boxGeometry args={[1.1, 0.1, 1.1]} />
          <meshStandardMaterial color={style.roofColor} flatShading />
        </mesh>
      )}
    </group>
  );
}

function Scene({ buildings }: { buildings: Building[] }) {
  const cols = 4;
  const spacing = 1.8;

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
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
        maxDistance={14}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

export default function Town3D({ buildings }: { buildings: Building[] }) {
  return (
    <div style={{ width: "100%", height: 420, borderRadius: 12, overflow: "hidden" }}>
      <Canvas shadows camera={{ position: [6, 5, 8], fov: 45 }}>
        <color attach="background" args={["#bfe3ff"]} />
        {buildings.length > 0 ? (
          <Scene buildings={buildings} />
        ) : (
          <>
            <ambientLight intensity={0.7} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#8fd18c" />
            </mesh>
            <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan={false} />
          </>
        )}
      </Canvas>
    </div>
  );
}
