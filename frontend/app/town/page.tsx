"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hardcoded for the scaffold - wire up real auth/student selection later.
const DEMO_STUDENT_ID = 1;

type Building = { key: string; name: string; cost: number; emoji: string };
type Town = {
  student_id: number;
  earned_points: number;
  balance: number;
  owned: Building[];
};

export default function TownPage() {
  const [town, setTown] = useState<Town | null>(null);
  const [catalog, setCatalog] = useState<Building[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refreshTown() {
    fetch(`${API_URL}/students/${DEMO_STUDENT_ID}/town`)
      .then((res) => res.json())
      .then(setTown);
  }

  useEffect(() => {
    refreshTown();
    fetch(`${API_URL}/buildings/catalog`)
      .then((res) => res.json())
      .then(setCatalog);
  }, []);

  async function buy(key: string) {
    setError(null);
    const res = await fetch(`${API_URL}/students/${DEMO_STUDENT_ID}/buildings/buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ building_key: key }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? "Не получилось купить");
      return;
    }
    setTown(data);
  }

  if (!town || !catalog) return <main style={{ padding: "2rem" }}>Загрузка...</main>;

  const ownedKeys = new Set(town.owned.map((b) => b.key));
  const shop = catalog.filter((b) => !ownedKeys.has(b.key));

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 560 }}>
      <h1>Городок</h1>
      <p>
        Баллы: <strong>{town.balance}</strong> (заработано всего: {town.earned_points})
      </p>

      <div
        style={{
          background: "linear-gradient(#bfe3ff 0%, #bfe3ff 55%, #8fd18c 55%, #8fd18c 100%)",
          borderRadius: 12,
          padding: "1.5rem",
          minHeight: 120,
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        {town.owned.length === 0 && <p style={{ opacity: 0.7 }}>Пока пусто — купи первую постройку в магазине.</p>}
        {town.owned.map((b) => (
          <div key={b.key} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>{b.emoji}</div>
            <div style={{ fontSize: "0.75rem" }}>{b.name}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: "2rem" }}>Магазин</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {shop.length === 0 && <p>Все постройки уже куплены!</p>}
        {shop.map((b) => (
          <button
            key={b.key}
            onClick={() => buy(b.key)}
            disabled={town.balance < b.cost}
            style={{ padding: "0.75rem 1rem", textAlign: "center", minWidth: 90 }}
          >
            <div style={{ fontSize: "2rem", lineHeight: 1 }}>{b.emoji}</div>
            <div>{b.name}</div>
            <div>{b.cost} баллов</div>
          </button>
        ))}
      </div>

      <p style={{ marginTop: "2rem" }}>
        <a href="/">← К заданиям</a>
      </p>
    </main>
  );
}
