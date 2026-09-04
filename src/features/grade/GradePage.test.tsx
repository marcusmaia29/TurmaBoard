import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GradePage from "./GradePage";

describe("GradePage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Wednesday, so the picker opens on "Quarta".
    vi.setSystemTime(new Date("2026-09-02T15:00:00Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("opens on the current weekday and marks its column as selected", () => {
    const { container } = render(<GradePage />);

    expect(screen.getByRole("button", { name: /Quarta/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Segunda/ })).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll('[data-day="wednesday"].is-selected').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-day="monday"].is-selected')).toHaveLength(0);
  });

  it("switches the selected weekday", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<GradePage />);

    await user.click(screen.getByRole("button", { name: /Sexta/ }));

    expect(screen.getByRole("button", { name: /Sexta/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Quarta/ })).toHaveAttribute("aria-pressed", "false");
    expect(container.querySelectorAll('[data-day="friday"].is-selected').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-day="wednesday"].is-selected')).toHaveLength(0);
  });

  it("lists every subject in the legend alongside the office-hours key", () => {
    render(<GradePage />);
    const legend = screen.getByLabelText("Cores das disciplinas");

    for (const name of ["Linguagens e Paradigmas", "Machine Learning", "Algoritmos e Estruturas de Dados", "Projeto de Software e Gestão Ágil", "Sistemas Hardware-Software"]) {
      expect(legend).toHaveTextContent(name);
    }
    expect(legend).toHaveTextContent("Atendimento");
  });
});
