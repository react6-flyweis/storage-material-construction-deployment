import React from "react";
import { Info, AlertCircle, X, ArrowLeft } from "lucide-react";
import { type ActiveChatState, getDepartmentIcon } from "./types";

interface ChatHeaderProps {
  activeChat: ActiveChatState;
  typingText: string | null;
  errorBanner: string | null;
  setErrorBanner: (err: string | null) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  onBackClick?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChat,
  typingText,
  errorBanner,
  setErrorBanner,
  isDrawerOpen,
  setIsDrawerOpen,
  onBackClick,
}) => {
  return (
    <>
      <div
        className="p-3 lg:px-6 lg:py-3.5 bg-white border-b border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors shadow-2xs z-10"
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {onBackClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBackClick();
              }}
              className="md:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft size={20} />
            </button>
          )}

          <div
            className={`w-10 h-10 ${
              activeChat.color || "bg-[#2563EB]"
            } rounded-xl shadow-xs flex items-center justify-center text-white shrink-0 overflow-hidden font-bold`}
          >
            {activeChat.type === "group" ? (
              getDepartmentIcon(activeChat.category)
            ) : activeChat.avatar ? (
              <img
                src={activeChat.avatar}
                alt={activeChat.name}
                className="w-full h-full object-cover"
              />
            ) : (
              activeChat.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm lg:text-base font-bold text-[#051321] truncate">
              {activeChat.name}
            </h3>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1.5">
              {typingText ? (
                <span className="text-blue-600 font-semibold animate-pulse">
                  {typingText}
                </span>
              ) : activeChat.type === "group" ? (
                `${activeChat.membersCount || 2} members`
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {activeChat.role || "Online"}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button
            type="button"
            title="Conversation Info"
            className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsDrawerOpen(!isDrawerOpen);
            }}
          >
            <Info size={19} />
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="hover:text-rose-900 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
};
