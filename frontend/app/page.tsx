"use client";

import { useEffect, useState } from "react";
import ParkBoard from "../components/ParkBoard";
import { buildQuestMapEntries } from "../lib/questMap";

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
  const [activeSubjectId, setActiveSubjectId] = useState<number | null>(null);

  useEffect(() => {
    // Backend на ошибку отвечает объектом {detail: ...}, а не списком — без проверки
    // страница падала на reduce() по объекту вместо понятного сообщения
    const fetchList = <T,>(url: string): Promise<T[]> =>
      fetch(url).then(async (res) => {
        const body = await res.json();
        if (!res.ok || !Array.isArray(body)) throw new Error(typeof body?.detail === "string" ? body.detail : `HTTP ${res.status}`);
        return body as T[];
      });

    fetchList<Subject>(`${API_URL}/subjects`)
      .then(setSubjects)
      .catch(() => setError("Не удалось получить предметы с backend"));

    fetchList<Quest>(`${API_URL}/students/${DEMO_STUDENT_ID}/quests`)
      .then(setQuests)
      .catch((e: Error) => setError(e.message === "Student not found" ? "Ученик не найден — выполните сид тестовых данных" : "Не удалось получить квесты ученика с backend"));
  }, []);

  const subjectName = (subjectId: number) =>
    subjects?.find((s) => s.id === subjectId)?.name ?? "Предмет";

  // Each subject is its own board: group quests by subject first, then derive
  // completed/current/locked per subject so e.g. the first russian quest can
  // be "current" even while every math quest is still unfinished.
  const questsBySubject = (quests ?? []).reduce<Record<number, Quest[]>>((acc, quest) => {
    const key = quest.subject_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(quest);
    return acc;
  }, {});
  const subjectIds = Object.keys(questsBySubject).map(Number);
  const shownSubjectId = activeSubjectId !== null && questsBySubject[activeSubjectId] ? activeSubjectId : subjectIds[0];
  const shownEntries = shownSubjectId !== undefined ? buildQuestMapEntries(questsBySubject[shownSubjectId]) : [];

  return (
    <main className="page page-park">
      <header className="page-header fade-in-up">
        <h1 className="page-title">EduQuest</h1>
        <p className="page-subtitle">
          Выполняй задания по школьной программе — каждое пройденное задание двигает фишку вперёд по парку.
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

      {subjectIds.length > 1 && (
        <div className="park-tabs fade-in-up" role="tablist" aria-label="Предметы">
          {subjectIds.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={id === shownSubjectId}
              className={`park-tab${id === shownSubjectId ? " park-tab-on" : ""}`}
              onClick={() => setActiveSubjectId(id)}
            >
              {subjectName(id)}
            </button>
          ))}
        </div>
      )}

      {shownSubjectId !== undefined && (
        <section className="fade-in-up">
          <ParkBoard key={shownSubjectId} entries={shownEntries} title={subjectName(shownSubjectId)} />
        </section>
      )}
    </main>
  );
}
