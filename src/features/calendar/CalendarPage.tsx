import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";
import { PageHeader } from "../../shared/PageHeader";
import { ErrorState, LoadingSkeleton } from "../../shared/feedback";
import { addDays, formatDeadline, formatMonthTitle, getMonthRange, shiftMonth, toDateKey } from "../../lib/date";
import { queryKeys } from "../../lib/queryKeys";
import type { DeliveryWithSubject } from "../../lib/database.types";
import { fetchDeliveries } from "../deliveries/delivery.service";
import { deliveryTypeLabels } from "../deliveries/delivery.constants";

const weekDayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function getCalendarKeys(reference: Date): string[] {
  const month = getMonthRange(reference);
  const firstDay = new Date(`${month.startKey}T12:00:00Z`).getUTCDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const gridStart = addDays(month.startKey, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function DeliveryDetails({ delivery, onClose }: { delivery: DeliveryWithSubject; onClose: () => void }) {
  const deadline = formatDeadline(delivery.due_at);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="dialog-panel details-dialog" role="dialog" aria-modal="true" aria-labelledby="delivery-details-title">
        <div className="dialog-header">
          <div>
            <span className={`type-badge type-${delivery.type}`}>{deliveryTypeLabels[delivery.type]}</span>
            <h2 id="delivery-details-title">{delivery.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button>
        </div>
        <dl className="details-list">
          <div><dt>Disciplina</dt><dd>{delivery.subject.name}</dd></div>
          <div><dt>Prazo</dt><dd>{deadline.date}, às {deadline.time}</dd></div>
          <div><dt>Situação</dt><dd>{delivery.status === "active" ? "Ativa" : "Cancelada"}</dd></div>
        </dl>
        <p className="details-description">{delivery.description || "Sem descrição adicional."}</p>
        {delivery.source_url && <a className="primary-button details-link" href={delivery.source_url} target="_blank" rel="noreferrer">Abrir fonte oficial <ExternalLink aria-hidden="true" /></a>}
      </section>
    </div>
  );
}

export default function CalendarPage() {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryWithSubject | null>(null);
  const monthRange = useMemo(() => getMonthRange(referenceDate), [referenceDate]);
  const calendarKeys = useMemo(() => getCalendarKeys(referenceDate), [referenceDate]);
  const query = useQuery({
    queryKey: queryKeys.deliveries(monthRange.startIso, monthRange.endIso),
    queryFn: () => fetchDeliveries(monthRange.startIso, monthRange.endIso),
  });

  const groupedDeliveries = useMemo(() => {
    const groups = new Map<string, DeliveryWithSubject[]>();
    for (const delivery of query.data ?? []) {
      const key = toDateKey(new Date(delivery.due_at));
      groups.set(key, [...(groups.get(key) ?? []), delivery]);
    }
    return groups;
  }, [query.data]);

  return (
    <div>
      <PageHeader title="Calendário da turma" description="Veja como os prazos se distribuem ao longo do mês." />
      <section className="calendar-toolbar">
        <button className="secondary-button" type="button" onClick={() => setReferenceDate(new Date())}>Hoje</button>
        <div className="period-switcher">
          <button className="icon-button" type="button" onClick={() => setReferenceDate((date) => shiftMonth(date, -1))} aria-label="Mês anterior"><ChevronLeft aria-hidden="true" /></button>
          <strong>{formatMonthTitle(referenceDate)}</strong>
          <button className="icon-button" type="button" onClick={() => setReferenceDate((date) => shiftMonth(date, 1))} aria-label="Próximo mês"><ChevronRight aria-hidden="true" /></button>
        </div>
        <span className="result-count">{query.data?.length ?? 0} prazos</span>
      </section>

      {query.isLoading && <LoadingSkeleton columns={3} />}
      {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.isError && (
        <div className="calendar-shell">
          <div className="calendar-weekdays" aria-hidden="true">{weekDayLabels.map((label) => <span key={label}>{label}</span>)}</div>
          <div className="calendar-grid">
            {calendarKeys.map((dateKey) => {
              const isCurrentMonth = dateKey >= monthRange.startKey && dateKey < monthRange.endKey;
              const isToday = dateKey === toDateKey(new Date());
              const deliveries = groupedDeliveries.get(dateKey) ?? [];
              return (
                <div className={`calendar-day${isCurrentMonth ? "" : " outside"}${isToday ? " today" : ""}`} key={dateKey}>
                  <time dateTime={dateKey}>{Number(dateKey.slice(-2))}</time>
                  <div className="calendar-events">
                    {deliveries.map((delivery) => (
                      <button
                        type="button"
                        className="calendar-event"
                        style={{ "--subject-color": delivery.subject.color } as React.CSSProperties}
                        onClick={() => setSelectedDelivery(delivery)}
                        title={`${delivery.subject.name}: ${delivery.title}`}
                        key={delivery.id}
                      >
                        <span>{formatDeadline(delivery.due_at).time}</span> {delivery.title}
                      </button>
                    ))}
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
