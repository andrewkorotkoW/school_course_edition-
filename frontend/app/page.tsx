"use client";

import { useEffect, useState } from "react";

type Subject = {
  id: number;
  slug: string;
  name: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/subjects`)
      .then((res) => res.json())
      .then(setSubjects)
      .catch(() => setError("Не удалось получить предметы с backend"));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>EduQuest — 1–4 класс</h1>
      <p>Остров растёт от выполненных заданий. Без рейтингов и проигрышей.</p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!error && !subjects && <p>Загрузка предметов...</p>}

      {subjects && (
        <ul>
          {subjects.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      )}

      <p>
        <a href="/island">Посмотреть остров →</a>
      </p>
    </main>
  );
}
