import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { refreshApi } from "@/api/auth.api";
import { createAdminSocket, type Socket } from "@/lib/socket";
import type {
  SendTeamMessagePayload,
  TeamDmNotice,
  TeamGroupNotice,
  GroupMembersUpdatedEvent,
} from "@/types/communication";
import { chatQueryKeys } from "@/modules/team-chat/team-chat.hooks";
import type { ChatGroupDetails } from "@/api/teamChat.api";
import { SocketContext } from "./socketContextInstance";

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setToken = useAuthStore((state) => state.setToken);
  const logout = useAuthStore((state) => state.logout);

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const sock = createAdminSocket(token, ["websocket", "polling"]);
    if (!sock) return;

    socketRef.current = sock;

    sock.on("connect", () => {
      console.log("[SocketContext] Connected to /admin namespace");
      setSocket(sock);
      setIsConnected(true);
    });

    sock.on("disconnect", (reason) => {
      console.log("[SocketContext] Disconnected from /admin:", reason);
      setIsConnected(false);
    });

    sock.on("connect_error", async (err) => {
      console.warn("[SocketContext] connect_error:", err.message);
      setIsConnected(false);

      const isAuthError =
        err.message?.includes("Authentication required") ||
        err.message?.includes("Invalid token");

      if (isAuthError && refreshToken && !isRefreshingRef.current) {
        isRefreshingRef.current = true;
        try {
          console.log("[SocketContext] Refreshing token on connect_error...");
          const res = await refreshApi(refreshToken);
          const newToken = res.data?.data?.accessToken;
          if (newToken) {
            setToken(newToken);
            sock.auth = { token: newToken };
            sock.connect();
          } else {
            logout();
          }
        } catch (refreshErr) {
          console.error("[SocketContext] Token refresh failed:", refreshErr);
          logout();
        } finally {
          isRefreshingRef.current = false;
        }
      }
    });

    // 1. Direct Message Notice (personal room user:{userId})
    sock.on("new_team_dm_notice", (data: TeamDmNotice) => {
      console.log("[SocketContext] new_team_dm_notice", data);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      window.dispatchEvent(new CustomEvent("socket_team_dm_notice", { detail: data }));
    });

    // 2. Group Message Notice (personal room user:{userId})
    sock.on("new_team_group_message_notice", (data: TeamGroupNotice) => {
      console.log("[SocketContext] new_team_group_message_notice", data);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      window.dispatchEvent(new CustomEvent("socket_team_group_notice", { detail: data }));
    });

    // 3. New Group Created / Added
    sock.on("new_team_group", (data: { group: ChatGroupDetails }) => {
      console.log("[SocketContext] new_team_group", data);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount() });
      window.dispatchEvent(new CustomEvent("socket_new_team_group", { detail: data }));
    });

    // 4. Group Members Updated
    sock.on("group_members_updated", (data: GroupMembersUpdatedEvent) => {
      console.log("[SocketContext] group_members_updated", data);
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      if (data?.groupId) {
        queryClient.invalidateQueries({ queryKey: chatQueryKeys.groupDetails(data.groupId) });
      }
      window.dispatchEvent(new CustomEvent("socket_group_members_updated", { detail: data }));
    });

    // 5. Team Chat Error
    sock.on("team_chat_error", (data: { message: string }) => {
      console.error("[SocketContext] team_chat_error:", data);
      if (data?.message) {
        toast.error(data.message);
      }
    });

    return () => {
      sock.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, refreshToken, queryClient, setToken, logout]);

  const joinChannel = useCallback((channelType: "direct" | "group", channelId: string) => {
    if (socketRef.current?.connected) {
      console.log(`[SocketContext] emit join_team_channel: ${channelType} -> ${channelId}`);
      socketRef.current.emit("join_team_channel", { channelType, channelId });
    }
  }, []);

  const leaveChannel = useCallback((channelType: "direct" | "group", channelId: string) => {
    if (socketRef.current?.connected) {
      console.log(`[SocketContext] emit leave_team_channel: ${channelType} -> ${channelId}`);
      socketRef.current.emit("leave_team_channel", { channelType, channelId });
    }
  }, []);

  const sendTypingStart = useCallback((channelType: "direct" | "group", channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("team_typing_start", { channelType, channelId });
    }
  }, []);

  const sendTypingStop = useCallback((channelType: "direct" | "group", channelId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("team_typing_stop", { channelType, channelId });
    }
  }, []);

  const sendMessage = useCallback((payload: SendTeamMessagePayload) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("team_message", payload);
    } else {
      console.warn("[SocketContext] cannot sendMessage: socket is not connected");
      toast.error("Socket disconnected. Trying to reconnect...");
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinChannel,
        leaveChannel,
        sendTypingStart,
        sendTypingStop,
        sendMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
