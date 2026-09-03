import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "./agenda.js";

const xml = `<ArrayOfCalendarioEvento><CalendarioEvento>
  <data>02/09/2026</data><tipoaula>Aula</tipoaula><horainicio>08:00</horainicio><horatermino>09:00</horatermino>
  <turma>Turma</turma><titulo>Aula</titulo><professor>Professor</professor><sala>101</sala><andar>1º andar</andar>
  <predio>Prédio 1</predio><cancelada>N</cancelada><familia_curso>Graduação</familia_curso>
</CalendarioEvento></ArrayOfCalendarioEvento>`;

function responseMock() {
  const headers = new Map<string, string>();
  let statusCode = 0;
  let body: unknown;
  const response = {
    setHeader: (name: string, value: string) => headers.set(name, value),
    status: vi.fn((code: number) => {
      statusCode = code;
      return response;
    }),
    json: vi.fn((value: unknown) => {
      body = value;
      return value;
    }),
  };
  return { response, headers, getStatus: () => statusCode, getBody: () => body };
}

describe("GET /api/agenda", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retorna a agenda normalizada com cache de CDN", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(xml, { status: 200 })));
    const mock = responseMock();

    await handler({ method: "GET" }, mock.response);

    expect(mock.getStatus()).toBe(200);
    expect(mock.getBody()).toMatchObject({ date: "2026-09-02", events: [{ room: "101" }] });
    expect(mock.headers.get("Vercel-CDN-Cache-Control")).toContain("s-maxage=120");
  });

  it("rejeita outros métodos sem consultar o Insper", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const mock = responseMock();

    await handler({ method: "POST" }, mock.response);

    expect(mock.getStatus()).toBe(405);
    expect(mock.headers.get("Allow")).toBe("GET");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("recusa uma resposta maior que 2 MB", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", {
      status: 200,
      headers: { "content-length": String(2 * 1024 * 1024 + 1) },
    })));
    const mock = responseMock();

    await handler({ method: "GET" }, mock.response);

    expect(mock.getStatus()).toBe(502);
    expect(mock.getBody()).toMatchObject({ error: { code: "RESPONSE_TOO_LARGE" } });
  });
});
