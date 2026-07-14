import { Socket } from 'socket.io';
import { getIO, AuthenticatedSocket } from '../../sockets/socket.server';
import { CHAT_EVENTS } from './chat.events';
import { ChatService } from './chat.service';
import { inAppNotificationService } from '../../services/notifications/inapp-notification.service';
import { hasPermission } from '../../utils/permissionHelper';
import { ChatRepository } from './chat.repository';
import prisma from '../../utils/prisma';
import { redis } from '../../utils/redis';

// Keep track of active sockets to users mapping for local presence handling
const activeUserSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const registerChatHandlers = (socket: AuthenticatedSocket) => {
  const io = getIO();
  const user = socket.user;
  if (!user) return;

  const userId = user.id;

  // Add to active sockets map
  if (!activeUserSockets.has(userId)) {
    activeUserSockets.set(userId, new Set());
  }
  activeUserSockets.get(userId)!.add(socket.id);
  
  // Set in Redis (async but we don't await in sync handler)
  redis.set(`presence:user:${userId}`, 'ONLINE').catch(console.error);

  // Broadcast presence status: ONLINE
  io.emit(CHAT_EVENTS.PRESENCE_UPDATE, {
    userId,
    status: 'ONLINE',
    lastSeen: new Date(),
  });

  // 1. JOIN CHANNEL ROOM
  socket.on(CHAT_EVENTS.ROOM_JOIN, async ({ channelId }: { channelId: string }, callback?: any) => {
    try {
      if (!channelId) {
        if (callback) callback({ success: false, error: 'Channel ID is required' });
        return;
      }

      // Check access permission
      const hasAccess = await ChatService.validateUserAccess(channelId, userId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to this chat room' });
        if (callback) callback({ success: false, error: 'Access denied' });
        return;
      }

      const roomName = `channel:${channelId}`;
      await socket.join(roomName);
      
      // Update read receipt / last seen
      await ChatRepository.updateLastSeen(channelId, userId);
      
      // Broadcast read receipt to others in the room
      socket.to(roomName).emit(CHAT_EVENTS.READ_RECEIPT, {
        channelId,
        userId,
        lastSeenAt: new Date(),
      });

      console.log(`💬 User ${user.email} joined chat room: ${roomName}`);
      if (callback) callback({ success: true });
    } catch (error: any) {
      console.error('Error joining chat room:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 2. LEAVE CHANNEL ROOM
  socket.on(CHAT_EVENTS.ROOM_LEAVE, async ({ channelId }: { channelId: string }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    await socket.leave(roomName);
    console.log(`💬 User ${user.email} left chat room: ${roomName}`);
  });

  // 3. SEND MESSAGE
  socket.on(
    CHAT_EVENTS.MESSAGE_NEW,
    async (
      data: { channelId: string; content: string; parentMessageId?: string },
      callback?: any
    ) => {
      try {
        const message = await ChatService.sendMessage({
          channelId: data.channelId,
          senderId: userId,
          content: data.content,
          messageType: 'TEXT',
          parentMessageId: data.parentMessageId,
        });

        // Broadcast to channel room
        const roomName = `channel:${data.channelId}`;
        io.to(roomName).emit(CHAT_EVENTS.MESSAGE_NEW, message);

        if (callback) callback({ success: true, message });
      } catch (error: any) {
        console.error('Error sending message over socket:', error);
        socket.emit('error', { message: error.message || 'Failed to send message' });
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );

  // 4. EDIT MESSAGE
  socket.on(
    CHAT_EVENTS.MESSAGE_EDIT,
    async (data: { messageId: string; content: string }, callback?: any) => {
      try {
        const message = await ChatRepository.findMessageById(data.messageId);
        if (!message) throw new Error('Message not found');
        const canManage = await hasPermission(user.role, 'VIEW_TEAM');
        if (message.senderId !== userId && !canManage) {
          throw new Error('Unauthorized to edit this message');
        }

        const updated = await ChatRepository.updateMessage(data.messageId, data.content);

        // Broadcast edit to channel room
        io.to(`channel:${message.channelId}`).emit(CHAT_EVENTS.MESSAGE_EDIT, updated);
        if (callback) callback({ success: true, message: updated });
      } catch (error: any) {
        console.error('Error editing message:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );

  // 5. DELETE MESSAGE
  socket.on(CHAT_EVENTS.MESSAGE_DELETE, async ({ messageId }: { messageId: string }, callback?: any) => {
    try {
      const message = await ChatRepository.findMessageById(messageId);
      if (!message) throw new Error('Message not found');
      const canManage = await hasPermission(user.role, 'VIEW_TEAM');
      if (message.senderId !== userId && !canManage) {
        throw new Error('Unauthorized to delete this message');
      }

      await ChatRepository.deleteMessage(messageId);

      // Broadcast delete to channel room
      io.to(`channel:${message.channelId}`).emit(CHAT_EVENTS.MESSAGE_DELETE, {
        messageId,
        channelId: message.channelId,
      });
      if (callback) callback({ success: true });
    } catch (error: any) {
      console.error('Error deleting message:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 6. TYPING INDICATORS
  socket.on(CHAT_EVENTS.TYPING_STATUS, async ({ channelId, isTyping }: { channelId: string; isTyping: boolean }) => {
    if (!channelId) return;
    const roomName = `channel:${channelId}`;
    
    // Use Redis to store typing state (expires in 10s if not cleared)
    const typingKey = `typing:channel:${channelId}:user:${userId}`;
    if (isTyping) {
      await redis.set(typingKey, true, { ex: 10 });
    } else {
      await redis.del(typingKey);
    }
    
    // Broadcast typing to everyone in room except sender
    socket.to(roomName).emit(CHAT_EVENTS.TYPING_STATUS, {
      channelId,
      userId,
      userName: user.email.split('@')[0], // Fallback name
      isTyping,
    });
  });

  // 7. READ RECEIPT
  socket.on(CHAT_EVENTS.READ_RECEIPT, async ({ channelId }: { channelId: string }) => {
    if (!channelId) return;
    try {
      await ChatRepository.updateLastSeen(channelId, userId);
      // Also update in Redis for quick access
      await redis.set(`lastSeen:channel:${channelId}:user:${userId}`, Date.now());
      
      const roomName = `channel:${channelId}`;
      
      socket.to(roomName).emit(CHAT_EVENTS.READ_RECEIPT, {
        channelId,
        userId,
        lastSeenAt: new Date(),
      });
    } catch (err) {
      console.error('Error updating read receipts:', err);
    }
  });

  // 8. REACTIONS
  socket.on(
    CHAT_EVENTS.REACTION_ADD,
    async ({ messageId, emoji }: { messageId: string; emoji: string }, callback?: any) => {
      try {
        const message = await ChatRepository.findMessageById(messageId);
        if (!message) throw new Error('Message not found');

        const reaction = await ChatRepository.addReaction(messageId, userId, emoji);

        // Fetch refreshed reactions
        const reactions = await ChatRepository.getMessageReactions(messageId);

        // Broadcast update to channel
        io.to(`channel:${message.channelId}`).emit(CHAT_EVENTS.REACTION_ADD, {
          messageId,
          channelId: message.channelId,
          reactions,
        });

        if (callback) callback({ success: true, reaction });
      } catch (error: any) {
        console.error('Error adding reaction:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );

  socket.on(
    CHAT_EVENTS.REACTION_REMOVE,
    async ({ messageId, emoji }: { messageId: string; emoji: string }, callback?: any) => {
      try {
        const message = await ChatRepository.findMessageById(messageId);
        if (!message) throw new Error('Message not found');

        await ChatRepository.removeReaction(messageId, userId, emoji);

        // Fetch refreshed reactions
        const reactions = await ChatRepository.getMessageReactions(messageId);

        // Broadcast update to channel
        io.to(`channel:${message.channelId}`).emit(CHAT_EVENTS.REACTION_REMOVE, {
          messageId,
          channelId: message.channelId,
          reactions,
        });

        if (callback) callback({ success: true });
      } catch (error: any) {
        console.error('Error removing reaction:', error);
        if (callback) callback({ success: false, error: error.message });
      }
    }
  );

  // 9. PINNED
  socket.on(CHAT_EVENTS.PIN_TOGGLE, async ({ messageId }: { messageId: string }, callback?: any) => {
    try {
      const message = await ChatRepository.findMessageById(messageId);
      if (!message) throw new Error('Message not found');

      // Check if already pinned
      const pins = await ChatRepository.getPinnedMessages(message.channelId);
      const isPinned = pins.some((p) => p.messageId === messageId);

      let pinData = null;
      if (isPinned) {
        await ChatRepository.unpinMessage(message.channelId, messageId);
      } else {
        pinData = await ChatRepository.pinMessage(message.channelId, messageId, userId);
      }

      // Broadcast update to channel
      io.to(`channel:${message.channelId}`).emit(CHAT_EVENTS.PIN_TOGGLE, {
        messageId,
        channelId: message.channelId,
        isPinned: !isPinned,
        pin: pinData,
      });

      if (callback) callback({ success: true, isPinned: !isPinned });
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      if (callback) callback({ success: false, error: error.message });
    }
  });

  // 10. PRESENCE MANUAL UPDATE
  socket.on(
    CHAT_EVENTS.PRESENCE_UPDATE,
    async ({ status }: { status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE' }) => {
      await redis.set(`presence:user:${userId}`, status);
      io.emit(CHAT_EVENTS.PRESENCE_UPDATE, {
        userId,
        status,
        lastSeen: new Date(),
      });
    }
  );

  // 11. DISCONNECT PRESENCE
  socket.on('disconnect', async () => {
    const sockets = activeUserSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        // User has no more active socket connections
        activeUserSockets.delete(userId);
        
        await redis.del(`presence:user:${userId}`);

        // Broadcast presence: OFFLINE
        io.emit(CHAT_EVENTS.PRESENCE_UPDATE, {
          userId,
          status: 'OFFLINE',
          lastSeen: new Date(),
        });
      }
    }
  });
};

// Helper to query active users status in batch
export const getUserPresence = async (userId: string) => {
  return (await redis.get(`presence:user:${userId}`)) || 'OFFLINE';
};
export const getActiveUserPresences = async () => {
  // Upstash REST doesn't support keys with easy batching without multiple calls,
  // we'll return an empty object for synchronous calls for now or migrate to async if needed
  return {}; 
};
export const getActiveUsers = () => {
  return Array.from(activeUserSockets.keys());
};
export const isUserOnline = (userId: string) => {
  return activeUserSockets.has(userId) && activeUserSockets.get(userId)!.size > 0;
};
export const sendSystemNotificationToChannel = async (channelId: string, content: string) => {
  try {
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (!systemUser) return;

    const message = await ChatRepository.createMessage({
      channelId,
      senderId: systemUser.id,
      content,
      messageType: 'SYSTEM',
    });

    const io = getIO();
    io.to(`channel:${channelId}`).emit(CHAT_EVENTS.MESSAGE_NEW, message);
  } catch (err) {
    console.error('Failed to send system notification to chat:', err);
  }
};
