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

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [questsBySubject, setQuestsBySubject] = useState<Record<number, Quest[]>>({});
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>EduQuest</h1>
      <p>Выполняй задания по школьной программе. Без рейтингов и проигрышей.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!error && !subjects && <p>Загрузка предметов...</p>}

      {subjects?.map((s) => (
        <section key={s.id} style={{ marginBottom: "1.5rem" }}>
          <h2>{s.name}</h2>
          <ul>
            {(questsBySubject[s.id] ?? []).map((q) => (
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
