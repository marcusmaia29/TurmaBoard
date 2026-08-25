import { getSupabase } from "../../lib/supabase";
import type { Database, DeliveryWithSubject } from "../../lib/database.types";

export type DeliveryInput = Pick<
  Database["public"]["Tables"]["deliveries"]["Insert"],
  "subject_id" | "title" | "type" | "description" | "due_at" | "source_url" | "status"
>;

export async function fetchDeliveries(startIso: string, endIso: string): Promise<DeliveryWithSubject[]> {
  const { data, error } = await getSupabase()
    .from("deliveries")
    .select("*, subject:subjects(*)")
    .gte("due_at", startIso)
    .lt("due_at", endIso)
    .is("deleted_at", null)
    .order("due_at", { ascending: true });
  if (error) throw error;
  return data as DeliveryWithSubject[];
}

export async function createDelivery(input: DeliveryInput, userId: string): Promise<void> {
  const { error } = await getSupabase().from("deliveries").insert({ ...input, created_by: userId, updated_by: userId });
  if (error) throw error;
}

export async function updateDelivery(id: string, input: DeliveryInput, userId: string): Promise<void> {
  const { error } = await getSupabase().from("deliveries").update({ ...input, updated_by: userId }).eq("id", id);
  if (error) throw error;
}

export async function softDeleteDelivery(id: string, userId: string): Promise<void> {
  const { error } = await getSupabase().from("deliveries").update({ deleted_at: new Date().toISOString(), updated_by: userId }).eq("id", id);
  if (error) throw error;
}
