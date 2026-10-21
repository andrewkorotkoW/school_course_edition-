import { buildQuestMapLayout } from "./questMapLayout";

function uniqueCoordKey(count: number) {
  const layout = buildQuestMapLayout(count);
  return new Set(layout.nodes.map((n) => `${n.x},${n.y}`));
}

describe("buildQuestMapLayout", () => {
  it.each([1, 2, 9])("nodeCount=%i: возвращает ровно nodeCount узлов", (count) => {
    const layout = buildQuestMapLayout(count);
    expect(layout.nodes).toHaveLength(count);
  });

  it.each([1, 2, 9])("nodeCount=%i: все координаты узлов уникальны (узлы не накладываются)", (count) => {
    const keys = uniqueCoordKey(count);
    expect(keys.size).toBe(count);
  });

  it.each([1, 2, 9])("nodeCount=%i: viewBox положителен", (count) => {
    const layout = buildQuestMapLayout(count);
    expect(layout.viewBoxWidth).toBeGreaterThan(0);
    expect(layout.viewBoxHeight).toBeGreaterThan(0);
  });

  it.each([1, 2, 9])("nodeCount=%i: pathD похож на SVG path (начинается с M, содержит координаты)", (count) => {
    const layout = buildQuestMapLayout(count);
    expect(layout.pathD.length).toBeGreaterThan(0);
    expect(layout.pathD).toMatch(/^M-?\d/);
    expect(layout.pathD).toMatch(/\d/);
  });

  it("viewBoxHeight растёт с числом узлов, viewBoxWidth не зависит от их числа (фиксированные полосы)", () => {
    const l1 = buildQuestMapLayout(1);
    const l2 = buildQuestMapLayout(2);
    const l9 = buildQuestMapLayout(9);

    expect(l2.viewBoxHeight).toBeGreaterThan(l1.viewBoxHeight);
    expect(l9.viewBoxHeight).toBeGreaterThan(l2.viewBoxHeight);
    expect(l1.viewBoxWidth).toBe(l2.viewBoxWidth);
    expect(l2.viewBoxWidth).toBe(l9.viewBoxWidth);
  });

  it("nodeCount=1: путь всё равно содержит хоть один сегмент рисования (M + L к той же точке)", () => {
    const layout = buildQuestMapLayout(1);
    expect(layout.pathD).toMatch(/^M[\d.,-]+ L[\d.,-]+$/);
  });

  it("nodeCount<=0 не ломается: трактуется как минимум 1 узел", () => {
    const layout = buildQuestMapLayout(0);
    expect(layout.nodes).toHaveLength(1);
    expect(layout.viewBoxHeight).toBeGreaterThan(0);
  });

  it("узлы чередуют полосы (чётные слева, нечётные справа) при nodeCount=9", () => {
    const layout = buildQuestMapLayout(9);
    const xs = layout.nodes.map((n) => n.x);
    const distinctX = new Set(xs);
    expect(distinctX.size).toBe(2);
    expect(xs[0]).not.toBe(xs[1]);
    expect(xs[0]).toBe(xs[2]);
  });
});
