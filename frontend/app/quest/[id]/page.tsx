"use client";

import { useEffect, useState } from "react";
import IslandCanvas from "../../../components/IslandCanvas";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Hardcoded for the scaffold - wire up real auth/student selection later.
const DEMO_STUDENT_ID = 1;

type Task = {
  id: number;
  quest_id: number;
  order: number;
  type: "choice" | "input";
  prompt: string;
  options: string[] | null;
};

type Feedback = {
  correct: boolean;
  explanation: string;
};

type Island = {
  student_id: number;
  growth_points: number;
  stage: number;
};

export default function QuestPage({ params }: { params: { id: string } }) {
  const questId = params.id;

  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [index, setIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [finished, setFinished] = useState(false);
  const [startStage, setStartStage] = useState(0);
  const [endStage, setEndStage] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/quests/${questId}/tasks`)
      .then((res) => res.json())
      .then(setTasks);

    // Capture the island's stage before this quest, so the finish screen
    // can animate the actual before -> after growth instead of just a number.
    fetch(`${API_URL}/students/${DEMO_STUDENT_ID}/island`)
      .then((res) => (res.ok ? res.json() : null))
      .then((island: Island | null) => setStartStage(island?.stage ?? 0));
  }, [questId]);

  const currentTask = tasks?.[index];

  async function submitAnswer(answer: string) {
    if (!currentTask) return;
    const res = await fetch(`${API_URL}/tasks/${currentTask.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    const result: Feedback = await res.json();
    setFeedback(result);
  }

  async function handleNext() {
    setFeedback(null);
    setInputValue("");

    if (!tasks) return;
    if (index + 1 < tasks.length) {
      setIndex(index + 1);
      return;
    }

    // Last task answered correctly - grow the island.
    const res = await fetch(`${API_URL}/students/quests/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: DEMO_STUDENT_ID, quest_id: Number(questId) }),
    });
    const island: Island = await res.json();
    setEndStage(island.stage);
    setFinished(true);
  }

  if (!tasks) return <main style={{ padding: "2rem" }}>Загрузка...</main>;

  if (finished) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h1>Квест пройден! 🎉</h1>
        <IslandCanvas stage={endStage} fromStage={startStage} />
        <a href="/island">Посмотреть остров →</a>
      </main>
    );
  }

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
