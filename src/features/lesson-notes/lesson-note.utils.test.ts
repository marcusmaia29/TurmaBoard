import type { DeliveryWithSubject, LessonNoteWithSubjectAndImages, Subject } from "../../lib/database.types";
import { groupNotesByMonth, mergeAcademicItems, plainTextExcerpt } from "./lesson-note.utils";

const subject: Subject = {
  id: "subject-id", name: "Cálculo", code: "CALC", color: "#168C62", position: 0,
  notes: "", official_url: null, platform_url: null, repository_url: null, archived_at: null,
  created_at: "2026-08-01T12:00:00Z", updated_at: "2026-08-01T12:00:00Z",
};

function note(id: string, occurredAt: string): LessonNoteWithSubjectAndImages {
  return {
    id, subject_id: subject.id, title: `Aula ${id}`, occurred_at: occurredAt,
    content_format: "markdown", content: "Conteúdo", created_by: null, created_by_name: "Admin",
    updated_by: null, updated_by_name: "Admin", created_at: occurredAt, updated_at: occurredAt,
    deleted_at: null, subject, images: [],
  };
}

function delivery(id: string, dueAt: string): DeliveryWithSubject {
  return {
    id, subject_id: subject.id, title: `Entrega ${id}`, type: "activity", description: "",
    due_at: dueAt, source_url: null, status: "active", created_by: null, created_by_name: "Admin",
    updated_by: null, updated_by_name: "Admin", created_at: dueAt, updated_at: dueAt,
    deleted_at: null, subject,
  };
}

describe("lesson-note utils", () => {
  it("une entregas e anotações em ordem temporal", () => {
    const result = mergeAcademicItems(
      [delivery("d", "2026-09-10T18:00:00-03:00")],
      [note("n", "2026-09-10T10:00:00-03:00")],
    );
    expect(result.map((item) => item.kind)).toEqual(["lesson-note", "delivery"]);
  });

  it("gera um resumo sem marcação e respeita o limite", () => {
    expect(plainTextExcerpt("## Árvores **binárias** e `$n$`", 18)).toBe("Árvores binárias e…");
  });

  it("agrupa as aulas por mês mantendo a ordenação recebida", () => {
    const result = groupNotesByMonth([
      note("setembro", "2026-09-12T10:00:00-03:00"),
      note("agosto", "2026-08-29T10:00:00-03:00"),
    ]);
    expect(result.map((group) => group.key)).toEqual(["2026-09", "2026-08"]);
    expect(result[0].label).toMatch(/setembro de 2026/i);
  });
});
