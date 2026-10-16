import { describe, expect, it } from "vitest";
import { validateClosure, validateVacancy } from "./validation.mjs";

const now = new Date("2026-10-16T15:00:00Z");
const official = "https://carreiras.btgpactual.com/tecnologia";
const input = () => ({
  source: "btg",
  checked_on: "2026-10-16",
  title: "Estágio de férias em Engenharia de Software",
  area: "software",
  location: "São Paulo, SP",
  state: "SP",
  work_mode: "hybrid",
  internship_period: "Janeiro de 2027",
  application_deadline: "2026-11-20",
  summary: "Programa de férias para estudantes de computação.",
  source_url: official,
  application_url: "https://carreiras.btgpactual.com/tecnologia/vaga-exemplo",
  evidence: Object.fromEntries([
    ["vacation_internship", "Estágio de férias com duração em janeiro de 2027"],
    ["technology_area", "Atuação em desenvolvimento de software"],
    ["computer_science", "Estudantes de Ciência da Computação podem participar"],
    ["location", "Atuação híbrida em São Paulo, SP"],
    ["internship_period", "O programa ocorre em janeiro de 2027"],
    ["applications_open", "Inscrições abertas para esta vaga"],
    ["application_deadline", "Inscrições até 20/11/2026"],
  ].map(([key, quote]) => [key, { url: official, quote }])),
});

describe("manual vacancy validation", () => {
  it("accepts a complete eligible vacancy", () => {
    const result = validateVacancy(input(), now);
    expect(result.row.review_status).toBe("approved");
    expect(result.row.opening_status).toBe("open");
  });

  it.each([
    ["expired deadline", (item) => { item.application_deadline = "2026-10-15"; }, /deadline has passed/],
    ["missing deadline", (item) => { item.application_deadline = null; }, /application_deadline/],
    ["nonofficial link", (item) => { item.application_url = "https://example.com/job"; }, /official/],
    ["regular internship", (item) => { item.evidence.vacation_internship.quote = "Estágio regular de seis meses"; }, /Vacation internship/],
    ["unrelated area", (item) => { item.area = "sales"; }, /area/],
    ["unrelated role", (item) => { item.evidence.technology_area.quote = "Atuação em vendas"; }, /Area evidence/],
    ["ineligible course", (item) => { delete item.evidence.computer_science; }, /computer_science/],
    ["out of state", (item) => { item.state = "MG"; item.location = "Belo Horizonte, MG"; }, /São Paulo/],
    ["unconfirmed mode", (item) => { item.evidence.location.quote = "Atuação em São Paulo, SP"; }, /Location evidence/],
    ["unconfirmed open status", (item) => { delete item.evidence.applications_open; }, /applications_open/],
    ["stale verification", (item) => { item.checked_on = "2026-10-15"; }, /today/],
  ])("rejects %s", (_name, change, expected) => {
    const item = input();
    change(item);
    expect(() => validateVacancy(item, now)).toThrow(expected);
  });

  it("requires fresh closure evidence", () => {
    expect(validateClosure({ source: "btg", checked_on: "2026-10-16", application_url: input().application_url, reason: "Inscrições encerradas", evidence: { url: official, quote: "Inscrições encerradas" } }, now).reason).toBe("Inscrições encerradas");
    expect(() => validateClosure({ source: "btg", checked_on: "2026-10-15", application_url: input().application_url, reason: "Closed", evidence: { url: official, quote: "Closed" } }, now)).toThrow(/today/);
  });
});
