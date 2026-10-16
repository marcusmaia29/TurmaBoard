import type { Vacancy, VacancyArea, VacancyWorkMode } from "../../lib/database.types";

export const areaOptions: ReadonlyArray<{ value: VacancyArea; label: string }> = [
  { value: "software", label: "Desenvolvimento de software" },
  { value: "data_ai", label: "Dados e IA" },
  { value: "infrastructure", label: "Infraestrutura" },
  { value: "security", label: "Segurança" },
  { value: "product", label: "Produto" },
  { value: "other", label: "Outras áreas de tecnologia" },
];

export const modeOptions: ReadonlyArray<{ value: VacancyWorkMode; label: string }> = [
  { value: "onsite", label: "Presencial" },
  { value: "hybrid", label: "Híbrido" },
  { value: "remote", label: "Remoto" },
];

export type VacancyFilters = {
  query: string;
  area: VacancyArea | "all";
  mode: VacancyWorkMode | "all";
};

export function areaFromParam(value: string | null): VacancyFilters["area"] {
  return areaOptions.find((option) => option.value === value)?.value ?? "all";
}

export function modeFromParam(value: string | null): VacancyFilters["mode"] {
  return modeOptions.find((option) => option.value === value)?.value ?? "all";
}

function fold(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterAndSortVacancies(vacancies: Vacancy[], filters: VacancyFilters): Vacancy[] {
  const query = fold(filters.query.trim());
  return vacancies
    .filter((vacancy) =>
      (filters.area === "all" || vacancy.area === filters.area)
      && (filters.mode === "all" || vacancy.work_mode === filters.mode)
      && (!query || fold(`${vacancy.title} ${vacancy.company}`).includes(query)))
    .sort((a, b) =>
      (a.application_deadline ?? "9999-12-31").localeCompare(b.application_deadline ?? "9999-12-31")
      || (b.last_verified_at ?? "").localeCompare(a.last_verified_at ?? "")
      || a.title.localeCompare(b.title, "pt-BR"));
}
