import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import QuestMapNode from "./QuestMapNode";

describe("QuestMapNode", () => {
  it("пройденный узел — это ссылка на квест с галочкой", () => {
    render(<QuestMapNode questId={1} title="Сложение" grade={1} status="completed" icon="🎡" index={0} />);

    const link = screen.getByRole("link", { name: /Сложение/ });
    expect(link).toHaveAttribute("href", "/quest/1");
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("текущий узел — кликабельная ссылка без замочка и без галочки", () => {
    render(<QuestMapNode questId={2} title="Вычитание" grade={1} status="current" icon="🎠" index={1} />);

    const link = screen.getByRole("link", { name: /Вычитание/ });
    expect(link).toHaveAttribute("href", "/quest/2");
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
    expect(screen.queryByText("🔒")).not.toBeInTheDocument();
  });

  it("заблокированный узел — кнопка (не ссылка) с замочком, по клику показывает подсказку", async () => {
    const user = userEvent.setup();
    render(<QuestMapNode questId={3} title="Умножение" grade={2} status="locked" icon="🎢" index={2} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Умножение/ });
    expect(screen.getByText("🔒")).toBeInTheDocument();
    expect(screen.queryByText("Сначала пройди предыдущее задание")).not.toBeInTheDocument();

    await user.click(button);

    expect(screen.getByText("Сначала пройди предыдущее задание")).toBeInTheDocument();
  });
});
