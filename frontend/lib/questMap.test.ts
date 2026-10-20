import { buildQuestMapEntries, type QuestMapQuest } from "./questMap";

function quest(id: number, completed: boolean): QuestMapQuest {
  return { id, subject_id: 1, grade: 1, title: `Квест ${id}`, completed };
}

describe("buildQuestMapEntries", () => {
  it("возвращает пустой массив, если квестов нет", () => {
    expect(buildQuestMapEntries([])).toEqual([]);
  });

  it("один квест, не пройден: он становится текущим, заблокированных нет", () => {
    const entries = buildQuestMapEntries([quest(1, false)]);
    expect(entries.map((e) => e.status)).toEqual(["current"]);
  });

  it("один квест, уже пройден: статус completed, текущего узла нет", () => {
    const entries = buildQuestMapEntries([quest(1, true)]);
    expect(entries.map((e) => e.status)).toEqual(["completed"]);
  });

  it("два квеста: первый пройден, второй текущий (демо-программа)", () => {
    const entries = buildQuestMapEntries([quest(1, true), quest(2, false)]);
    expect(entries.map((e) => e.status)).toEqual(["completed", "current"]);
  });

  it("если ничего не пройдено, текущим становится первый квест, остальные заблокированы", () => {
    const entries = buildQuestMapEntries([quest(1, false), quest(2, false), quest(3, false)]);
    expect(entries.map((e) => e.status)).toEqual(["current", "locked", "locked"]);
  });

  it("если всё пройдено, текущего узла нет вообще", () => {
    const entries = buildQuestMapEntries([quest(1, true), quest(2, true)]);
    expect(entries.map((e) => e.status)).toEqual(["completed", "completed"]);
  });

  it("ровно один текущий узел даже на 10 квестах вперемешку", () => {
    const quests = [
      quest(1, true),
      quest(2, true),
      quest(3, true),
      quest(4, false),
      quest(5, false),
      quest(6, false),
      quest(7, false),
      quest(8, false),
      quest(9, false),
      quest(10, false),
    ];
    const entries = buildQuestMapEntries(quests);
    expect(entries.map((e) => e.status)).toEqual([
      "completed",
      "completed",
      "completed",
      "current",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
      "locked",
    ]);
    expect(entries.filter((e) => e.status === "current")).toHaveLength(1);
  });

  it("присваивает globalIndex по позиции и циклически переиспользует иконки", () => {
    const quests = Array.from({ length: 10 }, (_, i) => quest(i + 1, false));
    const entries = buildQuestMapEntries(quests);
    expect(entries.map((e) => e.globalIndex)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(entries[0].icon).toBe(entries[8].icon);
  });
});
