"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { QuestMapEntry, QuestMapQuest } from "../lib/questMap";
import { drawParkIllustration } from "../lib/parkIllustration";
import { MAP_HEIGHT, MAP_WIDTH, buildParkRoute, routeSegmentPath } from "../lib/parkRoute";

type ParkBoardProps<T extends QuestMapQuest> = {
  entries: QuestMapEntry<T>[];
  title: string;
};

const MIN_SCALE = 0.35;
const MAX_SCALE = 2.2;
const ILLUSTRATION_DPR = 1.5;
const LOCKED_HINT = "Сначала пройди предыдущее задание";

const PIN_ICONS = {
  completed: <path d="M11 17l4 4 8-9" fill="none" stroke="#2fa88a" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />,
  current: <path d="M17 8l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" fill="#ff7a3d" />,
  locked: (
    <>
      <path d="M13 16v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#6e7390" strokeWidth={2.6} />
      <rect x={11} y={16} width={12} height={9} rx={2} fill="#6e7390" />
    </>
  ),
};
const PIN_COLORS = { completed: "#2fa88a", current: "#ff7a3d", locked: "#6e7390" };

function Pin({ status }: { status: keyof typeof PIN_ICONS }) {
  return (
    <svg className={`park-pin park-pin-${status}`} viewBox="0 0 34 46" aria-hidden="true">
      <path d="M17 45C17 45 3 28 3 17a14 14 0 0 1 28 0c0 11-14 28-14 28z" fill={PIN_COLORS[status]} stroke="#fff" strokeWidth={2} />
      <circle cx={17} cy={17} r={10} fill="#fff" />
      {PIN_ICONS[status]}
    </svg>
  );
}

function Token() {
  return (
    <svg className="park-token-figure" viewBox="0 0 52 70" aria-hidden="true">
      <ellipse cx={26} cy={66} rx={14} ry={4} fill="rgba(0,0,0,.4)" />
      <rect x={14} y={34} width={24} height={28} rx={9} fill="#ff7a3d" />
      <circle cx={26} cy={24} r={14} fill="#ffd7b3" />
      <path d="M12 22a14 14 0 0 1 28 0z" fill="#6b3d2e" />
      <circle cx={18} cy={26} r={5} fill="#6b3d2e" />
      <circle cx={34} cy={26} r={5} fill="#6b3d2e" />
      <circle cx={21} cy={25} r={1.8} fill="#3a2e26" />
      <circle cx={31} cy={25} r={1.8} fill="#3a2e26" />
      <path d="M21 30q5 5 10 0" fill="none" stroke="#c9596e" strokeWidth={2} strokeLinecap="round" />
      <circle cx={26} cy={24} r={17} fill="none" stroke="#fff" strokeWidth={3} />
    </svg>
  );
}

const CLOUDS: Array<[number, number, number, number]> = [[120, 40, 1, 28], [620, 90, 0.7, 36], [1250, 50, 0.9, 32], [1750, 170, 0.6, 40]];

