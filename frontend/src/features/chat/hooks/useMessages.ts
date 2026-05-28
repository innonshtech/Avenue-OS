import { useSocket } from '../../realtime/SocketProvider';
import { useChatStore } from '../store/chatStore';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useMessages = () => {
  const { socket } = useSocket();
  const { activeChannelId } = useChatStore();
  const queryClient = useQueryClient();

  const sendMessage = async (content: string, parentMessageId?: string | null) => {
    if (!activeChannelId) return;

    try {
      let response;
      if (parentMessageId) {
        response = await api.post(`/chat/messages/${parentMessageId}/replies`, { content });
      } else {
        response = await api.post(`/chat/channels/${activeChannelId}/messages`, { content });
      }

      const newMessage = response.data;

      // Update react-query cache for the messages list immediately
      if (parentMessageId) {
        queryClient.setQueryData(['chat-thread-replies', parentMessageId], (oldData: any[] | undefined) => {
          if (!oldData) return [newMessage];
          if (oldData.some((m) => m.id === newMessage.id)) return oldData;
          return [...oldData, newMessage];
        });

        // Update the reply count for parent message
        queryClient.setQueryData(['chat-messages', activeChannelId], (oldData: any[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((m) => {
            if (m.id === parentMessageId) {
              return {
                ...m,
                _count: {
                  ...m._count,
                  replies: (m._count?.replies || 0) + 1,
                },
              };
            }
            return m;
          });
        });
      } else {
        queryClient.setQueryData(['chat-messages', activeChannelId], (oldData: any[] | undefined) => {
          if (!oldData) return [newMessage];
          if (oldData.some((m) => m.id === newMessage.id)) return oldData;
          return [...oldData, newMessage];
        });
      }

      // Invalidate channels list to update last message preview
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const editMessage = (messageId: string, content: string) => {
    if (!socket) return;
    socket.emit('chat:message:edit', { messageId, content });
  };

  const deleteMessage = (messageId: string) => {
    if (!socket) return;
    socket.emit('chat:message:delete', { messageId });
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('chat:reaction:add', { messageId, emoji });
  };

  const removeReaction = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit('chat:reaction:remove', { messageId, emoji });
  };

  const togglePin = (messageId: string) => {
    if (!socket) return;
    socket.emit('chat:pin:toggle', { messageId });
  };

  const triggerReadReceipt = () => {
    if (!socket || !activeChannelId) return;
    socket.emit('chat:read', { channelId: activeChannelId });
  };

  return {
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    togglePin,
    triggerReadReceipt,
  };
};
