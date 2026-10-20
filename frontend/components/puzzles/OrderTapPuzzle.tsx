"use client";

import { useState } from "react";

type Props = {
  config: { items?: string[]; order?: string[] };
  onSubmit: (answer: string) => void;
};

/**
 * "order_tap" puzzle template: tap the shuffled items in the correct order.
 * Deliberately tap-only, not drag-and-drop - native HTML5 drag has poor
 * touch support without extra libraries, and this audience is mostly on
 * tablets/phones (see docs/CONCEPT.md). Wrong taps just shake and reject,
 * no penalty, consistent with how choice/input already work.
 */
export default function OrderTapPuzzle({ config, onSubmit }: Props) {
  const items = config.items ?? [];
  const order = config.order ?? items;

  const [placed, setPlaced] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);

  const allPlaced = placed.length === order.length;

  function tap(item: string, i: number) {
    if (usedIndices.has(i) || allPlaced) return;
    const expected = order[placed.length];
    if (item !== expected) {
      setShakeIndex(i);
      setTimeout(() => setShakeIndex(null), 250);
      return;
    }
    setPlaced((prev) => [...prev, item]);
    setUsedIndices((prev) => new Set(prev).add(i));
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          minHeight: "2.75rem",
          padding: "0.5rem",
          border: "1px dashed #999",
          borderRadius: 8,
        }}
      >
        {placed.length === 0 && <span style={{ opacity: 0.5 }}>Твой порядок появится здесь</span>}
        {placed.map((p, i) => (
          <span
            key={i}
            style={{ padding: "0.4rem 0.7rem", background: "#dff5e1", borderRadius: 6, fontSize: "1.1rem" }}
          >
            {p}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => tap(item, i)}
            disabled={usedIndices.has(i)}
            style={{
              fontSize: "1.25rem",
              padding: "0.5rem 1rem",
              opacity: usedIndices.has(i) ? 0.2 : 1,
              transform: shakeIndex === i ? "translateX(4px)" : "none",
              transition: "transform 0.1s ease, opacity 0.2s ease",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <button style={{ marginTop: "1rem" }} disabled={!allPlaced} onClick={() => onSubmit(placed.join(","))}>
        Готово
      </button>
    </div>
  );
}
