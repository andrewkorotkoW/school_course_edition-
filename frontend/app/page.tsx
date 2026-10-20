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
  title: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hardcoded for the scaffold - wire up real auth/student selection later.
const DEMO_STUDENT_ID = 1;

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [quests, setQuests] = useState<Quest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/subjects`)
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => setError("Не удалось получить предметы с backend"));

    fetch(`${API_URL}/students/${DEMO_STUDENT_ID}/quests`)
      .then((res) => res.json())
      .then(setQuests)
      .catch(() => setError("Не удалось получить квесты ученика с backend"));
  }, []);

  const subjectName = (subjectId: number) =>
    subjects?.find((s) => s.id === subjectId)?.name ?? "Предмет";

  const questsBySubject = (quests ?? []).reduce<Record<number, Quest[]>>((acc, q) => {
    if (!acc[q.subject_id]) acc[q.subject_id] = [];
    acc[q.subject_id].push(q);
    return acc;
  }, {});

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>EduQuest</h1>
      <p>Выполняй задания по школьной программе. Без рейтингов и проигрышей.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!error && !quests && <p>Загрузка заданий...</p>}

      {!error && quests?.length === 0 && <p>Программа пока не назначена.</p>}

      {Object.entries(questsBySubject).map(([subjectId, subjectQuests]) => (
        <section key={subjectId} style={{ marginBottom: "1.5rem" }}>
          <h2>{subjectName(Number(subjectId))}</h2>
          <ul>
            {subjectQuests.map((q) => (
              <li key={q.id}>
                {q.grade} класс:{" "}
                <a href={`/quest/${q.id}`}>{q.title}</a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
