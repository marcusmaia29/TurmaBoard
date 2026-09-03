import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { RealtimeContext, type RealtimeStatus } from "./realtime.context";

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>(supabase ? "connecting" : "disabled");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    const channel = client
      .channel(`turmaboard-live-data-${retryCount}`)
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
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_notes" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["lesson-notes"] });
        void queryClient.invalidateQueries({ queryKey: ["history"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lesson_note_images" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["lesson-notes"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "audit_log" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["history"] });
      })
      .subscribe((nextStatus) => {
        if (!active) return;
        if (nextStatus === "SUBSCRIBED") setStatus("connected");
        else if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT" || nextStatus === "CLOSED") setStatus("disconnected");
      });

    function handleOffline() {
      setStatus("disconnected");
    }
    function handleOnline() {
      setStatus("connecting");
      setRetryCount((value) => value + 1);
    }
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      active = false;
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      void client.removeChannel(channel);
    };
  }, [queryClient, retryCount]);

  const value = useMemo(() => ({
    status,
    retry: () => {
      setStatus("connecting");
      setRetryCount((count) => count + 1);
    },
  }), [status]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
