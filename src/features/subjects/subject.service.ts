import type { Database, SubjectWithLinks } from "../../lib/database.types";
import { getSupabase } from "../../lib/supabase";

export type SubjectInput = Pick<
  Database["public"]["Tables"]["subjects"]["Insert"],
  "name" | "code" | "color" | "notes" | "official_url" | "platform_url" | "repository_url"
>;

async function querySubjects(includeArchived: boolean): Promise<SubjectWithLinks[]> {
  let query = getSupabase()
    .from("subjects")
    .select("*, subject_links(*)")
    .order("position")
    .order("position", { referencedTable: "subject_links" });
  if (!includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return data as SubjectWithLinks[];
}

export function fetchSubjects(): Promise<SubjectWithLinks[]> {
  return querySubjects(false);
}

export function fetchAdminSubjects(): Promise<SubjectWithLinks[]> {
  return querySubjects(true);
}

export async function createSubject(input: SubjectInput, position: number): Promise<void> {
  const { error } = await getSupabase().from("subjects").insert({ ...input, position });
  if (error) throw error;
}

export async function updateSubject(id: string, input: SubjectInput): Promise<void> {
  const { error } = await getSupabase().from("subjects").update(input).eq("id", id);
  if (error) throw error;
}

export async function archiveSubject(id: string): Promise<void> {
  const { error } = await getSupabase().from("subjects").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function restoreSubject(id: string, position: number): Promise<void> {
  const { error } = await getSupabase().from("subjects").update({ archived_at: null, position }).eq("id", id);
  if (error) throw error;
}

export async function reorderSubjects(subjectIds: string[]): Promise<void> {
  const { error } = await getSupabase().rpc("reorder_subjects", { subject_ids: subjectIds });
  if (error) throw error;
}

export async function createSubjectLink(subjectId: string, label: string, url: string, position: number): Promise<void> {
  const { error } = await getSupabase().from("subject_links").insert({ subject_id: subjectId, label, url, position });
  if (error) throw error;
}

export async function deleteSubjectLink(id: string): Promise<void> {
  const { error } = await getSupabase().from("subject_links").delete().eq("id", id);
  if (error) throw error;
}
