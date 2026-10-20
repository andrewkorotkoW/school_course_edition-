import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OrderTapPuzzle from "./OrderTapPuzzle";

const ITEMS = ["b", "a", "c"];
const ORDER = ["a", "b", "c"];

describe("OrderTapPuzzle", () => {
  function setup() {
    const onSubmit = jest.fn();
    render(<OrderTapPuzzle config={{ items: ITEMS, order: ORDER }} onSubmit={onSubmit} />);
    return { onSubmit };
  }

  function tile(label: string) {
    return screen.getByRole("button", { name: label });
  }

  it("показывает плейсхолдер и disabled 'Готово' пока ничего не собрано", () => {
    setup();
    expect(screen.getByText("Твой порядок появится здесь")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Готово" })).toBeDisabled();
  });

  it("неверный тап не продвигает прогресс и не меняет placed", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(tile("b"));

    expect(screen.getByText("Твой порядок появится здесь")).toBeInTheDocument();
    expect(tile("b")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Готово" })).toBeDisabled();
  });

  it("верный порядок тапов собирает ответ и вызывает onSubmit со строкой через запятую", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.click(tile("a"));
    await user.click(tile("b"));
    await user.click(tile("c"));

    expect(screen.queryByText("Твой порядок появится здесь")).not.toBeInTheDocument();
    const done = screen.getByRole("button", { name: "Готово" });
    expect(done).not.toBeDisabled();

    await user.click(done);
    expect(onSubmit).toHaveBeenCalledWith("a,b,c");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("после верного тапа плитка становится disabled", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(tile("a"));
    expect(tile("a")).toBeDisabled();
    expect(tile("b")).not.toBeDisabled();
  });

  it("ошибочный тап после части верных не ломает уже собранный прогресс", async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.click(tile("a"));
    await user.click(tile("c"));

    expect(tile("c")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Готово" })).toBeDisabled();

    await user.click(tile("b"));
    await user.click(tile("c"));

    expect(onSubmit).not.toHaveBeenCalled();
    const done = screen.getByRole("button", { name: "Готово" });
    expect(done).not.toBeDisabled();
    await user.click(done);
    expect(onSubmit).toHaveBeenCalledWith("a,b,c");
  });
});
