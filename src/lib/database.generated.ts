// Generated from the local Supabase schema. Do not edit manually.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: { action: Database["public"]["Enums"]["audit_action"]; actor_id: string | null; actor_name: string; after_state: Json | null; before_state: Json | null; created_at: string; entity_id: string; entity_type: string; id: number; summary: string };
        Insert: { action: Database["public"]["Enums"]["audit_action"]; actor_id?: string | null; actor_name?: string; after_state?: Json | null; before_state?: Json | null; created_at?: string; entity_id: string; entity_type: string; id?: never; summary: string };
        Update: { action?: Database["public"]["Enums"]["audit_action"]; actor_id?: string | null; actor_name?: string; after_state?: Json | null; before_state?: Json | null; created_at?: string; entity_id?: string; entity_type?: string; id?: never; summary?: string };
        Relationships: [{ foreignKeyName: "audit_log_actor_id_fkey"; columns: ["actor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }];
      };
      deliveries: {
        Row: { created_at: string; created_by: string | null; deleted_at: string | null; description: string; due_at: string; id: string; source_url: string | null; status: Database["public"]["Enums"]["delivery_status"]; subject_id: string; title: string; type: Database["public"]["Enums"]["delivery_type"]; updated_at: string; updated_by: string | null };
        Insert: { created_at?: string; created_by?: string | null; deleted_at?: string | null; description?: string; due_at: string; id?: string; source_url?: string | null; status?: Database["public"]["Enums"]["delivery_status"]; subject_id: string; title: string; type: Database["public"]["Enums"]["delivery_type"]; updated_at?: string; updated_by?: string | null };
        Update: { created_at?: string; created_by?: string | null; deleted_at?: string | null; description?: string; due_at?: string; id?: string; source_url?: string | null; status?: Database["public"]["Enums"]["delivery_status"]; subject_id?: string; title?: string; type?: Database["public"]["Enums"]["delivery_type"]; updated_at?: string; updated_by?: string | null };
        Relationships: [
          { foreignKeyName: "deliveries_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "deliveries_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] },
          { foreignKeyName: "deliveries_updated_by_fkey"; columns: ["updated_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: { created_at: string; display_name: string; id: string; role: Database["public"]["Enums"]["user_role"]; updated_at: string };
        Insert: { created_at?: string; display_name?: string; id: string; role?: Database["public"]["Enums"]["user_role"]; updated_at?: string };
        Update: { created_at?: string; display_name?: string; id?: string; role?: Database["public"]["Enums"]["user_role"]; updated_at?: string };
        Relationships: [];
      };
      subject_links: {
        Row: { created_at: string; id: string; label: string; position: number; subject_id: string; updated_at: string; url: string };
        Insert: { created_at?: string; id?: string; label: string; position?: number; subject_id: string; updated_at?: string; url: string };
        Update: { created_at?: string; id?: string; label?: string; position?: number; subject_id?: string; updated_at?: string; url?: string };
        Relationships: [{ foreignKeyName: "subject_links_subject_id_fkey"; columns: ["subject_id"]; isOneToOne: false; referencedRelation: "subjects"; referencedColumns: ["id"] }];
      };
      subjects: {
        Row: { code: string; color: string; created_at: string; id: string; name: string; notes: string; official_url: string | null; platform_url: string | null; position: number; repository_url: string | null; updated_at: string };
        Insert: { code: string; color: string; created_at?: string; id?: string; name: string; notes?: string; official_url?: string | null; platform_url?: string | null; position?: number; repository_url?: string | null; updated_at?: string };
        Update: { code?: string; color?: string; created_at?: string; id?: string; name?: string; notes?: string; official_url?: string | null; platform_url?: string | null; position?: number; repository_url?: string | null; updated_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { is_admin: { Args: never; Returns: boolean } };
    Enums: {
      audit_action: "created" | "updated" | "deleted";
      delivery_status: "active" | "cancelled";
      delivery_type: "quiz" | "exam" | "aps" | "project" | "activity" | "notice";
      user_role: "admin";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
