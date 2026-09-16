import React from "react";
import { MessageSquare } from "lucide-react";

export const ChatEmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
      <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 text-[#4285F4]">
        <MessageSquare size={32} />
      </div>
      <h3 className="text-lg font-bold text-[#051321] mb-1">
        Select a chat to start messaging
      </h3>
      <p className="text-sm text-[#637381] max-w-sm">
        Choose a direct message or group conversation from the sidebar to connect with your team in real time.
      </p>
    </div>
  );
};
