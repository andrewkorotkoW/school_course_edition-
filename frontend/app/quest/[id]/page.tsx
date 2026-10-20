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
  // Bumped on every submit (right or wrong) so the feedback block remounts
  // and its CSS animation (pulse/shake) replays even on a repeated answer.
  const [attempt, setAttempt] = useState(0);
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
    setAttempt((a) => a + 1);
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
      <main className="page quest-page">
        <div className="card quest-finished fade-in-up">
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <span className="confetti-piece" aria-hidden="true" />
          <p className="quest-finished-emoji">🎉</p>
          <h1 className="quest-finished-title">Квест пройден!</h1>
          <a href="/" className="btn btn-primary btn-lg quest-finished-link">
            ← К заданиям
          </a>
        </div>
      </main>
    );
  }

  if (!tasks || index === null) {
    return (
      <main className="page quest-page">
        <div className="state-message state-message-loading state-message-loading-inner fade-in-up">
          <span className="spinner" />
          Загрузка...
        </div>
      </main>
    );
  }

  return (
    <main className="page quest-page">
      <div className="quest-progress">
        <p className="quest-progress-label">
          Задание {index + 1} из {tasks.length}
        </p>
        <div
          className="quest-progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={tasks.length}
          aria-valuenow={index + 1}
        >
          <div
            className="quest-progress-fill"
            style={{ width: `${(index / tasks.length) * 100}%` }}
          />
        </div>
      </div>

      <div key={index} className="card quest-task-card fade-in-up">
        <h2 className="quest-task-prompt">{currentTask?.prompt}</h2>

        {currentTask?.type === "choice" && !feedback && (
          <div className="quest-choices">
            {currentTask.options?.map((opt) => (
              <button
                key={opt}
                className="btn quest-choice-btn"
                onClick={() => submitAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentTask?.type === "input" && !feedback && (
          <div className="quest-input-row">
            <input
              className="quest-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label={currentTask?.prompt ? `Введите ответ: ${currentTask.prompt}` : "Введите ответ"}
            />
            <button className="btn btn-primary" onClick={() => submitAnswer(inputValue)}>
              Проверить
            </button>
          </div>
        )}

        {currentTask?.type === "puzzle" && !feedback && (
          <div className="quest-puzzle-wrapper">
            {currentTask.puzzle_kind === "count_click" && (
              <CountClickPuzzle config={currentTask.config ?? {}} onSubmit={submitAnswer} />
            )}
            {currentTask.puzzle_kind === "order_tap" && (
              <OrderTapPuzzle config={currentTask.config ?? {}} onSubmit={submitAnswer} />
            )}
            {currentTask.puzzle_kind !== "count_click" && currentTask.puzzle_kind !== "order_tap" && (
              <p className="state-message state-message-error">
                Неизвестный тип головоломки: {currentTask.puzzle_kind}
              </p>
            )}
          </div>
        )}
      </div>

      {feedback && (
        <div
          key={attempt}
          className={
            feedback.correct
              ? "quest-feedback quest-feedback-success pulse-success"
              : "quest-feedback quest-feedback-error shake-error"
          }
        >
          {feedback.correct ? (
            <>
              <p className="quest-feedback-success-text">✓ Верно!</p>
              <button className="btn btn-primary btn-lg" onClick={handleNext}>
                Дальше →
              </button>
            </>
          ) : (
            <>
              <p className="quest-feedback-error-text">Пока не то. {feedback.explanation}</p>
              <button className="btn" onClick={() => setFeedback(null)}>
                Попробовать ещё раз
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
