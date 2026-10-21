import { render, fireEvent } from "@testing-library/react";
import QuestMapScene from "./QuestMapScene";
import { buildQuestMapEntries, type QuestMapQuest } from "../lib/questMap";

function quest(id: number, completed: boolean): QuestMapQuest {
  return { id, subject_id: 1, grade: 1, title: `Квест ${id}`, completed };
}

describe("QuestMapScene", () => {
  it("completed-узел — ссылка на /quest/{id} с галочкой, без замка", () => {
    const entries = buildQuestMapEntries([quest(1, true)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    const node = container.querySelector(".quest-node-completed");
    // Узел рендерится внутри <svg>, поэтому <a> — это SVG-элемент и его
    // tagName приходит в нижнем регистре ("a"), а не как у HTML-тега ("A").
    expect(node?.tagName.toLowerCase()).toBe("a");
    expect(node).toHaveAttribute("href", "/quest/1");
    expect(node?.querySelector(".quest-node-check")).toBeTruthy();
    expect(node?.querySelector(".quest-node-lock")).toBeNull();
  });

  it("current-узел — ссылка на /quest/{id}, визуально выделена (класс для пульсации), без замка и без галочки", () => {
    const entries = buildQuestMapEntries([quest(1, false)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    const node = container.querySelector(".quest-node-current");
    expect(node?.tagName.toLowerCase()).toBe("a");
    expect(node).toHaveAttribute("href", "/quest/1");
    expect(node?.querySelector(".quest-node-glow")).toBeTruthy();
    expect(node?.querySelector(".quest-node-check")).toBeNull();
    expect(node?.querySelector(".quest-node-lock")).toBeNull();
  });

  it("locked-узел — НЕ ссылка, с иконкой замка, и не ведёт на /quest/{id}", () => {
    const entries = buildQuestMapEntries([quest(1, true), quest(2, false), quest(3, false)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    const node = container.querySelector(".quest-node-locked");
    expect(node?.tagName.toLowerCase()).not.toBe("a");
    expect(node).not.toHaveAttribute("href");
    expect(node?.querySelector(".quest-node-lock")).toBeTruthy();
    expect(node?.querySelector(".quest-node-check")).toBeNull();

    expect(container.querySelector('a[href="/quest/3"]')).toBeNull();
  });

  it("клик по заблокированному узлу показывает подсказку и не навигирует", () => {
    const entries = buildQuestMapEntries([quest(1, false), quest(2, false)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    const locked = container.querySelector(".quest-node-locked") as HTMLElement;
    expect(locked.textContent).not.toContain("Сначала пройди предыдущее задание");

    fireEvent.click(locked);

    expect(locked.textContent).toContain("Сначала пройди предыдущее задание");
    expect(locked).not.toHaveAttribute("href");
    expect(container.querySelector('a[href="/quest/2"]')).toBeNull();
  });

  it("клавиатура: Enter на заблокированном узле тоже показывает подсказку", () => {
    const entries = buildQuestMapEntries([quest(1, false), quest(2, false)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    const locked = container.querySelector(".quest-node-locked") as HTMLElement;
    fireEvent.keyDown(locked, { key: "Enter" });

    expect(locked.textContent).toContain("Сначала пройди предыдущее задание");
  });

  it("ровно один пульсирующий current-узел в сцене, даже при смешанных статусах", () => {
    const entries = buildQuestMapEntries([
      quest(1, true),
      quest(2, true),
      quest(3, false),
      quest(4, false),
      quest(5, false),
    ]);
    const { container } = render(<QuestMapScene entries={entries} />);

    expect(container.querySelectorAll(".quest-node-current")).toHaveLength(1);
    expect(container.querySelectorAll(".quest-node-glow")).toHaveLength(1);
  });

  it("если всё пройдено — нет current-узла и нет заблокированных", () => {
    const entries = buildQuestMapEntries([quest(1, true), quest(2, true)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    expect(container.querySelectorAll(".quest-node-current")).toHaveLength(0);
    expect(container.querySelectorAll(".quest-node-locked")).toHaveLength(0);
    expect(container.querySelectorAll(".quest-node-completed")).toHaveLength(2);
  });

  it("если ничего не пройдено — ровно один current, остальные locked, ни одной ссылки на заблокированные", () => {
    const entries = buildQuestMapEntries([quest(1, false), quest(2, false), quest(3, false)]);
    const { container } = render(<QuestMapScene entries={entries} />);

    expect(container.querySelectorAll(".quest-node-current")).toHaveLength(1);
    expect(container.querySelectorAll(".quest-node-locked")).toHaveLength(2);
    expect(container.querySelector('a[href="/quest/2"]')).toBeNull();
    expect(container.querySelector('a[href="/quest/3"]')).toBeNull();
  });

  it("пустой список квестов рендерится без ошибок и без узлов", () => {
    const entries = buildQuestMapEntries([]);
    const { container } = render(<QuestMapScene entries={entries} />);

    expect(container.querySelectorAll(".quest-node")).toHaveLength(0);
  });
});
