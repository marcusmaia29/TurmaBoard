export const queryKeys = {
  deliveries: (start: string, end: string) => ["deliveries", start, end] as const,
  subjects: ["subjects", "active"] as const,
  adminSubjects: ["subjects", "all"] as const,
  history: (page: number) => ["history", page] as const,
  lessonNotes: (start?: string, end?: string, subjectId?: string, order: "asc" | "desc" = "desc") => ["lesson-notes", start, end, subjectId, order] as const,
  lessonNote: (id: string) => ["lesson-note", id] as const,
};
