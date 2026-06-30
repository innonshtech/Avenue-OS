export type ChannelType = 'DIRECT' | 'PROJECT' | 'STAGE' | 'TASK' | 'RFI' | 'ANNOUNCEMENT';
export type MessageType = 'TEXT' | 'SYSTEM' | 'TASK_REFERENCE';
export type UserPresenceStatus = 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE';

export interface ChatChannelData {
  id: string;
  name: string;
  description?: string | null;
  type: ChannelType;
  projectId?: string | null;
  stageId?: string | null;
  taskId?: string | null;
  rfiId?: string | null;
  createdById: string;
  isArchived: boolean;
  createdAt: Date;
}

export interface ChatMessageData {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  parentMessageId?: string | null;
  isEdited: boolean;
  editedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageReactionData {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export interface ChatMemberData {
  id: string;
  channelId: string;
  userId: string;
  joinedAt: Date;
  lastSeenAt?: Date | null;
}

export interface PinnedMessageData {
  id: string;
  channelId: string;
  messageId: string;
  pinnedById: string;
  createdAt: Date;
}
