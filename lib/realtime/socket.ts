import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth/token";

let socket: Pick<Socket, "on" | "off" | "emit"> | null = null;

export function getSocket(): Pick<Socket, "on" | "off" | "emit"> {
  if (socket) return socket;
  const url = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (!url) {
    // Phase 1 has no real backend — expose a no-op socket so callers
    // never need to branch on whether realtime is "really" connected.
    socket = { on: () => {}, off: () => {}, emit: () => {} } as unknown as Pick<
      Socket,
      "on" | "off" | "emit"
    >;
    return socket;
  }
  socket = io(url, { auth: { token: getToken() } });
  return socket;
}

export function __setSocketForTesting(stub: Pick<Socket, "on" | "off" | "emit">) {
  socket = stub;
}
