import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CountClickPuzzle from "./CountClickPuzzle";

describe("CountClickPuzzle", () => {
  function setup(count = 3) {
    const onSubmit = jest.fn();
    render(<CountClickPuzzle config={{ emoji: "🍎", count }} onSubmit={onSubmit} />);
    return { onSubmit };
  }

  function items() {
    return screen.getAllByRole("button", { name: /Собрать предмет/ });
  }

  it("рендерит нужное количество предметов и кнопку 'Готово' выключена изначально", () => {
    setup(3);
    expect(items()).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Готово" })).toBeDisabled();
  });

  it("клик по предмету помечает его собранным и он больше не кликабелен", async () => {
    const user = userEvent.setup();
    setup(3);
    const [first] = items();

    expect(first).not.toBeDisabled();
    await user.click(first);

    expect(first).toBeDisabled();
    expect(screen.getByText("Собрано: 1")).toBeInTheDocument();

    await user.click(first);
    expect(screen.getByText("Собрано: 1")).toBeInTheDocument();
  });

  it("сохраняет aria-label на кнопках предметов", () => {
    setup(3);
    expect(screen.getByRole("button", { name: "Собрать предмет 1 из 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Собрать предмет 2 из 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Собрать предмет 3 из 3" })).toBeInTheDocument();
  });

  it("кнопка 'Готово' остаётся disabled, пока не собраны все предметы", async () => {
    const user = userEvent.setup();
    setup(3);
    const done = screen.getByRole("button", { name: "Готово" });
    const [first, second] = items();

    await user.click(first);
    expect(done).toBeDisabled();

    await user.click(second);
    expect(done).toBeDisabled();
  });

  it("после сбора всех предметов кнопка 'Готово' активна и вызывает onSubmit(String(count))", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup(3);
    const done = screen.getByRole("button", { name: "Готово" });

    for (const item of items()) {
      await user.click(item);
    }

    expect(done).not.toBeDisabled();
    await user.click(done);

    expect(onSubmit).toHaveBeenCalledWith("3");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
