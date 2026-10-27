import { MAP_HEIGHT, MAP_WIDTH, buildParkRoute, cellDistances, routeSegmentPath } from "./parkRoute";

describe("buildParkRoute", () => {
  it("ставит ровно N клеток на дорогу, по порядку и внутри карты", () => {
    const route = buildParkRoute(10);
    expect(route.cells).toHaveLength(10);
    for (let i = 1; i < route.cells.length; i++) {
      expect(route.cells[i].distance).toBeGreaterThan(route.cells[i - 1].distance);
    }
    for (const cell of route.cells) {
      expect(cell.x).toBeGreaterThanOrEqual(0);
      expect(cell.x).toBeLessThanOrEqual(MAP_WIDTH);
      expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.y).toBeLessThanOrEqual(MAP_HEIGHT);
    }
  });

  it("соседние клетки не наезжают друг на друга (минимум ширина точки)", () => {
    const route = buildParkRoute(12);
    for (let i = 1; i < route.cells.length; i++) {
      const a = route.cells[i - 1];
      const b = route.cells[i];
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(40);
    }
  });

  it("одна клетка — в середине дороги; ноль клеток — пустой список, маршрут всё равно строится", () => {
    const one = buildParkRoute(1);
    expect(one.cells).toHaveLength(1);
    expect(one.cells[0].distance).toBeCloseTo(one.total * 0.5, 0);

    const none = buildParkRoute(0);
    expect(none.cells).toHaveLength(0);
    expect(none.total).toBeGreaterThan(0);
    expect(buildParkRoute(-3).cells).toHaveLength(0);
  });

  it("pointAt зажимает дистанцию в [0, total]: до старта — начало дороги, за финишем — конец", () => {
    const route = buildParkRoute(3);
    const start = route.pointAt(-100);
    const end = route.pointAt(route.total + 100);
    expect(start).toEqual(route.pointAt(0));
    expect(end).toEqual(route.pointAt(route.total));
    expect(route.curve[0]).toEqual(start);
  });

  it("cellDistances растёт равномерно от начала к концу рабочего участка", () => {
    const d = cellDistances(5, 1000);
    expect(d).toHaveLength(5);
    expect(d[0]).toBeCloseTo(60);
    expect(d[4]).toBeCloseTo(940);
    const steps = d.slice(1).map((v, i) => v - d[i]);
    for (const s of steps) expect(s).toBeCloseTo(steps[0]);
  });

  it("routeSegmentPath даёт SVG-путь от фишки до клетки и пустую строку для нулевого/обратного отрезка", () => {
    const route = buildParkRoute(4);
    const d = routeSegmentPath(route, route.cells[0].distance, route.cells[1].distance);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split(" L").length).toBeGreaterThan(5);
    expect(routeSegmentPath(route, 50, 50)).toBe("");
    expect(routeSegmentPath(route, 90, 50)).toBe("");
  });
});
