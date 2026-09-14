import { useEffect } from "react";
import { getSocket } from "./socket";
import type { RealtimeEventMap } from "./events";

export function useRealtimeEvent<K extends keyof RealtimeEventMap>(
  event: K,
  handler: (payload: RealtimeEventMap[K]) => void
) {
  useEffect(() => {
    const socket = getSocket();
    const listener = (payload: RealtimeEventMap[K]) => handler(payload);
    socket.on(event, listener as any);
    return () => {
      socket.off(event, listener as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
}
