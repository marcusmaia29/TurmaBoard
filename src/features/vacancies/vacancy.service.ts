import type { Vacancy } from "../../lib/database.types";
import { getSupabase } from "../../lib/supabase";

export async function fetchVacancies(): Promise<Vacancy[]> {
  const { data, error } = await getSupabase()
    .from("vacancies")
    .select("*")
    .eq("review_status", "approved")
    .eq("opening_status", "open")
    .order("application_deadline", { ascending: true, nullsFirst: false })
    .order("last_verified_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Vacancy[];
}
