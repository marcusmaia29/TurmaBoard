import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./AppShell";

const auth = { session: null as unknown, isAdmin: false, isLoading: false, authError: null, signOut: vi.fn() };

vi.mock("../features/auth/AuthContext", () => ({ useAuth: () => auth }));
vi.mock("../features/realtime/realtime.context", () => ({
  useRealtimeStatus: () => ({ status: "connected", retry: vi.fn() }),
}));
vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("./ToastContext", () => ({ useToast: () => ({ showToast: vi.fn() }) }));

function renderShell(initialEntry = "/week") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/week" element={<p>Semana</p>} />
          <Route path="/history" element={<p>Histórico da turma</p>} />
          <Route path="/grade" element={<p>Grade semanal</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

function moreActionsTrigger() {
  return screen.getByRole("button", { name: "Mais ações" });
}

describe("AppShell", () => {
  beforeEach(() => {
    auth.session = null;
    auth.isAdmin = false;
    auth.isLoading = false;
  });

  it("keeps the four main destinations outside the menu", () => {
    renderShell();

    for (const label of ["Semana", "Calendário", "Disciplinas", "Salas"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
    expect(moreActionsTrigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Histórico" })).not.toBeInTheDocument();
  });

  it("links the GitHub icon directly to the TurmaBoard repository", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(moreActionsTrigger());
    const githubLink = screen.getByRole("link", { name: "Dar uma estrela no TurmaBoard no GitHub" });

    expect(githubLink).toHaveAttribute("href", "https://github.com/marcusmaia29/TurmaBoard");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noreferrer");
    expect(githubLink).toHaveTextContent("Star");
    expect(screen.queryByText("Sobre")).not.toBeInTheDocument();
  });

  it("navigates to the secondary destinations from the menu and closes it", async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(moreActionsTrigger());
    expect(screen.getByRole("link", { name: "Histórico" })).toHaveAttribute("href", "/history");
    expect(screen.getByRole("link", { name: "Grade" })).toHaveAttribute("href", "/grade");

    await user.click(screen.getByRole("link", { name: "Histórico" }));

    expect(screen.getByText("Histórico da turma")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Grade" })).not.toBeInTheDocument();
  });

  it("marks the trigger as active while a destination inside the menu is open", () => {
    renderShell("/grade");
    expect(moreActionsTrigger()).toHaveClass("active");
  });

  it("leaves the trigger inactive on a destination outside the menu", () => {
    renderShell("/week");
    expect(moreActionsTrigger()).not.toHaveClass("active");
  });

  it("offers sign-in outside the menu while signed out", () => {
    renderShell();
    expect(screen.getByRole("link", { name: /Entrar/ })).toHaveAttribute("href", "/login");
  });

  it("moves the role badge and sign-out into the menu once signed in", async () => {
    auth.session = { user: { id: "user-id" } };
    auth.isAdmin = true;
    const user = userEvent.setup();
    renderShell();

    expect(screen.queryByRole("link", { name: /Entrar/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();

    await user.click(moreActionsTrigger());
    const panel = within(screen.getByRole("button", { name: "Mais ações" }).parentElement as HTMLElement);

    expect(panel.getByText("Admin")).toBeInTheDocument();
    expect(panel.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });
});
