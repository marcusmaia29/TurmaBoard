import type { Database, SubjectWithLinks } from "../../lib/database.types";
import { getSupabase } from "../../lib/supabase";

export type SubjectInput = Pick<
  Database["public"]["Tables"]["subjects"]["Update"],
  "name" | "code" | "color" | "notes" | "official_url" | "platform_url" | "repository_url"
>;

export async function fetchSubjects(): Promise<SubjectWithLinks[]> {
  const { data, error } = await getSupabase()
    .from("subjects")
    .select("*, subject_links(*)")
    .order("position")
    .order("position", { referencedTable: "subject_links" });
  if (error) throw error;
  return data as SubjectWithLinks[];
}

export async function updateSubject(id: string, input: SubjectInput): Promise<void> {
  const { error } = await getSupabase().from("subjects").update(input).eq("id", id);
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