export default function ParkBoard<T extends QuestMapQuest>({ entries, title }: ParkBoardProps<T>) {
  const route = useMemo(() => buildParkRoute(entries.length), [entries.length]);
  const currentIndex = entries.findIndex((e) => e.status === "current");
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const lastCompletedIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex === -1 ? entries.length - 1 : -1;
  const tokenDistance = lastCompletedIndex >= 0 ? route.cells[lastCompletedIndex].distance : Math.max(0, (route.cells[0]?.distance ?? 60) - 60);
  const tokenPos = route.pointAt(tokenDistance);
  const trailD = currentIndex > 0 ? routeSegmentPath(route, tokenDistance, route.cells[currentIndex].distance) : "";
  const current = currentIndex >= 0 ? entries[currentIndex] : null;

  const [hintQuestId, setHintQuestId] = useState<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Трансформ карты живёт в ref и пишется в style напрямую: перерисовывать React-дерево
  // на каждый pointermove при перетаскивании слишком дорого для DOM из десятков узлов.
  const mapRef = useRef<HTMLDivElement>(null);
  const view = useRef({ scale: 1, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const apply = () => {
    const vp = viewportRef.current;
    const map = mapRef.current;
    if (!vp || !map) return;
    const v = view.current;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const mw = MAP_WIDTH * v.scale;
    const mh = MAP_HEIGHT * v.scale;
    v.tx = mw <= vw ? (vw - mw) / 2 : Math.min(0, Math.max(vw - mw, v.tx));
    v.ty = mh <= vh ? (vh - mh) / 2 : Math.min(0, Math.max(vh - mh, v.ty));
    map.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
  };
  const zoomAt = (factor: number, cx: number, cy: number) => {
    const v = view.current;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
    const k = next / v.scale;
    v.tx = cx - (cx - v.tx) * k;
    v.ty = cy - (cy - v.ty) * k;
    v.scale = next;
    apply();
  };
  const focusOn = (x: number, y: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const v = view.current;
    v.tx = vp.clientWidth / 2 - x * v.scale;
    v.ty = vp.clientHeight / 2 - y * v.scale;
    apply();
  };
  const zoomByButton = (factor: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    zoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.width = MAP_WIDTH * ILLUSTRATION_DPR;
    canvas.height = MAP_HEIGHT * ILLUSTRATION_DPR;
    ctx.scale(ILLUSTRATION_DPR, ILLUSTRATION_DPR);
    drawParkIllustration(ctx, route, title);
  }, [route, title]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const v = view.current;
    v.scale = Math.max(0.5, Math.min(1, vp.clientHeight / MAP_HEIGHT, vp.clientWidth / MAP_WIDTH));
    focusOn(tokenPos.x, tokenPos.y - 60);
    // wheel должен быть non-passive, чтобы страница не скроллилась вместо зума карты
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - rect.left, e.clientY - rect.top);
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", apply);
    return () => {
      vp.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", apply);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenPos.x, tokenPos.y]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const v = view.current;
    drag.current = { x: e.clientX - v.tx, y: e.clientY - v.ty, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const v = view.current;
    const nx = e.clientX - d.x;
    const ny = e.clientY - d.y;
    if (!d.moved && Math.hypot(nx - v.tx, ny - v.ty) > 4) d.moved = true;
    if (!d.moved) return;
    v.tx = nx;
    v.ty = ny;
    apply();
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  // После перетаскивания браузер всё равно шлёт click по узлу под курсором — глушим его
  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current?.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="park-board">
      <div
        ref={viewportRef}
        className="park-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        <div ref={mapRef} className="park-map" style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}>
          <canvas ref={canvasRef} className="park-illustration" aria-label={`Карта программы «${title}»`} role="img" />
          {CLOUDS.map(([x, y, s, dur], i) => (
            <svg
              key={i}
              className="park-cloud"
              viewBox="0 0 220 80"
              style={{ left: x, top: y, width: 220 * s, height: 80 * s, animationDuration: `${dur}s`, animationDelay: `${-dur * 0.37 * (i + 1)}s` } as CSSProperties}
              aria-hidden="true"
            >
              <g fill="#fffaf0" opacity={0.92}>
                <ellipse cx={70} cy={50} rx={60} ry={24} />
                <ellipse cx={120} cy={40} rx={48} ry={30} />
                <ellipse cx={165} cy={52} rx={44} ry={20} />
                <ellipse cx={40} cy={58} rx={30} ry={14} />
              </g>
            </svg>
          ))}
          <svg className="park-bird" viewBox="0 0 46 20" style={{ left: 900, top: 160 }} aria-hidden="true">
            <path d="M2 12Q12 2 22 12Q32 2 44 12" fill="none" stroke="#dfe6ff" strokeWidth={2.5} strokeLinecap="round" />
          </svg>

          <svg className="park-trail" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} aria-hidden="true">
            {trailD && <path d={trailD} />}
          </svg>

          {entries.map((entry, i) => {
            const cell = route.cells[i];
            const number = i + 1;
            const nodeClass = `park-node park-node-${entry.status}`;
            const style = { left: cell.x, top: cell.y };
            const body = (
              <>
                <Pin status={entry.status} />
                <span className="park-point">{number}</span>
                <span className="park-node-title">{entry.quest.title}</span>
              </>
            );
            if (entry.status === "locked") {
              const showHint = () => setHintQuestId(entry.quest.id);
              return (
                <div
                  key={entry.quest.id}
                  className={nodeClass}
                  style={style}
                  role="button"
                  tabIndex={0}
                  aria-label={`${number}. ${entry.quest.title} — закрыто`}
                  onClick={showHint}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      showHint();
                    }
                  }}
                >
                  {body}
                  {hintQuestId === entry.quest.id && (
                    <p className="park-hint" role="status">
                      {LOCKED_HINT}
                    </p>
                  )}
                </div>
              );
            }
            return (
              <a key={entry.quest.id} href={`/quest/${entry.quest.id}`} className={nodeClass} style={style} aria-label={`${number}. ${entry.quest.title}`}>
                {body}
              </a>
            );
          })}

          {current && (
            <div className="park-tip" style={{ left: route.cells[currentIndex].x, top: route.cells[currentIndex].y }}>
              <b>Твой ход:</b> {current.quest.title}
            </div>
          )}

          <div className="park-token" style={{ left: tokenPos.x, top: tokenPos.y }} aria-hidden="true">
            <Token />
          </div>
        </div>
      </div>

      <div className="park-hud">
        <div className="park-badge">
          <div className="park-badge-title">{title}</div>
          <div className="park-badge-sub">
            <b>{completedCount} / {entries.length}</b> клеток пройдено
          </div>
        </div>
        <div className="park-legend" aria-hidden="true">
          <span className="park-legend-completed">пройдено</span>
          <span className="park-legend-current">твой ход</span>
          <span className="park-legend-locked">закрыто</span>
        </div>
        <div className="park-mapctl">
          <button type="button" onClick={() => focusOn(tokenPos.x, tokenPos.y)} aria-label="Показать мою фишку">◎</button>
          <button type="button" onClick={() => zoomByButton(1.25)} aria-label="Приблизить">+</button>
          <button type="button" onClick={() => zoomByButton(1 / 1.25)} aria-label="Отдалить">−</button>
        </div>
        {current ? (
          <a className="btn btn-primary park-cta" href={`/quest/${current.quest.id}`}>
            Сделать ход: {current.quest.title}
          </a>
        ) : (
          <span className="btn park-cta park-cta-done">Программа пройдена!</span>
        )}
        <div className="park-progress">
          <div className="park-progress-row">
            <span>Пройдено {completedCount} из {entries.length}</span>
            <span>Цель: кубок</span>
          </div>
          <div className="park-progress-track">
            <div className="park-progress-fill" style={{ width: `${entries.length ? (completedCount / entries.length) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
