import type { AgendaResponse } from "./agenda.types";

interface ApiErrorBody {
  error?: { message?: string };
}

export async function getAgenda(signal?: AbortSignal): Promise<AgendaResponse> {
  const response = await fetch("/api/agenda", { signal, headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => null) as AgendaResponse | ApiErrorBody | null;

  if (!response.ok) {
    const message = body && "error" in body ? body.error?.message : null;
    throw new Error(message || "Não foi possível consultar a agenda de salas.");
  }
  if (!body || !("events" in body) || !Array.isArray(body.events)) {
    throw new Error("A agenda retornou um formato inesperado.");
  }
  return body;
}
