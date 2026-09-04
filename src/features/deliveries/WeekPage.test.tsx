import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeDelivery, makeSubject, makeSubjectWithLinks } from "../../test/factories";
import { setViewportMatches } from "../../test/setup";
import WeekPage from "./WeekPage";
import { fetchDeliveries } from "./delivery.service";
import { fetchSubjects } from "../subjects/subject.service";
import { fetchLessonNotes } from "../lesson-notes/lesson-note.service";

vi.mock("./delivery.service", () => ({
  fetchDeliveries: vi.fn(),
  createDelivery: vi.fn(),
  updateDelivery: vi.fn(),
  softDeleteDelivery: vi.fn(),
}));
vi.mock("../subjects/subject.service", () => ({ fetchSubjects: vi.fn() }));
vi.mock("../lesson-notes/lesson-note.service", () => ({
  fetchLessonNotes: vi.fn(),
  softDeleteLessonNote: vi.fn(),
}));
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ isAdmin: false }) }));
vi.mock("../../shared/ToastContext", () => ({ useToast: () => ({ showToast: vi.fn() }) }));

const lp = makeSubject();
const ml = makeSubject({ id: "subject-ml", name: "Machine Learning", code: "ML", color: "#16a344", position: 2 });

const deliveries = [
  makeDelivery({ id: "d-aps", title: "APS 03 — regressão linear", type: "aps", subject: ml }),
  makeDelivery({ id: "d-exam", title: "Avaliação intermediária", type: "exam", subject: lp }),
  makeDelivery({ id: "d-quiz", title: "Quiz 4 — validação cruzada", type: "quiz", subject: ml }),
];

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <WeekPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** The board controls carry their own accessible name, so counts read from here
 *  are the toolbar's — not a subject column's identical "1 item" text. */
function toolbar() {
  return within(screen.getByRole("region", { name: "Controles do quadro" }));
}

describe("WeekPage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Wednesday, 2 September 2026 at noon in São Paulo — week runs 31 Aug to 6 Sep.
    vi.setSystemTime(new Date("2026-09-02T15:00:00Z"));
    vi.mocked(fetchDeliveries).mockResolvedValue(deliveries);
    vi.mocked(fetchSubjects).mockResolvedValue([makeSubjectWithLinks(lp), makeSubjectWithLinks(ml)]);
    vi.mocked(fetchLessonNotes).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows the current week, the item count and every type filter", async () => {
    renderPage();

    expect(await screen.findByText("31/08 a 06/09")).toBeInTheDocument();
    expect(await toolbar().findByText("3 itens")).toBeInTheDocument();

    for (const label of ["Todos", "Prova", "Quiz", "APS", "Projeto", "Atividade", "Aviso", "Anotações"]) {
      expect(toolbar().getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("narrows the board to a single type and updates the count", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    expect(await screen.findByRole("heading", { name: "Avaliação intermediária" })).toBeInTheDocument();

    await user.click(toolbar().getByRole("button", { name: "Prova" }));

    expect(screen.getByRole("heading", { name: "Avaliação intermediária" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Quiz 4 — validação cruzada" })).not.toBeInTheDocument();
    expect(toolbar().getByText("1 item")).toBeInTheDocument();
  });

  it("collapses the type filters into a menu on narrow screens", async () => {
    setViewportMatches(true);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await screen.findByText("31/08 a 06/09");

    // The chips are gone; one trigger stands in for them.
    expect(toolbar().queryByRole("button", { name: "Prova" })).not.toBeInTheDocument();
    const trigger = toolbar().getByRole("button", { name: "Tipo: Todos" });

    await user.click(trigger);
    await user.click(screen.getByRole("menuitemradio", { name: "Prova" }));

    expect(screen.getByRole("heading", { name: "Avaliação intermediária" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Quiz 4 — validação cruzada" })).not.toBeInTheDocument();
    expect(toolbar().getByRole("button", { name: "Tipo: Prova" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitemradio")).not.toBeInTheDocument();
  });

  it("drops the supplementary item count on narrow screens", async () => {
    setViewportMatches(true);
    renderPage();
    await screen.findByText("31/08 a 06/09");
    expect(toolbar().getByText("3 itens")).toHaveClass("result-count-supplementary");
  });

  it("moves between weeks and back to the current one", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await screen.findByText("31/08 a 06/09");

    await user.click(screen.getByRole("button", { name: "Semana anterior" }));
    expect(await screen.findByText("24/08 a 30/08")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Próxima semana" }));
    await user.click(screen.getByRole("button", { name: "Próxima semana" }));
    expect(await screen.findByText("07/09 a 13/09")).toBeInTheDocument();

    await user.click(toolbar().getByRole("button", { name: "Hoje" }));
    expect(await screen.findByText("31/08 a 06/09")).toBeInTheDocument();
  });
});
