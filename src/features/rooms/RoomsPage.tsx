import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, Clock3, DoorOpen, LocateFixed, MapPin, RefreshCw, UsersRound } from "lucide-react";
import { APP_TIME_ZONE } from "../../lib/date";
import { EmptyState, ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { PageHeader } from "../../shared/PageHeader";
import { ResultCount, Toolbar } from "../../shared/Toolbar";
import { getAgenda } from "./room.service";
import {
  CLASS_NAME,
  getAvailableRooms,
  getClassEvents,
  getHighlightedClass,
  groupRooms,
  minutesToTime,
  timeToMinutes,
} from "./room.utils";

const agendaQueryKey = ["agenda"] as const;

function currentTime(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${value("hour")}:${value("minute")}`;
}

function formatAgendaDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`));
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE }).format(new Date(iso));
}

export default function RoomsPage() {
  const [now, setNow] = useState(() => currentTime());
  const [start, setStart] = useState(() => currentTime());
  const [end, setEnd] = useState(() => minutesToTime(timeToMinutes(currentTime()) + 60));
  const [building, setBuilding] = useState("all");
  const query = useQuery({
    queryKey: agendaQueryKey,
    queryFn: ({ signal }) => getAgenda(signal),
    staleTime: 2 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(currentTime()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const events = useMemo(() => query.data?.events ?? [], [query.data?.events]);
  const classEvents = useMemo(() => getClassEvents(events), [events]);
  const highlightedClass = useMemo(() => getHighlightedClass(classEvents, now), [classEvents, now]);
  const buildings = useMemo(() => [...new Set(events
    .filter((event) => event.room && event.room.toLocaleUpperCase("pt-BR") !== "AULA REMOTA")
    .map((event) => event.building || "Prédio não informado"))]
    .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true })), [events]);
  const validInterval = timeToMinutes(end) > timeToMinutes(start);
  const availableRooms = useMemo(
    () => validInterval ? getAvailableRooms(events, start, end, building) : [],
    [events, start, end, building, validInterval],
  );
  const roomGroups = useMemo(() => groupRooms(availableRooms), [availableRooms]);

  function setIntervalToNow() {
    const nextStart = currentTime();
    setNow(nextStart);
    setStart(nextStart);
    setEnd(minutesToTime(timeToMinutes(nextStart) + 60));
  }

  if (query.isPending) return <LoadingSkeleton columns={2} />;
  if (query.isError && !query.data) {
    return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  }

  return (
    <section className="rooms-page">
      <PageHeader
        title="Salas"
        description="A agenda da turma e os espaços sem conflito no intervalo que você escolher."
      />

      {query.data && (
        <Toolbar label="Controles das salas">
          <span className="agenda-date">{formatAgendaDate(query.data.date)}</span>
          <button className="secondary-button" type="button" onClick={() => void query.refetch()} disabled={query.isFetching}>
            <RefreshCw className={query.isFetching ? "spin" : ""} aria-hidden="true" /> Atualizar
          </button>
          {validInterval && (
            <ResultCount isLive>
              {availableRooms.length} {availableRooms.length === 1 ? "espaço disponível" : "espaços disponíveis"} · {start}–{end}
            </ResultCount>
          )}
        </Toolbar>
      )}

      {query.isError && query.data && (
        <div className="rooms-stale-warning" role="status">
          <AlertTriangle aria-hidden="true" /> Exibindo a última agenda disponível. A atualização falhou.
        </div>
      )}

      <div className="rooms-layout">
        <aside className="panel class-agenda-panel" aria-labelledby="class-agenda-title">
          <div className="class-panel-heading">
            <span><UsersRound aria-hidden="true" /></span>
            <div>
              <p>Sua turma</p>
              <h2 id="class-agenda-title">{CLASS_NAME}</h2>
            </div>
          </div>

          {highlightedClass ? (
            <article className="next-class-card">
              <span className="next-class-eyebrow">
                {timeToMinutes(highlightedClass.start) <= timeToMinutes(now) ? "Acontecendo agora" : "Próxima sala"}
              </span>
              <strong>{highlightedClass.room || "Sala a confirmar"}</strong>
              <h3>{highlightedClass.title || highlightedClass.type}</h3>
              <div className="next-class-meta">
                <span><Clock3 aria-hidden="true" /> {highlightedClass.start}–{highlightedClass.end}</span>
                <span><MapPin aria-hidden="true" /> {[highlightedClass.building, highlightedClass.floor].filter(Boolean).join(" · ") || "Local não informado"}</span>
              </div>
            </article>
          ) : (
            <div className="no-next-class">
              <DoorOpen aria-hidden="true" />
              <div><strong>Sem mais aulas hoje</strong><span>A agenda do dia está livre daqui em diante.</span></div>
            </div>
          )}

          <details className="day-schedule" open>
            <summary>Agenda completa <span>{classEvents.length} {classEvents.length === 1 ? "aula" : "aulas"}</span></summary>
            {classEvents.length ? (
              <ol>
                {classEvents.map((event) => (
                  <li className={`${event.cancelled ? "cancelled" : ""}${event.id === highlightedClass?.id ? " current" : ""}`} key={event.id}>
                    <time>{event.start}</time>
                    <span className="timeline-marker" aria-hidden="true" />
                    <div>
                      <strong>{event.title || event.type}</strong>
                      <span>{event.room || "Sala a confirmar"} · {event.end}</span>
                      {event.cancelled && <em>Cancelada</em>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="empty-schedule">Nenhuma aula da turma foi encontrada na agenda de hoje.</p>
            )}
          </details>
        </aside>

        <section className="panel available-rooms-panel" aria-labelledby="available-rooms-title">
          <div className="available-heading">
            <div>
              <p>Consulta operacional</p>
              <h2 id="available-rooms-title">Salas disponíveis</h2>
            </div>
          </div>

          <div className="room-filters">
            <label>
              <span>Início</span>
              <input type="time" value={start} onChange={(event) => setStart(event.target.value)} />
            </label>
            <label>
              <span>Fim</span>
              <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
            </label>
            <label className="building-filter">
              <span>Prédio</span>
              <select value={building} onChange={(event) => setBuilding(event.target.value)}>
                <option value="all">Todos os prédios</option>
                {buildings.map((item) => <option value={item} key={item}>{item}</option>)}
              </select>
            </label>
            <button className="now-button" type="button" onClick={setIntervalToNow}>
              <LocateFixed aria-hidden="true" /> Agora
            </button>
          </div>

          {!validInterval ? (
            <div className="interval-error" role="alert">O horário final precisa ser posterior ao inicial.</div>
          ) : (
            <>
              {roomGroups.length ? (
                <div className="room-groups">
                  {roomGroups.map((group) => (
                    <section className="room-building" key={group.building}>
                      <header><Building2 aria-hidden="true" /><h3>{group.building}</h3></header>
                      {group.floors.map((floor) => (
                        <div className="room-floor" key={floor.floor}>
                          <p>{floor.floor}</p>
                          <ul>
                            {floor.rooms.map((room) => (
                              <li key={room.key}>
                                <span className="availability-dot" aria-hidden="true" />
                                <div className="room-identity"><strong>{room.room}</strong><span>Livre no intervalo</span></div>
                                <div className="room-context">
                                  {room.nextEvent ? <strong>Livre até {room.nextEvent.start}</strong> : <strong>Livre pelo restante do dia</strong>}
                                  <span>{room.nextEvent ? `Próximo: ${room.nextEvent.title || room.nextEvent.type}` : room.previousEvent ? `Último uso terminou às ${room.previousEvent.end}` : "Sem outros usos registrados"}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhuma sala livre nesse intervalo" description="Tente reduzir o período ou consultar outro prédio." />
              )}
            </>
          )}

          <footer className="rooms-source-note">
            <AlertTriangle aria-hidden="true" />
            <span>Disponibilidade acadêmica; o acesso ao espaço pode ser restrito. Dados públicos do Insper{query.data ? `, atualizados às ${formatUpdatedAt(query.data.fetchedAt)}` : ""}.</span>
          </footer>
        </section>
      </div>
    </section>
  );
}
