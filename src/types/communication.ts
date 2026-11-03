export interface TeamAttachment {
  url: string;
  name: string;
  type: string;
  size?: number;
}

export interface TeamMessage {
  _id: string;
  channelType: "direct" | "group";
  groupId?: string;
  directKey?: string;
  participants?: string[];
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  attachments?: TeamAttachment[];
  readBy?: string[];
  createdAt: string;
  updatedAt?: string;
  isOptimistic?: boolean;
  status?: "pending" | "sent" | "failed";
}

export interface TeamTypingPayload {
  channelType: "direct" | "group";
  channelId: string;
}

export interface TeamTypingEvent {
  isTyping: boolean;
  name: string;
  channelType?: "direct" | "group";
  channelId?: string;
  userId?: string;
}

export interface TeamDmNotice {
  fromUserId: string;
  fromName: string;
  content: string;
}

export interface TeamGroupNotice {
  groupId: string;
  fromName: string;
  content: string;
}

export interface TeamMessagesReadEvent {
  by: string;
  channelType: "direct" | "group";
  channelId: string;
}

export interface GroupMembersUpdatedEvent {
  groupId: string;
  members: Array<{
    _id: string;
    name: string;
    email?: string;
    role?: string;
    avatar?: string;
  }>;
}

export interface SendTeamMessagePayload {
  channelType: "direct" | "group";
  channelId: string;
  content: string;
  attachments?: TeamAttachment[];
}
