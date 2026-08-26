import { createContext, useContext } from "react";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "disconnected";

export const RealtimeContext = createContext<{ status: RealtimeStatus; retry: () => void }>({
  status: "disabled",
  retry: () => undefined,
});

export function useRealtimeStatus() {
  return useContext(RealtimeContext);
}
