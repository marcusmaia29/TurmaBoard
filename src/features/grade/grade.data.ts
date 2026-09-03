export const gradeDays = [
  { id: "monday", label: "Segunda", shortLabel: "Seg" },
  { id: "tuesday", label: "Terça", shortLabel: "Ter" },
  { id: "wednesday", label: "Quarta", shortLabel: "Qua" },
  { id: "thursday", label: "Quinta", shortLabel: "Qui" },
  { id: "friday", label: "Sexta", shortLabel: "Sex" },
] as const;

export type GradeDayId = (typeof gradeDays)[number]["id"];

export const gradeSlots = [
  { id: "slot-1", start: "07:30", end: "09:30" },
  { id: "slot-2", start: "09:45", end: "11:45" },
  { id: "slot-3", start: "12:00", end: "14:00" },
  { id: "slot-4", start: "14:15", end: "16:15" },
  { id: "slot-5", start: "16:30", end: "18:30" },
] as const;

type GradeSlotId = (typeof gradeSlots)[number]["id"];
export type GradeSubjectCode = "LP" | "ML" | "AED" | "PSGA" | "SHS";

export interface GradeSession {
  day: GradeDayId;
  slot: GradeSlotId;
  kind: "class" | "office-hours";
  subjectCode: GradeSubjectCode;
  subject: string;
  start: string;
  end: string;
  instructor?: string;
}

export const gradeSubjects: Record<GradeSubjectCode, { name: string; color: string }> = {
  LP: { name: "Linguagens e Paradigmas", color: "var(--subject-lp)" },
  ML: { name: "Machine Learning", color: "var(--subject-ml)" },
  AED: { name: "Algoritmos e Estruturas de Dados", color: "var(--subject-aed)" },
  PSGA: { name: "Projeto de Software e Gestão Ágil", color: "var(--subject-psga)" },
  SHS: { name: "Sistemas Hardware-Software", color: "var(--subject-shs)" },
};

export const gradeSessions: GradeSession[] = [
  { day: "monday", slot: "slot-2", kind: "class", subjectCode: "ML", subject: gradeSubjects.ML.name, start: "09:45", end: "11:45", instructor: "Humberto Rodrigo Sandmann" },
  { day: "monday", slot: "slot-4", kind: "office-hours", subjectCode: "ML", subject: gradeSubjects.ML.name, start: "14:45", end: "16:15" },
  { day: "monday", slot: "slot-5", kind: "class", subjectCode: "PSGA", subject: gradeSubjects.PSGA.name, start: "16:30", end: "18:30", instructor: "Eduardo Felipe Zambom Santana" },
  { day: "tuesday", slot: "slot-1", kind: "class", subjectCode: "LP", subject: gradeSubjects.LP.name, start: "07:30", end: "09:30", instructor: "Raul Ikeda Gomes da Silva" },
  { day: "tuesday", slot: "slot-3", kind: "class", subjectCode: "AED", subject: gradeSubjects.AED.name, start: "12:00", end: "14:00", instructor: "Fábio José Ayres" },
  { day: "wednesday", slot: "slot-1", kind: "office-hours", subjectCode: "PSGA", subject: gradeSubjects.PSGA.name, start: "08:00", end: "09:30" },
  { day: "wednesday", slot: "slot-2", kind: "class", subjectCode: "PSGA", subject: gradeSubjects.PSGA.name, start: "09:45", end: "11:45", instructor: "Eduardo Felipe Zambom Santana" },
  { day: "wednesday", slot: "slot-4", kind: "office-hours", subjectCode: "SHS", subject: gradeSubjects.SHS.name, start: "14:45", end: "16:15" },
  { day: "wednesday", slot: "slot-5", kind: "class", subjectCode: "SHS", subject: gradeSubjects.SHS.name, start: "16:30", end: "18:30", instructor: "Carlos Eduardo Dantas de Menezes" },
  { day: "thursday", slot: "slot-1", kind: "class", subjectCode: "LP", subject: gradeSubjects.LP.name, start: "07:30", end: "09:30", instructor: "Raul Ikeda Gomes da Silva" },
  { day: "thursday", slot: "slot-2", kind: "office-hours", subjectCode: "LP", subject: gradeSubjects.LP.name, start: "09:45", end: "11:15" },
  { day: "thursday", slot: "slot-3", kind: "class", subjectCode: "AED", subject: gradeSubjects.AED.name, start: "12:00", end: "14:00", instructor: "Fábio José Ayres" },
  { day: "thursday", slot: "slot-4", kind: "office-hours", subjectCode: "AED", subject: gradeSubjects.AED.name, start: "14:30", end: "16:00" },
  { day: "friday", slot: "slot-2", kind: "class", subjectCode: "ML", subject: gradeSubjects.ML.name, start: "09:45", end: "11:45", instructor: "Humberto Rodrigo Sandmann" },
  { day: "friday", slot: "slot-4", kind: "class", subjectCode: "SHS", subject: gradeSubjects.SHS.name, start: "14:15", end: "16:15", instructor: "Carlos Eduardo Dantas de Menezes" },
];

export function getInitialGradeDay(date = new Date()): GradeDayId {
  const day = date.getDay();
  return day >= 1 && day <= 5 ? gradeDays[day - 1].id : "monday";
}

export function findGradeSession(day: GradeDayId, slot: GradeSlotId): GradeSession | undefined {
  return gradeSessions.find((session) => session.day === day && session.slot === slot);
}
