import { useState, type CSSProperties } from "react";
import { Clock3 } from "lucide-react";
import { PageHeader } from "../../shared/PageHeader";
import { SegmentedControl } from "../../shared/SegmentedControl";
import { Toolbar } from "../../shared/Toolbar";
import { findGradeSession, getInitialGradeDay, gradeDays, gradeSessions, gradeSlots, gradeSubjects, type GradeDayId, type GradeSession } from "./grade.data";

const dayOptions = gradeDays.map((day) => ({ value: day.id, label: day.label, shortLabel: day.shortLabel }));

function SessionCard({ session }: { session: GradeSession }) {
  const style = { "--subject-color": gradeSubjects[session.subjectCode].color } as CSSProperties;
  return (
    <article className={`grade-session grade-session-${session.kind}`} style={style}>
      <div className="grade-session-topline">
        <span>{session.kind === "office-hours" ? "Atendimento" : session.subjectCode}</span>
        <time dateTime={session.start}>{session.start}–{session.end}</time>
      </div>
      <strong>{session.subject}</strong>
      {session.instructor && <small>{session.instructor}</small>}
    </article>
  );
}

export default function GradePage() {
  const [selectedDay, setSelectedDay] = useState<GradeDayId>(() => getInitialGradeDay());

  return (
    <div>
      <PageHeader title="Grade semanal" description="Aulas e atendimentos do quarto semestre, organizados para consulta rápida." />

      <Toolbar label="Controles e legenda da grade">
        {/* The wrapper owns visibility — the picker only appears on narrow screens. */}
        <div className="grade-day-picker">
          <SegmentedControl
            label="Selecionar dia da semana"
            options={dayOptions}
            value={selectedDay}
            onChange={setSelectedDay}
          />
        </div>
        <div className="grade-legend" aria-label="Cores das disciplinas">
          {Object.entries(gradeSubjects).map(([code, subject]) => (
            <span key={code}><i style={{ backgroundColor: subject.color }} aria-hidden="true" />{subject.name}</span>
          ))}
          <span><i className="grade-office-key" aria-hidden="true" />Atendimento</span>
        </div>
      </Toolbar>

      <div className="panel grade-table-shell">
        <table className="grade-table">
          <caption className="sr-only">Grade semanal de aulas e atendimentos</caption>
          <thead>
            <tr>
              <th className="grade-time-heading" scope="col">Horário</th>
              {gradeDays.map((day) => (
                <th className={selectedDay === day.id ? "is-selected" : ""} data-day={day.id} scope="col" key={day.id}>{day.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gradeSlots.map((slot) => (
              <tr key={slot.id}>
                <th scope="row"><time dateTime={slot.start}>{slot.start}</time><span>{slot.end}</span></th>
                {gradeDays.map((day) => {
                  const session = findGradeSession(day.id, slot.id);
                  return (
                    <td className={selectedDay === day.id ? "is-selected" : ""} data-day={day.id} key={day.id}>
                      {session ? <SessionCard session={session} /> : <span className="sr-only">Sem atividade</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="grade-note"><Clock3 aria-hidden="true" /> {gradeSessions.filter((session) => session.kind === "class").length} aulas e {gradeSessions.filter((session) => session.kind === "office-hours").length} atendimentos · horários de Brasília</p>
    </div>
  );
}
