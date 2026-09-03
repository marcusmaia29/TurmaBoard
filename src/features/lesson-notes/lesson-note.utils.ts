import type { AcademicCalendarItem, DeliveryWithSubject, LessonNoteWithSubjectAndImages } from "../../lib/database.types";

export function mergeAcademicItems(deliveries: DeliveryWithSubject[], notes: LessonNoteWithSubjectAndImages[]): AcademicCalendarItem[] {
  return [
    ...deliveries.map((data): AcademicCalendarItem => ({ kind: "delivery", data })),
    ...notes.map((data): AcademicCalendarItem => ({ kind: "lesson-note", data })),
  ].sort((a, b) => itemDate(a).localeCompare(itemDate(b)));
}

export function itemDate(item: AcademicCalendarItem): string {
  return item.kind === "delivery" ? item.data.due_at : item.data.occurred_at;
}

export function plainTextExcerpt(content: string, limit = 150): string {
  const clean = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`~$\\{}|]/g, " ")
    .replaceAll("[", " ")
    .replaceAll("]", " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}…` : clean;
}

export function groupNotesByMonth(notes: LessonNoteWithSubjectAndImages[]): Array<{ key: string; label: string; notes: LessonNoteWithSubjectAndImages[] }> {
  const groups = new Map<string, LessonNoteWithSubjectAndImages[]>();
  for (const note of notes) {
    const key = note.occurred_at.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), note]);
  }
  return [...groups.entries()].map(([key, monthNotes]) => ({
    key,
    label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })
      .format(new Date(`${key}-15T12:00:00-03:00`)),
    notes: monthNotes,
  }));
}
