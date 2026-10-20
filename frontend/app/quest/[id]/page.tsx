"use client";

import { useEffect, useState } from "react";
import CountClickPuzzle from "../../../components/puzzles/CountClickPuzzle";
import OrderTapPuzzle from "../../../components/puzzles/OrderTapPuzzle";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hardcoded for the scaffold - wire up real auth/student selection later.
const DEMO_STUDENT_ID = 1;

type Task = {
  id: number;
  quest_id: number;
  order: number;
  type: "choice" | "input" | "puzzle";
  prompt: string;
  options: string[] | null;
  puzzle_kind?: string | null;
  config?: Record<string, unknown> | null;
  completed: boolean;
};

type Feedback = {
  correct: boolean;
  explanation: string;
};

export default function QuestPage({ params }: { params: { id: string } }) {
  const questId = params.id;

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setTasks(null);
    setIndex(null);
    setFeedback(null);
    setFinished(false);

    fetch(`${API_URL}/quests/${questId}/tasks?student_id=${DEMO_STUDENT_ID}`)
      .then((res) => res.json())
      .then((loaded: Task[]) => {
        if (cancelled) return;
        setTasks(loaded);
        // Resume where we left off: the first not-yet-correct task. If every
        // task is already done (e.g. revisiting a finished quest), there's
        // nothing to resume into - just confirm completion and show that.
        const firstUnfinished = loaded.findIndex((t) => !t.completed);
        if (firstUnfinished === -1) {
          finishQuest(() => cancelled);
        } else {
          setIndex(firstUnfinished);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questId]);

  const currentTask = index !== null ? tasks?.[index] : undefined;

  async function submitAnswer(answer: string) {
    if (!currentTask) return;
    const res = await fetch(`${API_URL}/tasks/${currentTask.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: DEMO_STUDENT_ID, answer }),
    });
    const result: Feedback = await res.json();
    setFeedback(result);
  }

  async function finishQuest(isCancelled?: () => boolean) {
    // Last task answered correctly - mark the quest done. Idempotent on the
    // backend, so calling it again when resuming an already-finished quest
    // is harmless.
    await fetch(`${API_URL}/students/quests/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: DEMO_STUDENT_ID, quest_id: Number(questId) }),
    });
    if (isCancelled?.()) return;
    setFinished(true);
  }

  async function handleNext() {
    setFeedback(null);
    setInputValue("");

    if (!tasks || index === null) return;
    if (index + 1 < tasks.length) {
      setIndex(index + 1);
      return;
    }

    await finishQuest();
  }

  if (finished) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>Квест пройден! 🎉</h1>
        <a href="/">← К заданиям</a>
      </main>
    );
  }

  if (!tasks || index === null) return <main style={{ padding: "2rem" }}>Загрузка...</main>;

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 480 }}>
      <p>
        Задание {index + 1} из {tasks.length}
      </p>
      <h2>{currentTask?.prompt}</h2>

      {currentTask?.type === "choice" && !feedback && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {currentTask.options?.map((opt) => (
            <button key={opt} onClick={() => submitAnswer(opt)}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {currentTask?.type === "input" && !feedback && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
          <button onClick={() => submitAnswer(inputValue)}>Проверить</button>
        </div>
      )}

      {currentTask?.type === "puzzle" && !feedback && (
        <>
          {currentTask.puzzle_kind === "count_click" && (
            <CountClickPuzzle config={currentTask.config ?? {}} onSubmit={submitAnswer} />
          )}
          {currentTask.puzzle_kind === "order_tap" && (
            <OrderTapPuzzle config={currentTask.config ?? {}} onSubmit={submitAnswer} />
          )}
          {currentTask.puzzle_kind !== "count_click" && currentTask.puzzle_kind !== "order_tap" && (
            <p style={{ color: "crimson" }}>
              Неизвестный тип головоломки: {currentTask.puzzle_kind}
            </p>
          )}
        </>
      )}

      {feedback && (
        <div style={{ marginTop: "1rem" }}>
          {feedback.correct ? (
            <>
              <p style={{ color: "green" }}>Верно!</p>
              <button onClick={handleNext}>Дальше →</button>
            </>
          ) : (
            <>
              <p style={{ color: "crimson" }}>Пока не то. {feedback.explanation}</p>
              <button onClick={() => setFeedback(null)}>Попробовать ещё раз</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
