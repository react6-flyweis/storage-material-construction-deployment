import React, { useRef } from "react";
import { Paperclip, Loader2, Send, X, Image as ImageIcon, FileText } from "lucide-react";
import type { TeamAttachment } from "@/types/communication";

interface ChatInputBarProps {
  chatName: string;
  messageInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e?: React.FormEvent) => void;
  pendingAttachments: TeamAttachment[];
  onRemoveAttachment: (index: number) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  chatName,
  messageInput,
  onInputChange,
  onSendMessage,
  pendingAttachments,
  onRemoveAttachment,
  onFileSelect,
  isUploading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        multiple
        className="hidden"
      />

      {/* Pending File Attachments Preview Bar */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2 items-center">
          {pendingAttachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-700 shadow-2xs"
            >
              {att.type?.startsWith("image/") ? (
                <ImageIcon size={14} className="text-blue-500" />
              ) : (
                <FileText size={14} className="text-emerald-500" />
              )}
              <span className="max-w-40 truncate">{att.name}</span>
              <button
                type="button"
                onClick={() => onRemoveAttachment(idx)}
                className="text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat Footer / Input Form */}
      <div className="p-3 lg:p-4 bg-white border-t border-gray-200 mt-auto">
        <form onSubmit={onSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Attach file or image"
          >
            {isUploading ? (
              <Loader2 size={18} className="animate-spin text-blue-500" />
            ) : (
              <Paperclip size={18} />
            )}
          </button>

          <div className="flex-1">
            <input
              type="text"
              value={messageInput}
              onChange={onInputChange}
              placeholder={`Message ${chatName}...`}
              className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4] focus:bg-white text-sm placeholder:text-gray-400 shadow-2xs h-11"
            />
          </div>

          <button
            type="submit"
            disabled={
              isUploading ||
              (!messageInput.trim() && pendingAttachments.length === 0)
            }
            className="h-11 px-5 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white cursor-pointer font-medium text-sm transition-colors"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </>
  );
};
