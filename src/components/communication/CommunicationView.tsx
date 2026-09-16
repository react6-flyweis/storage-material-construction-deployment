import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useSocket } from "@/context/useSocket";
import {
  useChatUsersQuery,
  useChatConversationsQuery,
  useDirectMessagesQuery,
  useGroupMessagesQuery,
  useGroupDetailsQuery,
  chatQueryKeys,
} from "@/modules/team-chat/team-chat.hooks";
import { uploadFileToS3 } from "@/lib/upload";
import type {
  TeamMessage,
  TeamAttachment,
  TeamTypingEvent,
  TeamMessagesReadEvent,
} from "@/types/communication";

import { type ActiveChatState } from "./types";
import { ChatSidebar } from "./ChatSidebar";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import { ChatDrawer } from "./ChatDrawer";
import { ChatEmptyState } from "./ChatEmptyState";
import { NewChatModal } from "./NewChatModal";

export const CommunicationView: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const {
    socket,
    isConnected,
    joinChannel,
    leaveChannel,
    sendTypingStart,
    sendTypingStop,
    sendMessage,
  } = useSocket();

  const [activeTab, setActiveTab] = useState<"Groups" | "Direct">("Groups");
  const [activeChat, setActiveChat] = useState<ActiveChatState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"Members" | "Files">("Members");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // File upload state
  const [pendingAttachments, setPendingAttachments] = useState<TeamAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Real-time local message list & typing users map
  const [liveMessages, setLiveMessages] = useState<TeamMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { isTyping: boolean; name: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queries
  const { data: usersData, isLoading: isLoadingUsers } = useChatUsersQuery();
  const { data: conversationsData, isLoading: isLoadingConversations } = useChatConversationsQuery();

  // Active chat message history queries
  const isDirectActive = activeChat?.type === "direct" && Boolean(activeChat.id);
  const isGroupActive = activeChat?.type === "group" && Boolean(activeChat.id);

  const {
    data: directHistoryData,
    isLoading: isLoadingDirectHistory,
  } = useDirectMessagesQuery(activeChat?.id || "", {
    page: 1,
    limit: 50,
    enabled: isDirectActive,
  });

  const {
    data: groupHistoryData,
    isLoading: isLoadingGroupHistory,
  } = useGroupMessagesQuery(activeChat?.id || "", {
    page: 1,
    limit: 50,
    enabled: isGroupActive,
  });

  const {
    data: groupDetails,
    isLoading: isLoadingGroupDetails,
  } = useGroupDetailsQuery(activeChat?.id || "", isGroupActive);

  // Merge historical messages with live socket messages
  const displayedMessages = useMemo(() => {
    const history = isDirectActive
      ? directHistoryData?.messages || []
      : isGroupActive
      ? groupHistoryData?.messages || []
      : [];

    const map = new Map<string, TeamMessage>();
    history.forEach((m) => map.set(m._id, m));
    liveMessages.forEach((m) => {
      // replace optimistic or append
      const existingTempKey = Array.from(map.keys()).find(
        (k) =>
          k.startsWith("temp-") &&
          map.get(k)?.content === m.content &&
          map.get(k)?.senderId === m.senderId
      );
      if (existingTempKey) {
        map.delete(existingTempKey);
      }
      map.set(m._id, m);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [isDirectActive, isGroupActive, directHistoryData, groupHistoryData, liveMessages]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [activeChat?.id]);

  useEffect(() => {
    scrollToBottom("smooth");
  }, [displayedMessages]);

  // Join / Leave channel lifecycle
  useEffect(() => {
    if (!activeChat) return;

    joinChannel(activeChat.type, activeChat.id);

    return () => {
      leaveChannel(activeChat.type, activeChat.id);
    };
  }, [activeChat, joinChannel, leaveChannel]);

  // Listen to live socket events for current chat
  useEffect(() => {
    if (!socket || !activeChat) return;

    // 1. new_team_message
    const handleNewMessage = (msg: TeamMessage) => {
      console.log("[CommunicationView] new_team_message:", msg);

      const isCurrentGroup =
        activeChat.type === "group" &&
        msg.channelType === "group" &&
        msg.groupId === activeChat.id;

      const isCurrentDirect =
        activeChat.type === "direct" &&
        msg.channelType === "direct" &&
        (msg.senderId === activeChat.id ||
          (msg.senderId === currentUser?._id && msg.participants?.includes(activeChat.id)));

      if (isCurrentGroup || isCurrentDirect) {
        setLiveMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          if (exists) return prev;

          const filtered = prev.filter(
            (m) =>
              !(
                m.isOptimistic &&
                m.content === msg.content &&
                m.senderId === msg.senderId
              )
          );
          return [...filtered, msg];
        });
      }

      // Invalidate conversations and unread count
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: chatQueryKeys.unreadCount() });
    };

    // 2. team_typing
    const handleTyping = (data: TeamTypingEvent) => {
      console.log("[CommunicationView] team_typing:", data);
      if (
        data.channelType === activeChat.type &&
        data.channelId === activeChat.id &&
        data.userId !== currentUser?._id
      ) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return { ...prev, [data.name]: { isTyping: true, name: data.name } };
          }
          const next = { ...prev };
          delete next[data.name];
          return next;
        });
      }
    };

    // 3. team_messages_read
    const handleMessagesRead = (data: TeamMessagesReadEvent) => {
      console.log("[CommunicationView] team_messages_read:", data);
      if (
        data.channelType === activeChat.type &&
        data.channelId === activeChat.id
      ) {
        setLiveMessages((prev) =>
          prev.map((msg) => {
            if (!msg.readBy?.includes(data.by)) {
              return { ...msg, readBy: [...(msg.readBy || []), data.by] };
            }
            return msg;
          })
        );
      }
    };

    // 4. team_chat_error
    const handleChatError = (data: { message: string }) => {
      console.error("[CommunicationView] team_chat_error:", data);
      setErrorBanner(data.message || "Failed to deliver message");
    };

    socket.on("new_team_message", handleNewMessage);
    socket.on("team_typing", handleTyping);
    socket.on("team_messages_read", handleMessagesRead);
    socket.on("team_chat_error", handleChatError);

    return () => {
      socket.off("new_team_message", handleNewMessage);
      socket.off("team_typing", handleTyping);
      socket.off("team_messages_read", handleMessagesRead);
      socket.off("team_chat_error", handleChatError);
    };
  }, [socket, activeChat, currentUser, queryClient]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageInput(val);

    if (!activeChat) return;

    sendTypingStart(activeChat.type, activeChat.id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(activeChat.type, activeChat.id);
    }, 2500);
  };

  // Handle file uploads to presigned S3
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (pendingAttachments.length + files.length > 10) {
      setErrorBanner("Maximum 10 attachments allowed per message");
      return;
    }

    setIsUploading(true);
    setErrorBanner(null);

    try {
      const uploaded: TeamAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileUrl = await uploadFileToS3(file, "chat-attachments");

        uploaded.push({
          url: fileUrl,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
        });
      }

      setPendingAttachments((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to upload file attachment";
      console.error("[CommunicationView] File upload error:", err);
      setErrorBanner(message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeChat) return;

    const trimmed = messageInput.trim();
    if (!trimmed && pendingAttachments.length === 0) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingStop(activeChat.type, activeChat.id);

    // Optimistic UI message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: TeamMessage = {
      _id: tempId,
      channelType: activeChat.type,
      groupId: activeChat.type === "group" ? activeChat.id : undefined,
      senderId: currentUser?._id || "me",
      senderName: currentUser?.name || "You",
      senderRole: currentUser?.role,
      content: trimmed,
      attachments: [...pendingAttachments],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      status: "pending",
    };

    setLiveMessages((prev) => [...prev, optimisticMsg]);

    // Emit over socket
    sendMessage({
      channelType: activeChat.type,
      channelId: activeChat.id,
      content: trimmed,
      attachments: pendingAttachments.length > 0 ? pendingAttachments : undefined,
    });

    setMessageInput("");
    setPendingAttachments([]);
  };

  // Active typing list string
  const typingText = useMemo(() => {
    const names = Object.keys(typingUsers);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    return `${names.slice(0, 2).join(", ")} and others are typing...`;
  }, [typingUsers]);

  // Extract shared files from messages for the Files drawer
  const sharedFiles = useMemo(() => {
    const files: TeamAttachment[] = [];
    displayedMessages.forEach((msg) => {
      if (msg.attachments && msg.attachments.length > 0) {
        files.push(...msg.attachments);
      }
    });
    return files;
  }, [displayedMessages]);

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 1. Left Contact Sidebar */}
      <ChatSidebar
        currentUser={currentUser}
        isConnected={isConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeChat={activeChat}
        onSelectChat={(chat) => {
          setActiveChat(chat);
          setLiveMessages([]);
          setTypingUsers({});
          setErrorBanner(null);
          setIsDrawerOpen(false);
        }}
        conversations={conversationsData || []}
        isLoadingConversations={isLoadingConversations}
        onOpenNewChat={() => setIsNewChatModalOpen(true)}
        isMobileChatActive={Boolean(activeChat)}
      />

      {/* 2. Right Chat Main Area */}
      <div
        className={`${
          activeChat ? "flex" : "hidden md:flex"
        } flex-1 flex-col bg-[#F8FAFC] relative min-w-0`}
      >
        {activeChat ? (
          <>
            <ChatHeader
              activeChat={activeChat}
              typingText={typingText}
              errorBanner={errorBanner}
              setErrorBanner={setErrorBanner}
              isDrawerOpen={isDrawerOpen}
              setIsDrawerOpen={setIsDrawerOpen}
              onBackClick={() => setActiveChat(null)}
            />

            <ChatMessageList
              messages={displayedMessages}
              isLoadingHistory={isLoadingDirectHistory || isLoadingGroupHistory}
              currentUserId={currentUser?._id}
              currentUserName={currentUser?.name}
              messagesEndRef={messagesEndRef}
            />

            <ChatInputBar
              chatName={activeChat.name}
              messageInput={messageInput}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              pendingAttachments={pendingAttachments}
              onRemoveAttachment={removePendingAttachment}
              onFileSelect={handleFileSelect}
              isUploading={isUploading}
            />
          </>
        ) : (
          <ChatEmptyState />
        )}
      </div>

      {/* 3. Right Sidebar Details Drawer */}
      {activeChat && (
        <ChatDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          activeChat={activeChat}
          drawerTab={drawerTab}
          setDrawerTab={setDrawerTab}
          groupDetails={groupDetails}
          isLoadingGroupDetails={isLoadingGroupDetails}
          sharedFiles={sharedFiles}
          currentUserRole={currentUser?.role}
          currentUserId={currentUser?._id}
          allUsers={usersData || []}
        />
      )}

      {/* 4. New Direct Chat Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        users={usersData || []}
        isLoadingUsers={isLoadingUsers}
        onSelectUser={(chat) => {
          setActiveChat(chat);
          setActiveTab("Direct");
          setLiveMessages([]);
          setTypingUsers({});
          setErrorBanner(null);
          setIsDrawerOpen(false);
        }}
        currentUserId={currentUser?._id}
      />
    </div>
  );
};

export default CommunicationView;
