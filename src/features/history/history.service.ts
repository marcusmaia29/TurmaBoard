import type { AuditEntry } from "../../lib/database.types";
import { getSupabase } from "../../lib/supabase";

export const HISTORY_PAGE_SIZE = 50;

export async function fetchHistory(page: number): Promise<{ entries: AuditEntry[]; hasNextPage: boolean }> {
  const start = page * HISTORY_PAGE_SIZE;
  const end = start + HISTORY_PAGE_SIZE;
  const { data, error } = await getSupabase()
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(start, end);
  if (error) throw error;
  return { entries: data.slice(0, HISTORY_PAGE_SIZE), hasNextPage: data.length > HISTORY_PAGE_SIZE };
}
