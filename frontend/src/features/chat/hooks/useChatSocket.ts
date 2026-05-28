import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../realtime/SocketProvider';
import { useChatStore } from '../store/chatStore';
// Define socket events inside hook to avoid import mismatch issues
const EVENTS = {
  MESSAGE_NEW: 'chat:message:new',
  MESSAGE_EDIT: 'chat:message:edit',
  MESSAGE_DELETE: 'chat:message:delete',
  TYPING_STATUS: 'chat:typing',
  READ_RECEIPT: 'chat:read',
  REACTION_ADD: 'chat:reaction:add',
  REACTION_REMOVE: 'chat:reaction:remove',
  PIN_TOGGLE: 'chat:pin:toggle',
  PRESENCE_UPDATE: 'presence:update',
  ROOM_JOIN: 'chat:room:join',
  ROOM_LEAVE: 'chat:room:leave',
};

export const useChatSocket = () => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const {
    activeChannelId,
    activeThreadMessage,
    setUserPresence,
    setTypingUser,
    clearTypingUsers,
  } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    // 1. Listen for new messages
    socket.on(EVENTS.MESSAGE_NEW, (message: any) => {
      const { channelId, parentMessageId } = message;

      if (parentMessageId) {
        // Thread reply
        queryClient.setQueryData(['chat-thread-replies', parentMessageId], (oldData: any[] | undefined) => {
          if (!oldData) return [message];
          if (oldData.some((m) => m.id === message.id)) return oldData;
          return [...oldData, message];
        });

        // Also update parent message's reply count in the message history list
        queryClient.setQueryData(['chat-messages', channelId], (oldData: any[] | undefined) => {
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
        // Normal channel message
        queryClient.setQueryData(['chat-messages', channelId], (oldData: any[] | undefined) => {
          if (!oldData) return [message];
          if (oldData.some((m) => m.id === message.id)) return oldData;
          return [...oldData, message];
        });
      }

      // Invalidate the channels list to update the last message preview
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    });

    // 2. Listen for message edits
    socket.on(EVENTS.MESSAGE_EDIT, (updatedMessage: any) => {
      const { channelId, parentMessageId } = updatedMessage;

      if (parentMessageId) {
        queryClient.setQueryData(['chat-thread-replies', parentMessageId], (oldData: any[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((m) => (m.id === updatedMessage.id ? updatedMessage : m));
        });
      } else {
        queryClient.setQueryData(['chat-messages', channelId], (oldData: any[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((m) => (m.id === updatedMessage.id ? updatedMessage : m));
        });
      }
    });

    // 3. Listen for message deletes
    socket.on(EVENTS.MESSAGE_DELETE, (data: { messageId: string; channelId: string }) => {
      queryClient.setQueryData(['chat-messages', data.channelId], (oldData: any[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((m) => m.id !== data.messageId);
      });
      // Also check thread replies
      queryClient.setQueryData(['chat-thread-replies', data.messageId], () => []);
    });

    // 4. Listen for typing indicators
    socket.on(
      EVENTS.TYPING_STATUS,
      (data: { channelId: string; userId: string; userName: string; isTyping: boolean }) => {
        if (data.channelId === activeChannelId) {
          setTypingUser(data.channelId, data.userId, data.userName, data.isTyping);
        }
      }
    );

    // 5. Listen for read receipts
    socket.on(EVENTS.READ_RECEIPT, (data: { channelId: string; userId: string; lastSeenAt: string }) => {
      // Invalidate channels list to sync last seen / unread badges
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    });

    // 6. Listen for reactions (both additions and removals)
    const handleReactions = (data: { messageId: string; channelId: string; reactions: any[] }) => {
      const updateList = (messages: any[] | undefined) => {
        if (!messages) return [];
        return messages.map((m) => {
          if (m.id === data.messageId) {
            return { ...m, reactions: data.reactions };
          }
          return m;
        });
      };

      queryClient.setQueryData(['chat-messages', data.channelId], updateList);
      if (activeThreadMessage?.id === data.messageId || activeThreadMessage?.parentMessageId === data.messageId) {
        queryClient.setQueryData(['chat-thread-replies', data.messageId], updateList);
      }
    };

    socket.on(EVENTS.REACTION_ADD, handleReactions);
    socket.on(EVENTS.REACTION_REMOVE, handleReactions);

    // 7. Listen for pin updates
    socket.on(
      EVENTS.PIN_TOGGLE,
      (data: { messageId: string; channelId: string; isPinned: boolean; pin: any }) => {
        const updatePin = (messages: any[] | undefined) => {
          if (!messages) return [];
          return messages.map((m) => {
            if (m.id === data.messageId) {
              return { ...m, pinnedMessage: data.isPinned ? data.pin : null };
            }
            return m;
          });
        };

        queryClient.setQueryData(['chat-messages', data.channelId], updatePin);
        queryClient.invalidateQueries({ queryKey: ['chat-pins', data.channelId] });
      }
    );

    // 8. Listen for presence status updates
    socket.on(EVENTS.PRESENCE_UPDATE, (data: { userId: string; status: any }) => {
      setUserPresence(data.userId, data.status);
    });

    return () => {
      socket.off(EVENTS.MESSAGE_NEW);
      socket.off(EVENTS.MESSAGE_EDIT);
      socket.off(EVENTS.MESSAGE_DELETE);
      socket.off(EVENTS.TYPING_STATUS);
      socket.off(EVENTS.READ_RECEIPT);
      socket.off(EVENTS.REACTION_ADD);
      socket.off(EVENTS.REACTION_REMOVE);
      socket.off(EVENTS.PIN_TOGGLE);
      socket.off(EVENTS.PRESENCE_UPDATE);
    };
  }, [socket, activeChannelId, activeThreadMessage, queryClient, setUserPresence, setTypingUser]);

  // Handle joining and leaving rooms automatically when active channel changes
  useEffect(() => {
    if (!socket || !activeChannelId) return;

    // Join room
    socket.emit(EVENTS.ROOM_JOIN, { channelId: activeChannelId }, (res: any) => {
      if (!res?.success) {
        console.warn('Failed to join chat channel room:', res?.error);
      }
    });

    // Clear typing users of previous channel
    clearTypingUsers();

    return () => {
      socket.emit(EVENTS.ROOM_LEAVE, { channelId: activeChannelId });
    };
  }, [socket, activeChannelId, clearTypingUsers]);

  // Tab visibility presence monitoring
  useEffect(() => {
    if (!socket) return;

    const handleVisibilityChange = () => {
      const status = document.hidden ? 'AWAY' : 'ONLINE';
      socket.emit(EVENTS.PRESENCE_UPDATE, { status });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);
};
