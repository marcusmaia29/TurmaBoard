import type { Database } from "./database.generated";

export type { Database, Json } from "./database.generated";

export type DeliveryType = Database["public"]["Enums"]["delivery_type"];
export type DeliveryStatus = Database["public"]["Enums"]["delivery_status"];
export type AuditAction = Database["public"]["Enums"]["audit_action"];
export type UserRole = Database["public"]["Enums"]["user_role"];
export type LessonNoteFormat = Database["public"]["Enums"]["lesson_note_format"];

export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type SubjectLink = Database["public"]["Tables"]["subject_links"]["Row"];
export type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];
export type AuditEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type LessonNote = Database["public"]["Tables"]["lesson_notes"]["Row"];
export type LessonNoteImage = Database["public"]["Tables"]["lesson_note_images"]["Row"];

export type DeliveryWithSubject = Delivery & { subject: Subject };
export type SubjectWithLinks = Subject & { subject_links: SubjectLink[] };
export type LessonNoteWithSubjectAndImages = LessonNote & { subject: Subject; images: LessonNoteImage[] };

export type AcademicCalendarItem =
  | { kind: "delivery"; data: DeliveryWithSubject }
  | { kind: "lesson-note"; data: LessonNoteWithSubjectAndImages };
