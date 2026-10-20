"use client";

import { useEffect, useState } from "react";

type Subject = {
  id: number;
  slug: string;
  name: string;
};

type Quest = {
  id: number;
  subject_id: number;
  grade: number;
  order: number;
  title: string;
  story_text: string;
};

type Program = {
  id: number;
  title: string;
  grade_from: number;
  grade_to: number;
  quests: Quest[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const GRADES = [1, 2, 3, 4, 5];

export default function AdminPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [questsBySubject, setQuestsBySubject] = useState<Record<number, Quest[]>>({});
  const [selectedQuestIds, setSelectedQuestIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [gradeFrom, setGradeFrom] = useState(1);
  const [gradeTo, setGradeTo] = useState(5);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [programs, setPrograms] = useState<Program[] | null>(null);
  const [assignStudentId, setAssignStudentId] = useState<Record<number, string>>({});
  const [assignMessage, setAssignMessage] = useState<string | null>(null);

  function loadPrograms() {
    fetch(`${API_URL}/admin/programs`)
      .then((res) => res.json())
      .then(setPrograms)
      .catch(() => setError("Не удалось получить список программ"));
  }

  useEffect(() => {
    fetch(`${API_URL}/subjects`)
      .then((res) => res.json())
      .then(async (data: Subject[]) => {
        setSubjects(data);
        const entries = await Promise.all(
          data.map(async (s) => {
            const res = await fetch(`${API_URL}/subjects/${s.slug}/quests`);
            const quests: Quest[] = await res.json();
            return [s.id, quests] as const;
          })
        );
        setQuestsBySubject(Object.fromEntries(entries));
      })
      .catch(() => setError("Не удалось получить предметы с backend"));

    loadPrograms();
  }, []);

  function questsForGroup(subjectId: number, grade: number): Quest[] {
    return (questsBySubject[subjectId] ?? []).filter((q) => q.grade === grade);
  }

  function isGroupSelected(subjectId: number, grade: number): boolean {
    const group = questsForGroup(subjectId, grade);
    return group.length > 0 && group.every((q) => selectedQuestIds.has(q.id));
  }

  function toggleGroup(subjectId: number, grade: number) {
    const group = questsForGroup(subjectId, grade);
    const next = new Set(selectedQuestIds);
    if (isGroupSelected(subjectId, grade)) {
      group.forEach((q) => next.delete(q.id));
    } else {
      group.forEach((q) => next.add(q.id));
    }
    setSelectedQuestIds(next);
  }

  function toggleQuest(questId: number) {
    const next = new Set(selectedQuestIds);
    if (next.has(questId)) {
      next.delete(questId);
    } else {
      next.add(questId);
    }
    setSelectedQuestIds(next);
  }

  async function createProgram() {
    setCreateMessage(null);
    if (!title.trim() || selectedQuestIds.size === 0) {
      setCreateMessage("Укажите название и выберите хотя бы один квест");
      return;
    }

    const res = await fetch(`${API_URL}/admin/programs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        grade_from: gradeFrom,
        grade_to: gradeTo,
        quest_ids: Array.from(selectedQuestIds),
      }),
    });

    if (!res.ok) {
      setCreateMessage("Не удалось создать программу");
      return;
    }

    setTitle("");
    setSelectedQuestIds(new Set());
    setCreateMessage("Программа создана");
    loadPrograms();
  }

  async function assignProgram(programId: number) {
    setAssignMessage(null);
    const studentId = Number(assignStudentId[programId]);
    if (!studentId) {
      setAssignMessage("Укажите id ученика");
      return;
    }

    const res = await fetch(`${API_URL}/admin/programs/${programId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId }),
    });

    if (!res.ok) {
      setAssignMessage("Не удалось назначить программу");
      return;
    }

    setAssignMessage(`Программа назначена ученику ${studentId}`);
  }

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 800 }}>
      <h1>Админка: сборка программы</h1>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <section style={{ marginBottom: "2rem" }}>
        <h2>Предметы и шаблоны</h2>
        {!subjects && <p>Загрузка предметов...</p>}

        {subjects?.map((s) => (
          <div key={s.id} style={{ marginBottom: "1rem" }}>
            <h3>{s.name}</h3>
            {GRADES.map((grade) => {
              const group = questsForGroup(s.id, grade);
              if (group.length === 0) return null;
              return (
                <div key={grade} style={{ marginBottom: "0.5rem" }}>
                  <label style={{ fontWeight: "bold" }}>
                    <input
                      type="checkbox"
                      checked={isGroupSelected(s.id, grade)}
                      onChange={() => toggleGroup(s.id, grade)}
                    />{" "}
                    {grade} класс (выбрать всё)
                  </label>
                  <ul>
                    {group.map((q) => (
                      <li key={q.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={selectedQuestIds.has(q.id)}
                            onChange={() => toggleQuest(q.id)}
                          />{" "}
                          {q.title}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Создать программу</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 320 }}>
          <label>
            Название{" "}
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Класс от{" "}
            <input
              type="number"
              value={gradeFrom}
              onChange={(e) => setGradeFrom(Number(e.target.value))}
            />
          </label>
          <label>
            Класс до{" "}
            <input
              type="number"
              value={gradeTo}
              onChange={(e) => setGradeTo(Number(e.target.value))}
            />
          </label>
          <p>Выбрано квестов: {selectedQuestIds.size}</p>
          <button onClick={createProgram}>Создать программу</button>
          {createMessage && <p>{createMessage}</p>}
        </div>
      </section>

      <section>
        <h2>Созданные программы</h2>
        {!programs && <p>Загрузка программ...</p>}
        {programs?.length === 0 && <p>Пока нет программ</p>}

        {programs?.map((p) => (
          <div key={p.id} style={{ marginBottom: "1.5rem", border: "1px solid #ccc", padding: "1rem" }}>
            <h3>{p.title}</h3>
            <p>
              Классы: {p.grade_from}–{p.grade_to}
            </p>
            <ul>
              {p.quests.map((q) => (
                <li key={q.id}>
                  {q.grade} класс: {q.title}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                placeholder="id ученика"
                value={assignStudentId[p.id] ?? ""}
                onChange={(e) =>
                  setAssignStudentId({ ...assignStudentId, [p.id]: e.target.value })
                }
                style={{ width: 100 }}
              />
              <button onClick={() => assignProgram(p.id)}>Назначить ученику</button>
            </div>
          </div>
        ))}
        {assignMessage && <p>{assignMessage}</p>}
      </section>
    </main>
  );
}
