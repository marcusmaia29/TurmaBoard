import { describe, expect, it } from "vitest";
import type { Vacancy } from "../../lib/database.types";
import { areaFromParam, filterAndSortVacancies, modeFromParam } from "./vacancy.utils";

function vacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "vacancy-1",
    company: "Empresa",
    title: "Estágio em Engenharia de Software",
    area: "software",
    location: "São Paulo, SP",
    work_mode: "hybrid",
    internship_period: "Janeiro e fevereiro",
    application_deadline: "2026-11-15",
    summary: null,
    source_name: "Carreiras",
    source_url: null,
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

const all = { query: "", area: "all", mode: "all" } as const;

describe("vacancy filters", () => {
  it("orders deadlines from nearest to latest and leaves missing deadlines last", () => {
    const vacancies = [
      vacancy({ id: "missing", application_deadline: null }),
      vacancy({ id: "later", application_deadline: "2026-12-01" }),
      vacancy({ id: "nearest", application_deadline: "2026-10-30" }),
    ];

    expect(filterAndSortVacancies(vacancies, all).map((item) => item.id)).toEqual(["nearest", "later", "missing"]);
    expect(vacancies[0].id).toBe("missing");
  });

  it("searches title or company without requiring accents or matching case", () => {
    const vacancies = [
      vacancy({ id: "one", company: "Conexão Digital" }),
      vacancy({ id: "two", company: "Outra", title: "Estágio em Segurança" }),
    ];

    expect(filterAndSortVacancies(vacancies, { ...all, query: "CONEXAO" }).map((item) => item.id)).toEqual(["one"]);
    expect(filterAndSortVacancies(vacancies, { ...all, query: "seguranca" }).map((item) => item.id)).toEqual(["two"]);
  });

  it("combines area and mode and ignores invalid URL filter values", () => {
    const vacancies = [
      vacancy({ id: "one", area: "data_ai", work_mode: "remote" }),
      vacancy({ id: "two", area: "data_ai", work_mode: "hybrid" }),
      vacancy({ id: "three", area: "software", work_mode: "remote" }),
    ];

    expect(filterAndSortVacancies(vacancies, { query: "", area: "data_ai", mode: "remote" }).map((item) => item.id)).toEqual(["one"]);
    expect(areaFromParam("unknown")).toBe("all");
    expect(modeFromParam("unknown")).toBe("all");
  });
});
