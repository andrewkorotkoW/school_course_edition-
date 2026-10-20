"use client";

import { useState } from "react";

type Props = {
  config: { emoji?: string; count?: number };
  onSubmit: (answer: string) => void;
};

/**
 * "count_click" puzzle template: click each item to collect it, then confirm
 * the total. Plain React state + CSS transitions on purpose - no canvas/game
 * engine, so there's nothing that can get paused by a hidden tab the way the
 * old Phaser pet did.
 */
export default function CountClickPuzzle({ config, onSubmit }: Props) {
  const emoji = config.emoji ?? "🍎";
  const total = config.count ?? 3;
  const [collected, setCollected] = useState<boolean[]>(() => Array(total).fill(false));

  const collectedCount = collected.filter(Boolean).length;
  const allCollected = collectedCount === total;

  function collect(i: number) {
    if (collected[i]) return;
    setCollected((prev) => {
      const next = [...prev];
      next[i] = true;
      return next;
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {collected.map((isCollected, i) => (
          <button
            key={i}
            onClick={() => collect(i)}
            disabled={isCollected}
            aria-label={`Собрать предмет ${i + 1} из ${total}`}
            style={{
              fontSize: "2.5rem",
              lineHeight: 1,
              background: "none",
              border: "none",
              padding: 0,
              cursor: isCollected ? "default" : "pointer",
              opacity: isCollected ? 0.15 : 1,
              transform: isCollected ? "scale(0.75)" : "scale(1)",
              transition: "opacity 0.2s ease, transform 0.2s ease",
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p>Собрано: {collectedCount}</p>

      <button onClick={() => onSubmit(String(collectedCount))} disabled={!allCollected}>
        Готово
      </button>
    </div>
  );
}
