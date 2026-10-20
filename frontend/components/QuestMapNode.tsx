"use client";

import { useState, type CSSProperties } from "react";
import type { QuestMapStatus } from "../lib/questMap";

type QuestMapNodeProps = {
  questId: number;
  title: string;
  grade: number;
  status: QuestMapStatus;
  icon: string;
  index: number;
};

export default function QuestMapNode({ questId, title, grade, status, icon, index }: QuestMapNodeProps) {
  const [showHint, setShowHint] = useState(false);

  const badge = (
    <>
      <span className="quest-map-node-icon" aria-hidden="true">
        {icon}
      </span>
      {status === "completed" && (
        <span className="quest-map-node-check" aria-hidden="true">
          ✓
        </span>
      )}
      {status === "locked" && (
        <span className="quest-map-node-lock" aria-hidden="true">
          🔒
        </span>
      )}
    </>
  );

  const label = (
    <span className="quest-map-node-label">
      <span className="quest-map-node-grade">{grade} класс</span>
      <span className="quest-map-node-title">{title}</span>
    </span>
  );

  return (
    <li
      className="quest-map-node-row stagger-item"
      style={{ "--stagger-index": index } as CSSProperties}
    >
      <div className="quest-map-node-wrap">
        {status === "locked" ? (
          <button
            type="button"
            className="quest-map-node quest-map-node-locked"
            onClick={() => setShowHint(true)}
          >
            <span className="quest-map-node-badge">{badge}</span>
            {label}
          </button>
        ) : (
          <a
            href={`/quest/${questId}`}
            className={`quest-map-node ${
              status === "completed" ? "quest-map-node-completed" : "quest-map-node-current"
            }`}
          >
            <span className="quest-map-node-badge">{badge}</span>
            {label}
          </a>
        )}
        {showHint && (
          <p className="quest-map-hint" role="status">
            Сначала пройди предыдущее задание
          </p>
        )}
      </div>
    </li>
  );
}
