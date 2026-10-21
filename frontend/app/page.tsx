"use client";

import { useEffect, useState, type CSSProperties } from "react";
import QuestMapScene from "../components/QuestMapScene";
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

  // Each subject is its own path: group quests by subject first, then derive
  // completed/current/locked per subject so e.g. the first russian quest can
  // be "current" even while every math quest is still unfinished.
  const questsBySubject = (quests ?? []).reduce<Record<number, Quest[]>>((acc, quest) => {
    const key = quest.subject_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(quest);
    return acc;
  }, {});

  const entriesBySubject = Object.fromEntries(
    Object.entries(questsBySubject).map(([subjectId, subjectQuests]) => [
      subjectId,
      buildQuestMapEntries(subjectQuests),
    ])
  ) as Record<number, QuestMapEntry<Quest>[]>;

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
          <QuestMapScene entries={entries} />
        </section>
      ))}
    </main>
  );
}
