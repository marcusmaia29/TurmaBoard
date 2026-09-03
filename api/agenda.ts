import { parseAgendaXml } from "./_lib/agenda.js";

interface ApiRequest {
  method?: string;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(body: unknown): unknown;
}

const INSPER_AGENDA_URL = "https://cgi.insper.edu.br/agenda/xml/ExibeCalendario.xml";
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 8_000;

class AgendaUpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
  }
}

async function readLimitedResponse(response: Response): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    throw new AgendaUpstreamError("A agenda excedeu o limite de resposta.", 502, "RESPONSE_TOO_LARGE");
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new AgendaUpstreamError("A agenda excedeu o limite de resposta.", 502, "RESPONSE_TOO_LARGE");
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(bytes);
}

async function fetchAgenda(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(INSPER_AGENDA_URL, {
      headers: {
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.1",
        "User-Agent": "Mozilla/5.0 (compatible; TurmaBoard/0.1; +https://github.com/marcusmaia29/TurmaBoard)",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new AgendaUpstreamError(`O Insper respondeu com HTTP ${response.status}.`, 502, "UPSTREAM_ERROR");
    }
    return await readLimitedResponse(response);
  } catch (error) {
    if (error instanceof AgendaUpstreamError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AgendaUpstreamError("O Insper demorou demais para responder.", 504, "UPSTREAM_TIMEOUT");
    }
    throw new AgendaUpstreamError("Não foi possível consultar a agenda do Insper.", 502, "UPSTREAM_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Método não permitido." } });
  }

  response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  response.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=120, stale-while-revalidate=600");

  try {
    const xml = await fetchAgenda();
    return response.status(200).json(parseAgendaXml(xml));
  } catch (error) {
    const known = error instanceof AgendaUpstreamError;
    const status = known ? error.status : 502;
    const code = known ? error.code : "INVALID_UPSTREAM_RESPONSE";
    console.error("Falha ao carregar agenda do Insper", error);
    return response.status(status).json({
      error: {
        code,
        message: known ? error.message : "A agenda do Insper retornou dados inválidos.",
      },
    });
  }
}

export { fetchAgenda, readLimitedResponse };
