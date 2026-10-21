"use client";

import { useId, useState } from "react";
import type { QuestMapEntry, QuestMapQuest } from "../lib/questMap";
import {
  BADGE_RADIUS,
  LABEL_GAP,
  LABEL_HEIGHT,
  LABEL_WIDTH,
  LANE_LEFT_X,
  buildQuestMapLayout,
} from "../lib/questMapLayout";

type QuestMapSceneProps<T extends QuestMapQuest> = {
  entries: QuestMapEntry<T>[];
};

export default function QuestMapScene<T extends QuestMapQuest>({ entries }: QuestMapSceneProps<T>) {
  const [hintQuestId, setHintQuestId] = useState<number | null>(null);
  const layout = buildQuestMapLayout(entries.length);
  const start = layout.nodes[0];
  const finish = layout.nodes[layout.nodes.length - 1];
  // Gradient ids must be unique per <svg> in the document: the home page
  // renders one scene per subject, so a hardcoded id would collide.
  const sceneId = useId();
  const skyGradientId = `${sceneId}-sky`;
  const pondGradientId = `${sceneId}-pond`;

  return (
    <div className="quest-scene">
      <svg
        viewBox={`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`}
        role="img"
        aria-label="Карта программы: путь из заданий"
      >
        <defs>
          <linearGradient id={skyGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eaf6f8" />
            <stop offset="100%" stopColor="#bfe3a0" />
          </linearGradient>
          <radialGradient id={pondGradientId} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#bfe6ef" />
            <stop offset="100%" stopColor="#7cc0d6" />
          </radialGradient>
        </defs>

        <rect
          x={0}
          y={0}
          width={layout.viewBoxWidth}
          height={layout.viewBoxHeight}
          fill={`url(#${skyGradientId})`}
        />

        <g className="quest-scene-layer-far">
          <g className="quest-scene-cloud">
            <ellipse cx={layout.viewBoxWidth * 0.22} cy={layout.viewBoxHeight * 0.08} rx={34} ry={14} />
            <ellipse cx={layout.viewBoxWidth * 0.3} cy={layout.viewBoxHeight * 0.06} rx={24} ry={11} />
          </g>
          <g className="quest-scene-cloud">
            <ellipse cx={layout.viewBoxWidth * 0.72} cy={layout.viewBoxHeight * 0.12} rx={30} ry={13} />
            <ellipse cx={layout.viewBoxWidth * 0.8} cy={layout.viewBoxHeight * 0.1} rx={20} ry={10} />
          </g>
        </g>

        <g className="quest-scene-layer-mid">
          <rect
            x={layout.viewBoxWidth * 0.08}
            y={layout.viewBoxHeight * 0.1}
            width={layout.viewBoxWidth * 0.84}
            height={layout.viewBoxHeight * 0.82}
            rx={layout.viewBoxWidth * 0.18}
            fill="#cfe3ac"
            opacity={0.55}
          />
          <ellipse
            cx={layout.viewBoxWidth * 0.78}
            cy={layout.viewBoxHeight * 0.32}
            rx={layout.viewBoxWidth * 0.1}
            ry={layout.viewBoxHeight * 0.05}
            fill={`url(#${pondGradientId})`}
          />
          <g className="quest-scene-stone">
            <ellipse cx={layout.viewBoxWidth * 0.14} cy={layout.viewBoxHeight * 0.55} rx={12} ry={8} />
            <ellipse cx={layout.viewBoxWidth * 0.88} cy={layout.viewBoxHeight * 0.68} rx={10} ry={7} />
            <ellipse cx={layout.viewBoxWidth * 0.1} cy={layout.viewBoxHeight * 0.85} rx={11} ry={7} />
          </g>
        </g>

        <g className="quest-scene-layer-near">
          <text x={start.x} y={start.y + BADGE_RADIUS + 28} textAnchor="middle" fontSize={22}>
            🏁
          </text>
          <text x={finish.x} y={finish.y - BADGE_RADIUS - 14} textAnchor="middle" fontSize={22}>
            🏆
          </text>

          <path className="quest-scene-path" d={layout.pathD} />
          <path className="quest-scene-path-dashes" d={layout.pathD} />

          {entries.map((entry) => {
            const pos = layout.nodes[entry.globalIndex];
            const isLeftLane = pos.x === LANE_LEFT_X;
            const labelX = isLeftLane
              ? pos.x + BADGE_RADIUS + LABEL_GAP
              : pos.x - BADGE_RADIUS - LABEL_GAP - LABEL_WIDTH;

            const badgeContent = (
              <>
                <g className="quest-node-badge-group">
                  {entry.status === "current" && (
                    <circle className="quest-node-glow" cx={pos.x} cy={pos.y} r={BADGE_RADIUS} />
                  )}
                  <circle className="quest-node-badge-fill" cx={pos.x} cy={pos.y} r={BADGE_RADIUS} />
                  <text className="quest-node-icon" x={pos.x} y={pos.y + 10} textAnchor="middle">
                    {entry.icon}
                  </text>
                </g>
                {entry.status === "completed" && (
                  <g className="quest-node-overlay quest-node-check">
                    <circle cx={pos.x + 22} cy={pos.y - 22} r={13} />
                    <text x={pos.x + 22} y={pos.y - 17} textAnchor="middle">
                      ✓
                    </text>
                  </g>
                )}
                {entry.status === "locked" && (
                  <g className="quest-node-overlay quest-node-lock">
                    <circle cx={pos.x + 22} cy={pos.y + 22} r={13} />
                    <text x={pos.x + 22} y={pos.y + 27} textAnchor="middle">
                      🔒
                    </text>
                  </g>
                )}
                <foreignObject x={labelX} y={pos.y - LABEL_HEIGHT / 2} width={LABEL_WIDTH} height={LABEL_HEIGHT}>
                  <div className="quest-node-label">
                    <span className="quest-node-grade">{entry.quest.grade} класс</span>
                    <span className="quest-node-title">{entry.quest.title}</span>
                  </div>
                </foreignObject>
              </>
            );

            if (entry.status === "locked") {
              return (
                <g
                  key={entry.quest.id}
                  className="quest-node quest-node-locked"
                  role="button"
                  tabIndex={0}
                  onClick={() => setHintQuestId(entry.quest.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHintQuestId(entry.quest.id);
                    }
                  }}
                >
                  {badgeContent}
                  {hintQuestId === entry.quest.id && (
                    <foreignObject
                      x={isLeftLane ? pos.x - BADGE_RADIUS : pos.x - BADGE_RADIUS - LABEL_WIDTH}
                      y={pos.y + BADGE_RADIUS + 8}
                      width={LABEL_WIDTH + BADGE_RADIUS}
                      height={56}
                    >
                      <p className="quest-node-hint" role="status">
                        Сначала пройди предыдущее задание
                      </p>
                    </foreignObject>
                  )}
                </g>
              );
            }

            return (
              <a
                key={entry.quest.id}
                href={`/quest/${entry.quest.id}`}
                className={`quest-node quest-node-${entry.status}`}
              >
                {badgeContent}
              </a>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
