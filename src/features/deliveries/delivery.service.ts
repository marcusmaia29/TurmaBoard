import { getSupabase } from "../../lib/supabase";
import type { Database, DeliveryWithSubject } from "../../lib/database.types";

export type DeliveryInput = Pick<
  Database["public"]["Tables"]["deliveries"]["Insert"],
  "subject_id" | "title" | "type" | "description" | "due_at" | "source_url" | "status"
>;

export async function fetchDeliveries(startIso: string, endIso: string): Promise<DeliveryWithSubject[]> {
  const { data, error } = await getSupabase()
    .from("deliveries")
    .select("*, subject:subjects!inner(*)")
    .gte("due_at", startIso)
    .lt("due_at", endIso)
    .is("deleted_at", null)
    .is("subject.archived_at", null)
    .order("due_at", { ascending: true });
  if (error) throw error;
  return data as DeliveryWithSubject[];
}

export async function createDelivery(input: DeliveryInput): Promise<void> {
  const { error } = await getSupabase().from("deliveries").insert(input);
  if (error) throw error;
}

export async function updateDelivery(id: string, input: DeliveryInput): Promise<void> {
  const { error } = await getSupabase().from("deliveries").update(input).eq("id", id);
  if (error) throw error;
}

export async function softDeleteDelivery(id: string): Promise<void> {
  const { error } = await getSupabase().from("deliveries").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
