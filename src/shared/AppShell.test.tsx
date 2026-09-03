import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppShell } from "./AppShell";

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({
    session: null,
    isAdmin: false,
    isLoading: false,
    authError: null,
    signOut: vi.fn(),
  }),
}));

vi.mock("../features/realtime/realtime.context", () => ({
  useRealtimeStatus: () => ({ status: "connected", retry: vi.fn() }),
}));

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));

vi.mock("./ToastContext", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("AppShell", () => {
  it("links the GitHub icon directly to the TurmaBoard repository", () => {
    render(
      <MemoryRouter initialEntries={["/week"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/week" element={<p>Semana</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const githubLink = screen.getByRole("link", { name: "Dar uma estrela no TurmaBoard no GitHub" });

    expect(githubLink).toHaveAttribute("href", "https://github.com/marcusmaia29/TurmaBoard");
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveTextContent("Star");
    expect(screen.queryByText("Sobre")).not.toBeInTheDocument();
  });
});
