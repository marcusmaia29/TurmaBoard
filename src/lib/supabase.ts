import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return supabase;
}
