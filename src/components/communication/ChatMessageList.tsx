import React from "react";
import {
  MessageCircle,
  Loader2,
  Check,
  CheckCheck,
  FileText,
  Download,
} from "lucide-react";
import type { TeamMessage } from "@/types/communication";
import { formatMessageTime, formatMessageDateHeader } from "./types";

interface ChatMessageListProps {
  messages: TeamMessage[];
  isLoadingHistory: boolean;
  currentUserId?: string;
  currentUserName?: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoadingHistory,
  currentUserId,
  currentUserName,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
      {isLoadingHistory ? (
        <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400">
          <Loader2 className="animate-spin h-6 w-6 text-blue-500 mb-2" />
          Loading message history...
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <MessageCircle className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No messages yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Start the conversation by sending a message below.
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isMe =
            msg.senderId === currentUserId ||
            msg.isOptimistic ||
            Boolean(currentUserName && msg.senderName === currentUserName);

          const prevMsg = messages[index - 1];
          const showDateHeader =
            !prevMsg ||
            formatMessageDateHeader(prevMsg.createdAt) !==
            formatMessageDateHeader(msg.createdAt);

          const isRead = (msg.readBy && msg.readBy.length > 1) || false;

          return (
            <React.Fragment key={msg._id || index}>
              {showDateHeader && (
                <div className="flex justify-center my-3">
                  <span className="bg-slate-200/80 text-slate-600 text-[10px] font-semibold px-3 py-0.5 rounded-full shadow-2xs">
                    {formatMessageDateHeader(msg.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {msg.senderName}
                    </span>
                    {msg.senderRole && (
                      <span className="text-[10px] text-slate-400 capitalize">
                        • {msg.senderRole}
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs ${
                    isMe
                      ? "bg-[#2563EB] text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-gray-100 rounded-bl-xs"
                  }`}
                >
                  {/* Text Content */}
                  {msg.content && (
                    <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  )}

                  {/* Attachments List */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.attachments.map((att, attIdx) => {
                        const isImg = att.type?.startsWith("image/");
                        if (isImg) {
                          return (
                            <a
                              key={attIdx}
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden border border-black/10 max-w-60"
                            >
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-full h-auto max-h-48 object-cover hover:opacity-90 transition-opacity"
                              />
                            </a>
                          );
                        }

                        return (
                          <a
                            key={attIdx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-colors ${
                              isMe
                                ? "bg-blue-700/60 text-white hover:bg-blue-700/80"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            <FileText size={16} className="shrink-0" />
                            <span className="truncate flex-1 font-medium">
                              {att.name}
                            </span>
                            <Download size={14} className="shrink-0 opacity-70" />
                          </a>
                        );
                      })}
                    </div>
                  )}

                  {/* Message Footer: Timestamp & Read receipts */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    <span>{formatMessageTime(msg.createdAt)}</span>
                    {isMe && (
                      <span>
                        {msg.status === "pending" ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : isRead ? (
                          <CheckCheck size={13} className="text-white" />
                        ) : (
                          <Check size={13} className="text-blue-200" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
