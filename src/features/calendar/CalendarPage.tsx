import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpenText, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../shared/PageHeader";
import { ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { formatDeadline, formatMonthTitle, getMonthRange, shiftMonth, toDateKey } from "../../lib/date";
import { queryKeys } from "../../lib/queryKeys";
import type { AcademicCalendarItem, DeliveryWithSubject } from "../../lib/database.types";
import { fetchDeliveries } from "../deliveries/delivery.service";
import { deliveryTypeLabels } from "../deliveries/delivery.constants";
import { Dialog } from "../../shared/Dialog";
import { getCalendarKeys, getCalendarQueryRange } from "./calendar.utils";
import { fetchLessonNotes } from "../lesson-notes/lesson-note.service";
import { itemDate, mergeAcademicItems } from "../lesson-notes/lesson-note.utils";

const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function DeliveryDetails({ delivery, onClose }: { delivery: DeliveryWithSubject; onClose: () => void }) {
  const deadline = formatDeadline(delivery.due_at);

  return (
    <Dialog title={delivery.title} className="details-dialog" onClose={onClose}>
        <span className={`type-badge details-type type-${delivery.type}`}>{deliveryTypeLabels[delivery.type]}</span>
        <dl className="details-list">
          <div><dt>Disciplina</dt><dd>{delivery.subject.name}</dd></div>
          <div><dt>Prazo</dt><dd>{deadline.date}, às {deadline.time}</dd></div>
          <div><dt>Situação</dt><dd>{delivery.status === "active" ? "Ativa" : "Cancelada"}</dd></div>
        </dl>
        <p className="details-description">{delivery.description || "Sem descrição adicional."}</p>
        {delivery.source_url && <a className="primary-button details-link" href={delivery.source_url} target="_blank" rel="noreferrer">Abrir fonte oficial <ExternalLink aria-hidden="true" /></a>}
    </Dialog>
  );
}

export default function CalendarPage() {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithSubject | null>(null);
  const navigate = useNavigate();
  const monthRange = useMemo(() => getMonthRange(referenceDate), [referenceDate]);
  const calendarKeys = useMemo(() => getCalendarKeys(referenceDate), [referenceDate]);
  const calendarRange = useMemo(() => getCalendarQueryRange(referenceDate), [referenceDate]);
  const query = useQuery({
    queryKey: queryKeys.deliveries(calendarRange.startIso, calendarRange.endIso),
    queryFn: () => fetchDeliveries(calendarRange.startIso, calendarRange.endIso),
  });
  const notesQuery = useQuery({
    queryKey: queryKeys.lessonNotes(calendarRange.startIso, calendarRange.endIso, undefined, "asc"),
    queryFn: () => fetchLessonNotes({ start: calendarRange.startIso, end: calendarRange.endIso, order: "asc" }),
  });

  const groupedItems = useMemo(() => {
    const groups = new Map<string, AcademicCalendarItem[]>();
    for (const item of mergeAcademicItems(query.data ?? [], notesQuery.data ?? [])) {
      const key = toDateKey(new Date(itemDate(item)));
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return groups;
  }, [notesQuery.data, query.data]);

  return (
    <div>
      <PageHeader title="Calendário da turma" description="Veja prazos e anotações de aula distribuídos ao longo do mês." />
      <section className="calendar-toolbar">
        <button className="secondary-button" type="button" onClick={() => setReferenceDate(new Date())}>Hoje</button>
        <div className="period-switcher">
          <button className="icon-button" type="button" onClick={() => setReferenceDate((date) => shiftMonth(date, -1))} aria-label="Mês anterior"><ChevronLeft aria-hidden="true" /></button>
          <strong>{formatMonthTitle(referenceDate)}</strong>
          <button className="icon-button" type="button" onClick={() => setReferenceDate((date) => shiftMonth(date, 1))} aria-label="Próximo mês"><ChevronRight aria-hidden="true" /></button>
        </div>
        <span className="result-count">{(query.data?.length ?? 0) + (notesQuery.data?.length ?? 0)} itens</span>
      </section>

      {(query.isLoading || notesQuery.isLoading) && <LoadingSkeleton columns={3} />}
      {(query.isError || notesQuery.isError) && <ErrorState onRetry={() => { void query.refetch(); void notesQuery.refetch(); }} />}
      {!query.isLoading && !notesQuery.isLoading && !query.isError && !notesQuery.isError && (
        <div className="calendar-shell">
          <div className="calendar-weekdays" aria-hidden="true">{weekDayLabels.map((label) => <span key={label}>{label}</span>)}</div>
          <div className="calendar-grid">
            {calendarKeys.map((dateKey) => {
              const isCurrentMonth = dateKey >= monthRange.startKey && dateKey < monthRange.endKey;
              const isToday = dateKey === toDateKey(new Date());
              const items = groupedItems.get(dateKey) ?? [];
              return (
                <div className={`calendar-day${isCurrentMonth ? "" : " outside"}${isToday ? " today" : ""}`} key={dateKey}>
                  <time dateTime={dateKey}>{Number(dateKey.slice(-2))}</time>
                  <div className="calendar-events">
                    {items.map((item) => item.kind === "delivery" ? (
                      <button
                        type="button"
                        className="calendar-event"
                        style={{ "--subject-color": item.data.subject.color } as React.CSSProperties}
                        onClick={() => setSelectedDelivery(item.data)}
                        title={`${item.data.subject.name}: ${item.data.title}`}
                        key={`delivery-${item.data.id}`}
                      >
                        <span>{formatDeadline(item.data.due_at).time}</span> {item.data.title}
                      </button>
                    ) : <button type="button" className="calendar-event calendar-note" style={{ "--subject-color": item.data.subject.color } as React.CSSProperties} onClick={() => navigate(`/subjects/${item.data.subject_id}/notes/${item.data.id}`)} title={`Anotação de ${item.data.subject.name}: ${item.data.title}`} key={`note-${item.data.id}`}><BookOpenText aria-hidden="true" /><span>{formatDeadline(item.data.occurred_at).time}</span> {item.data.title}</button>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {selectedDelivery && <DeliveryDetails delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} />}
    </div>
  );
}
