import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AgendaResponse } from "./agenda.types";
import RoomsPage from "./RoomsPage";
import { getAgenda } from "./room.service";

vi.mock("./room.service", () => ({ getAgenda: vi.fn() }));

const agenda: AgendaResponse = {
  date: "2026-09-02",
  fetchedAt: "2026-09-02T13:00:00.000Z",
  sourceGeneratedAt: "2026-09-02T12:55:00.000Z",
  events: [
    {
      id: "class",
      date: "2026-09-02",
      type: "Aula",
      start: "09:45",
      end: "11:30",
      className: "4º CIÊNCIA DA COMPUTAÇÃO A",
      title: "Machine Learning",
      professor: "Professor",
      room: "404",
      floor: "4º andar",
      building: "Prédio 1",
      courseFamily: "Graduação",
      cancelled: false,
    },
    {
      id: "inventory",
      date: "2026-09-02",
      type: "Aula",
      start: "07:00",
      end: "08:00",
      className: "Outra turma",
      title: "Reserva anterior",
      professor: "Professor",
      room: "Lab 2",
      floor: "Térreo",
      building: "Prédio 2",
      courseFamily: "Graduação",
      cancelled: false,
    },
  ],
};

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><RoomsPage /></QueryClientProvider>);
}

describe("RoomsPage", () => {
  afterEach(() => vi.clearAllMocks());

  it("exibe a agenda fixa da turma e os controles da consulta", async () => {
    vi.mocked(getAgenda).mockResolvedValue(agenda);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Salas" })).toBeInTheDocument();
    expect(screen.getByText("4º CIÊNCIA DA COMPUTAÇÃO A")).toBeInTheDocument();
    expect(screen.getAllByText("Machine Learning")).toHaveLength(2);
    expect(screen.getByLabelText("Início")).toBeInTheDocument();
    expect(screen.getByLabelText("Fim")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agora/ })).toBeInTheDocument();
  });

  it("valida um intervalo invertido sem fazer uma consulta enganosa", async () => {
    vi.mocked(getAgenda).mockResolvedValue(agenda);
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: "Salas" });

    await user.clear(screen.getByLabelText("Início"));
    await user.type(screen.getByLabelText("Início"), "18:00");
    await user.clear(screen.getByLabelText("Fim"));
    await user.type(screen.getByLabelText("Fim"), "17:00");

    expect(screen.getByRole("alert")).toHaveTextContent("O horário final precisa ser posterior ao inicial.");
  });

  it("oferece nova tentativa quando a agenda falha", async () => {
    vi.mocked(getAgenda).mockRejectedValue(new Error("Serviço indisponível"));
    renderPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("Serviço indisponível");
    expect(screen.getByRole("button", { name: /Tentar novamente/ })).toBeInTheDocument();
  });
});
