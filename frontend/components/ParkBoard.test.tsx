import { render, fireEvent } from "@testing-library/react";
import ParkBoard from "./ParkBoard";
import { buildQuestMapEntries, type QuestMapQuest } from "../lib/questMap";

// jsdom не реализует canvas — иллюстрация в тестах не рисуется, компонент это переживает молча.
beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: () => null, configurable: true });
});

function quest(id: number, completed: boolean): QuestMapQuest {
  return { id, subject_id: 1, grade: 1, title: `Квест ${id}`, completed };
}

const renderBoard = (quests: QuestMapQuest[]) => render(<ParkBoard entries={buildQuestMapEntries(quests)} title="Математика" />);

describe("ParkBoard", () => {
  it("completed-клетка — ссылка на /quest/{id} с галочкой, без замка", () => {
    const { container } = renderBoard([quest(1, true)]);
    const node = container.querySelector(".park-node-completed");
    expect(node?.tagName).toBe("A");
    expect(node).toHaveAttribute("href", "/quest/1");
    expect(node?.querySelector(".park-pin-completed")).toBeTruthy();
    expect(node?.querySelector(".park-pin-locked")).toBeNull();
  });

  it("current-клетка — ссылка на /quest/{id}, и кнопка «Сделать ход» ведёт туда же", () => {
    const { container } = renderBoard([quest(1, true), quest(2, false)]);
    const node = container.querySelector(".park-node-current");
    expect(node?.tagName).toBe("A");
    expect(node).toHaveAttribute("href", "/quest/2");
    const cta = container.querySelector(".park-cta");
    expect(cta?.tagName).toBe("A");
    expect(cta).toHaveAttribute("href", "/quest/2");
    expect(cta?.textContent).toContain("Квест 2");
  });

  it("locked-клетка — НЕ ссылка, с замком; клик и Enter показывают подсказку, ссылки на неё нет", () => {
    const { container } = renderBoard([quest(1, false), quest(2, false)]);
    const locked = container.querySelector(".park-node-locked") as HTMLElement;
    expect(locked.tagName).not.toBe("A");
    expect(locked).not.toHaveAttribute("href");
    expect(locked.querySelector(".park-pin-locked")).toBeTruthy();
    expect(container.querySelector('a[href="/quest/2"]')).toBeNull();
    expect(locked.textContent).not.toContain("Сначала пройди предыдущее задание");

    fireEvent.click(locked);
    expect(locked.textContent).toContain("Сначала пройди предыдущее задание");

    const { container: c2 } = renderBoard([quest(1, false), quest(2, false)]);
    const locked2 = c2.querySelector(".park-node-locked") as HTMLElement;
    fireEvent.keyDown(locked2, { key: "Enter" });
    expect(locked2.textContent).toContain("Сначала пройди предыдущее задание");
  });

  it("ровно одна current-клетка и пунктир хода к ней от последней пройденной", () => {
    const { container } = renderBoard([quest(1, true), quest(2, true), quest(3, false), quest(4, false)]);
    expect(container.querySelectorAll(".park-node-current")).toHaveLength(1);
    expect(container.querySelectorAll(".park-node-locked")).toHaveLength(1);
    expect(container.querySelector(".park-trail path")).toBeTruthy();
    expect(container.querySelector(".park-badge-sub")?.textContent).toContain("2 / 4");
  });

  it("ничего не пройдено — нет пунктира (фишка перед первой клеткой), первая клетка current", () => {
    const { container } = renderBoard([quest(1, false), quest(2, false)]);
    expect(container.querySelector(".park-trail path")).toBeNull();
    expect(container.querySelector(".park-node-current")).toHaveAttribute("href", "/quest/1");
  });

  it("всё пройдено — нет current/locked, вместо кнопки хода — «Программа пройдена!»", () => {
    const { container } = renderBoard([quest(1, true), quest(2, true)]);
    expect(container.querySelectorAll(".park-node-current")).toHaveLength(0);
    expect(container.querySelectorAll(".park-node-locked")).toHaveLength(0);
    expect(container.querySelectorAll(".park-node-completed")).toHaveLength(2);
    expect(container.querySelector(".park-cta")?.tagName).not.toBe("A");
    expect(container.querySelector(".park-cta")?.textContent).toContain("Программа пройдена");
  });

  it("пустой список квестов рендерится без ошибок и без клеток", () => {
    const { container } = renderBoard([]);
    expect(container.querySelectorAll(".park-node")).toHaveLength(0);
    expect(container.querySelector(".park-progress-fill")).toHaveStyle({ width: "0%" });
  });

  it("клетки нумеруются по порядку квестов", () => {
    const { container } = renderBoard([quest(5, true), quest(9, false), quest(7, false)]);
    const numbers = Array.from(container.querySelectorAll(".park-point")).map((el) => el.textContent);
    expect(numbers).toEqual(["1", "2", "3"]);
  });
});
