export const queryKeys = {
  deliveries: (start: string, end: string) => ["deliveries", start, end] as const,
  subjects: ["subjects", "active"] as const,
  adminSubjects: ["subjects", "all"] as const,
  history: (page: number) => ["history", page] as const,
};
