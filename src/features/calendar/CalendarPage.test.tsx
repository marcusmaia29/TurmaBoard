import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeDelivery, makeSubject } from "../../test/factories";
import CalendarPage from "./CalendarPage";
import { fetchDeliveries } from "../deliveries/delivery.service";
import { fetchLessonNotes } from "../lesson-notes/lesson-note.service";

vi.mock("../deliveries/delivery.service", () => ({ fetchDeliveries: vi.fn() }));
vi.mock("../lesson-notes/lesson-note.service", () => ({ fetchLessonNotes: vi.fn() }));

const ml = makeSubject({ id: "subject-ml", name: "Machine Learning", code: "ML", color: "#16a344" });

const deliveries = [
  makeDelivery({ id: "d-aps", title: "APS 03 — regressão linear", subject: ml }),
  makeDelivery({ id: "d-exam", title: "Avaliação intermediária", type: "exam" }),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-09-02T15:00:00Z"));
    vi.mocked(fetchDeliveries).mockResolvedValue(deliveries);
    vi.mocked(fetchLessonNotes).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows the current month, the item count and the deadlines on the grid", async () => {
    renderPage();

    expect(await screen.findByText("Setembro de 2026")).toBeInTheDocument();
    expect(await screen.findByText("2 itens")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /APS 03/ })).toBeInTheDocument();
  });

  it("moves between months and back to today", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await screen.findByText("Setembro de 2026");

    await user.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(await screen.findByText("Agosto de 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(await screen.findByText("Outubro de 2026")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hoje" }));
    expect(await screen.findByText("Setembro de 2026")).toBeInTheDocument();
  });
});
