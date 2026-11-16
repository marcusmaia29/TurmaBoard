import { useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AcademicCalendarItem } from "../../lib/database.types";
import { addDays, toDateKey } from "../../lib/date";
import { EmptyState } from "../../shared/feedback";
import { itemDate } from "../lesson-notes/lesson-note.utils";

const dayNames = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

export function DayBoard({ startKey, items, renderItem }: {
  startKey: string;
  items: AcademicCalendarItem[];
  renderItem: (item: AcademicCalendarItem) => React.ReactNode;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const today = toDateKey(new Date());
  const days = useMemo(() => dayNames.map((name, index) => ({ name, key: addDays(startKey, index) })), [startKey]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const todayIndex = days.findIndex((day) => day.key === today);
    const column = board.children[todayIndex >= 5 ? todayIndex : 0] as HTMLElement;
    // Scroll only the board, preserving the page's vertical position.
    board.scrollTo({ left: column.offsetLeft - (board.firstElementChild as HTMLElement).offsetLeft, behavior: "instant" });
  }, [days, today]);

  function movePage(direction: number) {
    const board = boardRef.current;
    if (!board) return;
    board.scrollBy({ left: direction * board.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return (
    <div className="day-board-container">
      <div className="day-board-navigation">
        <span>Segunda a sexta · deslize para ver sábado e domingo</span>
        <div className="day-board-actions">
          <button className="icon-button" type="button" aria-label="Dias anteriores" onClick={() => movePage(-1)}><ChevronLeft aria-hidden="true" /></button>
          <button className="icon-button" type="button" aria-label="Próximos dias" onClick={() => movePage(1)}><ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
      <div className="subject-board day-board" ref={boardRef} role="region" aria-label="Quadro por dia, de segunda a domingo" tabIndex={0}>
        {days.map((day) => {
          const dayItems = items.filter((item) => toDateKey(new Date(itemDate(item))) === day.key);
          const isToday = day.key === today;
          return (
            <section className={`subject-column day-column${isToday ? " day-column-today" : ""}`} aria-label={`${day.name} ${day.key.slice(8)}/${day.key.slice(5, 7)}`} aria-current={isToday ? "date" : undefined} key={day.key}>
              <header className="subject-column-header day-column-header">
                <span className="subject-code">{day.key.slice(8)}</span>
                <div><h2>{day.name}</h2><p>{day.key.slice(8)}/{day.key.slice(5, 7)} · {dayItems.length} {dayItems.length === 1 ? "item" : "itens"}</p></div>
                {isToday && <span className="today-label">Hoje</span>}
              </header>
              <div className="delivery-list">
                {dayItems.map((item) => (
                  <div className="day-academic-item" style={{ "--subject-color": item.data.subject.color } as React.CSSProperties} key={`${item.kind}-${item.data.id}`}>
                    <span className="day-item-subject">{item.data.subject.code} · {item.data.subject.name}</span>
                    {renderItem(item)}
                  </div>
                ))}
                {!dayItems.length && <EmptyState title="Dia livre" description="Nenhuma entrega ou anotação para este dia." />}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
