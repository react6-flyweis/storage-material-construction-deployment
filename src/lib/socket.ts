import { io, type Socket } from "socket.io-client";

export function getSocketBaseUrl(): string {
  const socketUrl = import.meta.env.VITE_SOCKET_URL;
  if (socketUrl) return socketUrl.replace(/\/$/, "");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  return apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

export function createAdminSocket(
  accessToken: string | null | undefined,
  transports: string[] = ["polling"],
  namespace = "/admin"
): Socket | null {
  if (!accessToken) return null;

  const base = getSocketBaseUrl();
  return io(`${base}${namespace}`, {
    auth: { token: accessToken },
    transports,
  });
}

export type { Socket };
