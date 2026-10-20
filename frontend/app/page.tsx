"use client";

import { useEffect, useState, type CSSProperties } from "react";
import QuestMapNode from "../components/QuestMapNode";
import { buildQuestMapEntries, type QuestMapEntry } from "../lib/questMap";

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
  completed: boolean;
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

  // Node status (completed / current / locked) is derived from the full
  // program order returned by the backend, before the quests get split into
  // per-subject path sections below.
  const questMapEntries = buildQuestMapEntries(quests ?? []);

  const entriesBySubject = questMapEntries.reduce<Record<number, QuestMapEntry<Quest>[]>>(
    (acc, entry) => {
      const key = entry.quest.subject_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {}
  );

  return (
    <main className="page">
      <header className="page-header fade-in-up">
        <h1 className="page-title">EduQuest</h1>
        <p className="page-subtitle">
          Выполняй задания по школьной программе. Без рейтингов и проигрышей.
        </p>
      </header>

      {error && <p className="state-message state-message-error fade-in-up">{error}</p>}
      {!error && !quests && (
        <p className="state-message state-message-loading fade-in-up">Загрузка заданий...</p>
      )}

      {!error && quests?.length === 0 && (
        <p className="state-message state-message-empty fade-in-up">
          Программа пока не назначена.
        </p>
      )}

      {Object.entries(entriesBySubject).map(([subjectId, entries], sectionIndex) => (
        <section
          key={subjectId}
          className="subject-section stagger-item"
          style={{ "--stagger-index": sectionIndex } as CSSProperties}
        >
          <h2 className="subject-title">{subjectName(Number(subjectId))}</h2>
          <ul className="quest-map">
            {entries.map((entry) => (
              <QuestMapNode
                key={entry.quest.id}
                questId={entry.quest.id}
                title={entry.quest.title}
                grade={entry.quest.grade}
                status={entry.status}
                icon={entry.icon}
                index={entry.globalIndex}
              />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
