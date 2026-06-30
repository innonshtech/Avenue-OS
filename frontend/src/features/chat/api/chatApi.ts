import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  type: 'DIRECT' | 'PROJECT' | 'STAGE' | 'TASK' | 'RFI' | 'ANNOUNCEMENT';
  projectId?: string | null;
  stageId?: string | null;
  taskId?: string | null;
  rfiId?: string | null;
  createdById: string;
  isArchived: boolean;
  createdAt: string;
  members?: Array<{
    userId: string;
    lastSeenAt?: string | null;
    user: { id: string; name: string; email: string; role: string; avatar?: string };
  }>;
  messages?: Array<{
    content: string;
    createdAt: string;
    sender: { name: string };
  }>;
  _count?: {
    unread: number;
  };
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'SYSTEM' | 'TASK_REFERENCE';
  parentMessageId?: string | null;
  isEdited: boolean;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  reactions: Array<{
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    user: { id: string; name: string };
  }>;
  pinnedMessage?: {
    id: string;
    pinnedById: string;
    createdAt: string;
    pinnedBy: { name: string };
  } | null;
  _count?: {
    replies: number;
  };
}

export const useChannels = () => {
  return useQuery<Channel[]>({
    queryKey: ['chat-channels'],
    queryFn: async () => {
      const { data } = await api.get('/chat/channels');
      return data;
    },
  });
};

export const useChannelMessages = (channelId: string, enabled = true) => {
  return useQuery<Message[]>({
    queryKey: ['chat-messages', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/channels/${channelId}/messages`);
      return [...data].reverse();
    },
    enabled: !!channelId && enabled,
    staleTime: 0,
  });
};

export const useThreadReplies = (messageId: string, enabled = true) => {
  return useQuery<Message[]>({
    queryKey: ['chat-thread-replies', messageId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/messages/${messageId}/replies`);
      return data;
    },
    enabled: !!messageId && enabled,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newChannel: {
      name: string;
      description?: string;
      type: 'PROJECT' | 'STAGE' | 'TASK' | 'RFI' | 'ANNOUNCEMENT';
      projectId?: string | null;
      stageId?: string | null;
      taskId?: string | null;
      rfiId?: string | null;
      memberIds?: string[];
    }) => {
      const { data } = await api.post('/chat/channels', newChannel);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
};

export const useDMHistory = () => {
  return useMutation<{ channel: Channel; messages: Message[] }, Error, string>({
    mutationFn: async (userId: string) => {
      const { data } = await api.get(`/chat/dm/${userId}`);
      return data;
    },
  });
};

export const usePinnedMessages = (channelId: string) => {
  return useQuery<any[]>({
    queryKey: ['chat-pins', channelId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/channels/${channelId}/pins`);
      return data;
    },
    enabled: !!channelId,
  });
};

export const useSearchChat = (q: string, channelId?: string) => {
  return useQuery<any[]>({
    queryKey: ['chat-search', q, channelId],
    queryFn: async () => {
      if (!q) return [];
      const url = channelId ? `/chat/search?q=${q}&channelId=${channelId}` : `/chat/search?q=${q}`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: !!q,
  });
};

export const useConvertMessageToTask = () => {
  return useMutation<{ title: string; description: string }, Error, string>({
    mutationFn: async (messageId: string) => {
      const { data } = await api.post(`/chat/messages/${messageId}/convert-task`);
      return data;
    },
  });
};
