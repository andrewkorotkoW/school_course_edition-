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
      setTimeout(() => setShakeIndex(null), 400);
      return;
    }
    setPlaced((prev) => [...prev, item]);
    setUsedIndices((prev) => new Set(prev).add(i));
  }

  return (
    <div>
      <div className="card order-tap-answer-zone">
        {placed.length === 0 && <span className="order-tap-placeholder">Твой порядок появится здесь</span>}
        {placed.map((p, i) => (
          <span key={i} className="order-tap-pill">
            {p}
          </span>
        ))}
      </div>

      <div className="order-tap-tiles">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => tap(item, i)}
            disabled={usedIndices.has(i)}
            className={`order-tap-tile ${shakeIndex === i ? "shake-error" : ""}`}
          >
            {item}
          </button>
        ))}
      </div>

      <button className="btn btn-primary" disabled={!allPlaced} onClick={() => onSubmit(placed.join(","))}>
        Готово
      </button>
    </div>
  );
}
