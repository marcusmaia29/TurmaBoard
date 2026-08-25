import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";

export function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("turmaboard-live-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["deliveries"] });
        void queryClient.invalidateQueries({ queryKey: ["history"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subjects" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["subjects"] });
        void queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subject_links" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["subjects"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["history"] });
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
