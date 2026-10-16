import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Vacancy } from "../../lib/database.types";
import VacanciesPage from "./VacanciesPage";
import { fetchVacancies } from "./vacancy.service";

vi.mock("./vacancy.service", () => ({ fetchVacancies: vi.fn() }));

function vacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "vacancy-1",
    company: "Empresa Azul",
    title: "Estágio em Software",
    area: "software",
    location: "São Paulo, SP",
    work_mode: "hybrid",
    internship_period: "Janeiro e fevereiro de 2027",
    application_deadline: "2026-11-15",
    summary: "Desenvolvimento de produto digital.",
    source_name: "Página de carreiras",
    source_url: "https://example.com/careers",
    application_url: "https://example.com/apply",
    review_status: "approved",
    opening_status: "open",
    first_seen_at: "2026-10-01T12:00:00Z",
    last_seen_at: "2026-10-01T12:00:00Z",
    last_verified_at: "2026-10-15T12:00:00Z",
    created_at: "2026-10-01T12:00:00Z",
    updated_at: "2026-10-15T12:00:00Z",
    ...overrides,
  };
}

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

function renderPage(path = "/vagas") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <VacanciesPage />
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.clearAllMocks());

describe("VacanciesPage", () => {
  it("shows a genuine empty state when no vacancy is published", async () => {
    vi.mocked(fetchVacancies).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("Nenhuma vaga aberta por enquanto")).toBeInTheDocument();
    expect(screen.getByText("0 vagas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("shows deadline, provenance and an official application link", async () => {
    vi.mocked(fetchVacancies).mockResolvedValue([vacancy()]);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Estágio em Software" })).toBeInTheDocument();
    expect(screen.getByText("Até 15 de novembro de 2026")).toBeInTheDocument();
    expect(screen.getByText("Conferida em 15/10/2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Página de carreiras" })).toHaveAttribute("href", "https://example.com/careers");
    expect(screen.getByRole("link", { name: /Ver vaga oficial/ })).toHaveAttribute("href", "https://example.com/apply");
  });

  it("loads shared URL filters and clears a no-results state", async () => {
    vi.mocked(fetchVacancies).mockResolvedValue([vacancy()]);
    const user = userEvent.setup();
    renderPage("/vagas?q=inexistente&area=data_ai&mode=remote");

    expect(await screen.findByText("Nenhuma vaga corresponde aos filtros")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Buscar" })).toHaveValue("inexistente");
    expect(screen.getByRole("radio", { name: "Dados e IA" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Remoto" })).toBeChecked();

    await user.click(within(screen.getByRole("region", { name: "Oportunidades abertas" })).getByRole("button", { name: "Limpar filtros" }));
    expect(await screen.findByRole("heading", { name: "Estágio em Software" })).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/vagas");
    expect(screen.getByTestId("location")).not.toHaveTextContent("?");
  });

  it("updates the shareable URL as the user searches and filters", async () => {
    vi.mocked(fetchVacancies).mockResolvedValue([vacancy()]);
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: "Estágio em Software" });

    await user.type(screen.getByRole("searchbox", { name: "Buscar" }), "Azul");
    await user.click(screen.getByRole("radio", { name: "Desenvolvimento de software" }));
    await user.click(screen.getByRole("radio", { name: "Híbrido" }));

    const location = screen.getByTestId("location").textContent ?? "";
    expect(location).toContain("q=Azul");
    expect(location).toContain("area=software");
    expect(location).toContain("mode=hybrid");
    expect(screen.getByText("1 vaga")).toBeInTheDocument();
  });

  it("shows a retry action when the public read fails", async () => {
    vi.mocked(fetchVacancies).mockRejectedValue(new Error("offline"));
    renderPage();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeInTheDocument();
  });
});
