export const MAP_WIDTH = 2000;
export const MAP_HEIGHT = 1100;

// Опорные точки дороги в координатах иллюстрации (2000×1100): от входа внизу,
// петлёй вокруг бассейна, через весь парк до кубка у колеса обозрения.
// Когда подложку заменит рисунок художника, меняется только этот массив.
export const ROUTE_POINTS: ReadonlyArray<readonly [number, number]> = [
  [1000, 1040], [820, 980], [600, 940], [380, 880], [240, 760], [300, 620], [520, 560],
  [780, 590], [1000, 540], [1240, 520], [1480, 560], [1720, 620], [1880, 520], [1820, 400],
  [1600, 330], [1350, 330], [1100, 350], [860, 380], [640, 440], [520, 470],
];

// Клетки занимают среднюю часть дороги: первая — чуть после входа, последняя — чуть до кубка.
const CELLS_START = 0.06;
const CELLS_SPAN = 0.88;

export type RoutePoint = { x: number; y: number };
export type RouteCell = RoutePoint & { distance: number };

export type ParkRoute = {
  curve: RoutePoint[];
  total: number;
  pointAt: (distance: number) => RoutePoint;
  cells: RouteCell[];
};

function catmullRom(points: ReadonlyArray<readonly [number, number]>, step = 0.02): RoutePoint[] {
  const out: RoutePoint[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let t = 0; t < 1; t += step) {
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        y: 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      });
    }
  }
  const last = points[points.length - 1];
  out.push({ x: last[0], y: last[1] });
  return out;
}

export function cellDistances(cellCount: number, total: number): number[] {
  const count = Math.max(0, cellCount);
  if (count === 0) return [];
  if (count === 1) return [total * (CELLS_START + CELLS_SPAN / 2)];
  return Array.from({ length: count }, (_, i) => total * (CELLS_START + (CELLS_SPAN * i) / (count - 1)));
}

export function buildParkRoute(cellCount: number): ParkRoute {
  const curve = catmullRom(ROUTE_POINTS);
  const lengths = [0];
  for (let i = 1; i < curve.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(curve[i].x - curve[i - 1].x, curve[i].y - curve[i - 1].y));
  }
  const total = lengths[lengths.length - 1];

  const pointAt = (distance: number): RoutePoint => {
    const d = Math.max(0, Math.min(total, distance));
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < d) i++;
    const a = curve[i - 1];
    const b = curve[i];
    const segment = lengths[i] - lengths[i - 1] || 1;
    const t = (d - lengths[i - 1]) / segment;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  const cells = cellDistances(cellCount, total).map((distance) => ({ ...pointAt(distance), distance }));
  return { curve, total, pointAt, cells };
}

// Полилиния дороги между двумя дистанциями — для пунктира «куда ходить» от фишки к текущей клетке.
export function routeSegmentPath(route: ParkRoute, from: number, to: number, step = 4): string {
  if (to <= from) return "";
  const parts: string[] = [];
  for (let d = from; d <= to; d += step) {
    const p = route.pointAt(d);
    parts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  const end = route.pointAt(to);
  parts.push(`${end.x.toFixed(1)},${end.y.toFixed(1)}`);
  return `M${parts.join(" L")}`;
}
