"use client";

import { useEffect, useState } from "react";
import IslandCanvas from "../../components/IslandCanvas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hardcoded for the scaffold - wire up real auth/student selection later.
const DEMO_STUDENT_ID = 1;

type Island = {
  student_id: number;
  growth_points: number;
  stage: number;
};

export default function IslandPage() {
  const [island, setIsland] = useState<Island | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/students/${DEMO_STUDENT_ID}/island`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setIsland)
      .catch(() => setIsland(null));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Остров</h1>
      <p>Очки роста: {island?.growth_points ?? 0}</p>
      <IslandCanvas stage={island?.stage ?? 0} />
    </main>
  );
}
