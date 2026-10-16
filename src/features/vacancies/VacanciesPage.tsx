import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, CalendarDays, ExternalLink, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Vacancy } from "../../lib/database.types";
import { APP_TIME_ZONE } from "../../lib/date";
import { queryKeys } from "../../lib/queryKeys";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { PageHeader } from "../../shared/PageHeader";
import { fetchVacancies } from "./vacancy.service";
import { areaFromParam, areaOptions, filterAndSortVacancies, modeFromParam, modeOptions } from "./vacancy.utils";

function formatDeadline(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function formatVerifiedAt(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: APP_TIME_ZONE })
    .format(new Date(value));
}

function VacancyRow({ vacancy }: { vacancy: Vacancy }) {
  const area = areaOptions.find((option) => option.value === vacancy.area)?.label ?? "Tecnologia";
  const mode = modeOptions.find((option) => option.value === vacancy.work_mode)?.label ?? "Modalidade não informada";

  return (
    <li className="vacancy-row">
      <article>
        <div className="vacancy-row-main">
          <div>
            <h3>{vacancy.title}</h3>
            <p className="vacancy-company">{vacancy.company} <span aria-hidden="true">·</span> {area}</p>
          </div>
          <div className="vacancy-deadline">
            <span>Inscrições</span>
            {vacancy.application_deadline ? (
              <time dateTime={vacancy.application_deadline}>Até {formatDeadline(vacancy.application_deadline)}</time>
            ) : <strong>Prazo não informado</strong>}
          </div>
        </div>

        <div className="vacancy-details">
          <span><MapPin aria-hidden="true" /> {vacancy.location ?? "Local não informado"} · {mode}</span>
          <span><CalendarDays aria-hidden="true" /> {vacancy.internship_period ?? "Período a confirmar"}</span>
        </div>
        {vacancy.summary && <p className="vacancy-summary">{vacancy.summary}</p>}

        <div className="vacancy-row-footer">
          <div className="vacancy-provenance">
            <span>Fonte: {vacancy.source_url ? (
              <a href={vacancy.source_url} target="_blank" rel="noopener noreferrer">{vacancy.source_name}</a>
            ) : vacancy.source_name}</span>
            <span>Conferida em {vacancy.last_verified_at ? formatVerifiedAt(vacancy.last_verified_at) : "data não informada"}</span>
          </div>
          <a className="vacancy-official-link" href={vacancy.application_url} target="_blank" rel="noopener noreferrer">
            Ver vaga oficial <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </article>
    </li>
  );
}

export default function VacanciesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = {
    query: searchParams.get("q") ?? "",
    area: areaFromParam(searchParams.get("area")),
    mode: modeFromParam(searchParams.get("mode")),
  };
  const activeFilterCount = Number(filters.area !== "all") + Number(filters.mode !== "all");
  const query = useQuery({ queryKey: queryKeys.vacancies, queryFn: fetchVacancies, staleTime: 5 * 60_000 });
  const visible = filterAndSortVacancies(query.data ?? [], filters);

  function updateParam(key: "q" | "area" | "mode", value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      return next;
    }, { replace: true });
  }

  function clearFilters() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      for (const key of ["q", "area", "mode"]) next.delete(key);
      return next;
    }, { replace: true });
  }

  return (
    <section className="vacancies-page">
      <PageHeader title="Vagas" description="Estágios de férias relacionados à Ciência da Computação, conferidos antes da publicação." />
      <div className="vacancies-layout">
        <aside className="panel vacancies-filters" aria-label="Filtros de vagas">
          <div className="vacancies-filters-heading">
            <div className="vacancies-filter-title"><BriefcaseBusiness aria-hidden="true" /><h2>Encontre uma vaga</h2></div>
            {(filters.query || activeFilterCount > 0) && <button type="button" onClick={clearFilters}>Limpar filtros</button>}
          </div>
          <label className="vacancy-search">
            <span>Buscar</span>
            <span className="vacancy-search-field"><Search aria-hidden="true" /><input type="search" value={filters.query} onChange={(event) => updateParam("q", event.target.value)} placeholder="Cargo ou empresa" /></span>
          </label>
          <button className="vacancies-filter-toggle" type="button" aria-expanded={filtersOpen} aria-controls="vacancy-filter-fields" onClick={() => setFiltersOpen((value) => !value)}>
            <SlidersHorizontal aria-hidden="true" /> Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
          </button>
          <div className={`vacancies-filter-fields${filtersOpen ? " open" : ""}`} id="vacancy-filter-fields">
            <fieldset>
              <legend>Área</legend>
              <label><input type="radio" name="vacancy-area" checked={filters.area === "all"} onChange={() => updateParam("area", "all")} /> Todas as áreas</label>
              {areaOptions.map((option) => <label key={option.value}>
                <input type="radio" name="vacancy-area" value={option.value} checked={filters.area === option.value} onChange={() => updateParam("area", option.value)} /> {option.label}
              </label>)}
            </fieldset>
            <fieldset>
              <legend>Modalidade</legend>
              <label><input type="radio" name="vacancy-mode" checked={filters.mode === "all"} onChange={() => updateParam("mode", "all")} /> Todas</label>
              {modeOptions.map((option) => <label key={option.value}>
                <input type="radio" name="vacancy-mode" value={option.value} checked={filters.mode === option.value} onChange={() => updateParam("mode", option.value)} /> {option.label}
              </label>)}
            </fieldset>
          </div>
        </aside>

        <section className="panel vacancies-results" aria-labelledby="vacancies-results-title">
          <div className="vacancies-results-heading">
            <div><h2 id="vacancies-results-title">Oportunidades abertas</h2><p>Prazos de inscrição mais próximos primeiro.</p></div>
            {!query.isPending && !query.isError && <span className="vacancies-count" aria-live="polite">{visible.length} {visible.length === 1 ? "vaga" : "vagas"}</span>}
          </div>
          {query.isPending && <div className="vacancies-results-body"><LoadingSkeleton columns={1} /></div>}
          {query.isError && <div className="vacancies-results-body"><ErrorState onRetry={() => void query.refetch()} /></div>}
          {!query.isPending && !query.isError && !query.data?.length && (
            <div className="vacancies-results-body"><EmptyState title="Nenhuma vaga aberta por enquanto" description="Novas oportunidades verificadas aparecerão aqui." /></div>
          )}
          {!query.isPending && !query.isError && !!query.data?.length && !visible.length && (
            <div className="vacancies-results-body vacancies-filter-empty">
              <EmptyState title="Nenhuma vaga corresponde aos filtros" description="Tente outra busca ou remova os filtros para ver todas as oportunidades." />
              <button className="secondary-button" type="button" onClick={clearFilters}>Limpar filtros</button>
            </div>
          )}
          {!!visible.length && !query.isError && <ol className="vacancies-list">{visible.map((vacancy) => <VacancyRow vacancy={vacancy} key={vacancy.id} />)}</ol>}
        </section>
      </div>
    </section>
  );
}
