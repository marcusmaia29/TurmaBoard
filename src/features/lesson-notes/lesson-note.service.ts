import { getSupabase } from "../../lib/supabase";
import type { Database, LessonNoteImage, LessonNoteWithSubjectAndImages } from "../../lib/database.types";

export const LESSON_NOTE_BUCKET = "lesson-note-images";
export const MAX_NOTE_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type LessonNoteInput = Pick<
  Database["public"]["Tables"]["lesson_notes"]["Insert"],
  "subject_id" | "title" | "occurred_at" | "content_format" | "content"
>;

export interface LessonNoteFilters {
  start?: string;
  end?: string;
  subjectId?: string;
  order?: "asc" | "desc";
}

function sortImages(note: LessonNoteWithSubjectAndImages): LessonNoteWithSubjectAndImages {
  return { ...note, images: [...note.images].sort((a, b) => a.position - b.position) };
}

export async function fetchLessonNotes(filters: LessonNoteFilters = {}): Promise<LessonNoteWithSubjectAndImages[]> {
  let query = getSupabase()
    .from("lesson_notes")
    .select("*, subject:subjects!inner(*), images:lesson_note_images(*)")
    .is("deleted_at", null)
    .is("subject.archived_at", null)
    .order("occurred_at", { ascending: (filters.order ?? "desc") === "asc" });
  if (filters.start) query = query.gte("occurred_at", filters.start);
  if (filters.end) query = query.lt("occurred_at", filters.end);
  if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
  const { data, error } = await query;
  if (error) throw error;
  return (data as LessonNoteWithSubjectAndImages[]).map(sortImages);
}

export async function fetchLessonNote(id: string): Promise<LessonNoteWithSubjectAndImages> {
  const { data, error } = await getSupabase()
    .from("lesson_notes")
    .select("*, subject:subjects!inner(*), images:lesson_note_images(*)")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  return sortImages(data as LessonNoteWithSubjectAndImages);
}

export async function createLessonNote(input: LessonNoteInput): Promise<string> {
  const { data, error } = await getSupabase().from("lesson_notes").insert(input).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function updateLessonNote(id: string, input: LessonNoteInput): Promise<void> {
  const { error } = await getSupabase().from("lesson_notes").update(input).eq("id", id);
  if (error) throw error;
}

export async function softDeleteLessonNote(note: LessonNoteWithSubjectAndImages): Promise<void> {
  const { error } = await getSupabase().from("lesson_notes").update({ deleted_at: new Date().toISOString() }).eq("id", note.id);
  if (error) throw error;
  if (note.images.length) {
    const paths = note.images.map((image) => image.storage_path);
    const { error: storageError } = await getSupabase().storage.from(LESSON_NOTE_BUCKET).remove(paths);
    if (storageError) {
      console.error("Anotação removida, mas a limpeza das imagens falhou", storageError);
      throw new Error("A anotação foi removida, mas algumas imagens não foram limpas. Tente novamente.", { cause: storageError });
    }
  }
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) return "Use uma imagem JPEG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_BYTES) return "Cada imagem pode ter no máximo 5 MB.";
  return null;
}

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Não foi possível ler as dimensões da imagem."));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadLessonNoteImage(
  noteId: string,
  file: File,
  metadata: { altText: string; caption: string; position: number },
): Promise<void> {
  const validation = validateImageFile(file);
  if (validation) throw new Error(validation);
  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const storagePath = `${noteId}/${crypto.randomUUID()}.${extension}`;
  const dimensions = await readImageDimensions(file);
  const storage = getSupabase().storage.from(LESSON_NOTE_BUCKET);
  const { error: uploadError } = await storage.upload(storagePath, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message.includes("Bucket not found") ? "O armazenamento de imagens ainda não foi configurado." : uploadError.message);

  const { error: metadataError } = await getSupabase().from("lesson_note_images").insert({
    lesson_note_id: noteId,
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    width: dimensions.width,
    height: dimensions.height,
    alt_text: metadata.altText.trim(),
    caption: metadata.caption.trim() || null,
    position: metadata.position,
  });
  if (metadataError) {
    const { error: cleanupError } = await storage.remove([storagePath]);
    if (cleanupError) console.error("Falha ao compensar upload sem metadados", cleanupError);
    throw metadataError;
  }
}

export async function updateLessonNoteImages(images: LessonNoteImage[]): Promise<void> {
  const updates = images.map((image, position) => getSupabase()
    .from("lesson_note_images")
    .update({ alt_text: image.alt_text.trim(), caption: image.caption?.trim() || null, position })
    .eq("id", image.id));
  const results = await Promise.all(updates);
  const failure = results.find((result) => result.error)?.error;
  if (failure) throw failure;
}

export async function deleteLessonNoteImage(image: LessonNoteImage): Promise<void> {
  const { error: metadataError } = await getSupabase().from("lesson_note_images").delete().eq("id", image.id);
  if (metadataError) throw metadataError;
  const { error: storageError } = await getSupabase().storage.from(LESSON_NOTE_BUCKET).remove([image.storage_path]);
  if (storageError) {
    console.error("Metadados removidos, mas a limpeza do arquivo falhou", storageError);
    throw new Error("Os metadados foram removidos, mas o arquivo não foi limpo. Tente novamente.", { cause: storageError });
  }
}

export function getLessonNoteImageUrl(path: string): string {
  return getSupabase().storage.from(LESSON_NOTE_BUCKET).getPublicUrl(path).data.publicUrl;
}
