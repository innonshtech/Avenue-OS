import { Request, Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import prisma from '../../utils/prisma';
import { CHAT_EVENTS } from './chat.events';
import { getIO } from '../../sockets/socket.server';

export class ChatController {
  // 1. DMs
  static async createDMChannel(req: Request, res: Response) {
    try {
      const senderId = req.user?.id;
      const { recipientId } = req.body;

      if (!senderId) return res.status(401).json({ error: 'Unauthorized' });

      const channel = await ChatService.getOrCreateDMChannel(senderId, recipientId);
      if (!channel) return res.status(404).json({ error: 'DM channel could not be resolved' });
      
      res.status(200).json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create DM channel' });
    }
  }

  static async getDMHistory(req: Request, res: Response) {
    try {
      const senderId = req.user?.id;
      const { userId } = req.params;

      if (!senderId) return res.status(401).json({ error: 'Unauthorized' });

      const channel = await ChatService.getOrCreateDMChannel(senderId, userId);
      if (!channel) return res.status(404).json({ error: 'DM history not found' });
      
      const messages = await ChatRepository.getChannelMessages(channel.id);
      
      res.status(200).json({ channel, messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch DM history' });
    }
  }

  // 2. CHANNELS
  static async createChannel(req: Request, res: Response) {
    try {
      const createdById = req.user?.id;
      const { name, description, type, projectId, sprintId, taskId, blockerId, memberIds } = req.body;

      if (!createdById) return res.status(401).json({ error: 'Unauthorized' });

      const channel = await ChatService.createGroupChannel({
        name,
        description,
        type,
        projectId,
        sprintId,
        taskId,
        blockerId,
        createdById,
        memberIds,
      });

      res.status(201).json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create channel' });
    }
  }

  static async getChannels(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const channels = await ChatRepository.getChannelsForUser(userId);
      
      const channelsWithUnread = await Promise.all(
        channels.map(async (channel) => {
          const member = channel.members.find((m) => m.userId === userId);
          let unread = 0;
          if (member) {
            unread = await prisma.chatMessage.count({
              where: {
                channelId: channel.id,
                createdAt: {
                  gt: member.lastSeenAt || new Date(0)
                }
              }
            });
          }
          return {
            ...channel,
            _count: {
              ...((channel as any)._count || {}),
              unread
            }
          };
        })
      );

      res.status(200).json(channelsWithUnread);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch channels' });
    }
  }

  static async updateChannel(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { name, description, isArchived } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      // Only channel owner or Admin/PM can edit channels
      const channel = await ChatRepository.findChannelById(id);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const user = await prisma?.user.findUnique({ where: { id: userId } });
      if (channel.createdById !== userId && user?.role !== 'ADMIN' && user?.role !== 'PRODUCT_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: You cannot modify this channel' });
      }

      const updated = await ChatRepository.updateChannel(id, { name, description, isArchived });
      res.status(200).json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update channel' });
    }
  }

  static async deleteChannel(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const channel = await ChatRepository.findChannelById(id);
      if (!channel) return res.status(404).json({ error: 'Channel not found' });

      const user = await prisma?.user.findUnique({ where: { id: userId } });
      if (channel.createdById !== userId && user?.role !== 'ADMIN' && user?.role !== 'PRODUCT_MANAGER') {
        return res.status(403).json({ error: 'Forbidden: You cannot archive this channel' });
      }

      // Archive channel instead of hard delete
      const updated = await ChatRepository.updateChannel(id, { isArchived: true });
      res.status(200).json({ message: 'Channel archived successfully', channel: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to archive channel' });
    }
  }

  // 3. MESSAGES
  static async getMessages(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { channelId } = req.params;
      const { limit, cursor } = req.query;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const hasAccess = await ChatService.validateUserAccess(channelId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Forbidden: Access denied to this channel' });

      const limitNum = limit ? parseInt(limit as string) : 50;
      const messages = await ChatRepository.getChannelMessages(channelId, limitNum, cursor as string);

      res.status(200).json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch messages' });
    }
  }

  static async getReplies(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const message = await ChatRepository.findMessageById(messageId);
      if (!message) return res.status(404).json({ error: 'Message not found' });

      const hasAccess = await ChatService.validateUserAccess(message.channelId, userId);
      if (!hasAccess) return res.status(403).json({ error: 'Forbidden: Access denied' });

      const replies = await ChatRepository.getThreadReplies(messageId);
      res.status(200).json(replies);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch replies' });
    }
  }

  // 4. REACTIONS
  static async addReaction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const reaction = await ChatRepository.addReaction(messageId, userId, emoji);
      res.status(200).json(reaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to add reaction' });
    }
  }

  static async removeReaction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;
      const { emoji } = req.body;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await ChatRepository.removeReaction(messageId, userId, emoji);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to remove reaction' });
    }
  }

  // 5. PINNED
  static async pinMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const message = await ChatRepository.findMessageById(messageId);
      if (!message) return res.status(404).json({ error: 'Message not found' });

      const pin = await ChatRepository.pinMessage(message.channelId, messageId, userId);
      res.status(200).json(pin);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to pin message' });
    }
  }

  static async unpinMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const message = await ChatRepository.findMessageById(messageId);
      if (!message) return res.status(404).json({ error: 'Message not found' });

      await ChatRepository.unpinMessage(message.channelId, messageId);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to unpin message' });
    }
  }

  static async getPinnedMessages(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { channelId } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const pins = await ChatRepository.getPinnedMessages(channelId);
      res.status(200).json(pins);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch pinned messages' });
    }
  }

  // 6. SEARCH
  static async searchChat(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { q, channelId } = req.query;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!q) return res.status(400).json({ error: 'Search query is required' });

      const results = await ChatRepository.searchMessages(
        userId,
        q as string,
        channelId ? (channelId as string) : undefined
      );

      res.status(200).json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Search failed' });
    }
  }

  // 7. SEND MESSAGE VIA HTTP
  static async sendMessage(req: Request, res: Response) {
    try {
      const senderId = req.user?.id;
      const { channelId } = req.params;
      const { content, messageType, parentMessageId } = req.body;

      if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
      if (!channelId) return res.status(400).json({ error: 'Channel ID is required' });

      const message = await ChatService.sendMessage({
        channelId,
        senderId,
        content,
        messageType: messageType || 'TEXT',
        parentMessageId: parentMessageId || undefined,
      });

      // Broadcast to channel room via socket
      try {
        const io = getIO();
        const roomName = `channel:${channelId}`;
        io.to(roomName).emit(CHAT_EVENTS.MESSAGE_NEW, message);
      } catch (ioErr) {
        console.warn('Socket.IO not initialized or failed to broadcast message:', ioErr);
      }

      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to send message' });
    }
  }

  static async sendReply(req: Request, res: Response) {
    try {
      const senderId = req.user?.id;
      const { messageId } = req.params;
      const { content, messageType } = req.body;

      if (!senderId) return res.status(401).json({ error: 'Unauthorized' });
      if (!messageId) return res.status(400).json({ error: 'Message ID is required' });

      const parentMessage = await ChatRepository.findMessageById(messageId);
      if (!parentMessage) return res.status(404).json({ error: 'Parent message not found' });

      const message = await ChatService.sendMessage({
        channelId: parentMessage.channelId,
        senderId,
        content,
        messageType: messageType || 'TEXT',
        parentMessageId: messageId,
      });

      // Broadcast reply to channel room via socket
      try {
        const io = getIO();
        const roomName = `channel:${parentMessage.channelId}`;
        io.to(roomName).emit(CHAT_EVENTS.MESSAGE_NEW, message);
      } catch (ioErr) {
        console.warn('Socket.IO not initialized or failed to broadcast reply:', ioErr);
      }

      res.status(201).json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to send reply' });
    }
  }

  // 8. CONVERT TO TASK
  static async convertMessageToTask(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { messageId } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const result = await ChatService.convertMessageToTask(messageId, userId);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to convert message to task' });
    }
  }
}
