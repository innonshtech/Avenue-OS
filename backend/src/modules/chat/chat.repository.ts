import prisma from '../../utils/prisma';
import { ChannelType, MessageType } from './chat.types';

export class ChatRepository {
  // 1. CHANNELS
  static async createChannel(data: {
    name: string;
    description?: string;
    type: ChannelType;
    projectId?: string;
    targetId?: string;
    taskId?: string;
    rfiId?: string;
    createdById: string;
  }) {
    return prisma.chatChannel.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        projectId: data.projectId || null,
        targetId: data.targetId || null,
        taskId: data.taskId || null,
        rfiId: data.rfiId || null,
        createdById: data.createdById,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  static async findChannelById(id: string) {
    return prisma.chatChannel.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
        },
        project: true,
        target: true,
        task: true,
        rfi: true,
      },
    });
  }

  static async findChannelByEntity(type: ChannelType, entityId: string) {
    const query: any = { type, isArchived: false };
    if (type === 'PROJECT') query.projectId = entityId;
    else if (type === 'TARGET') query.targetId = entityId;
    else if (type === 'TASK') query.taskId = entityId;
    else if (type === 'RFI') query.rfiId = entityId;

    return prisma.chatChannel.findFirst({
      where: query,
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  static async findDMChannelBetweenUsers(userA: string, userB: string) {
    // A DM channel has type "DIRECT" and both users as members
    return prisma.chatChannel.findFirst({
      where: {
        type: 'DIRECT',
        isArchived: false,
        AND: [
          { members: { some: { userId: userA } } },
          { members: { some: { userId: userB } } },
        ],
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
          },
        },
      },
    });
  }

  static async getChannelsForUser(userId: string) {
    return prisma.chatChannel.findMany({
      where: {
        isArchived: false,
        OR: [
          // Public channels of type ANNOUNCEMENT or where user is member
          { type: 'ANNOUNCEMENT' },
          { members: { some: { userId } } },
          { type: 'PROJECT', project: { members: { some: { userId } } } },
          { type: 'TARGET', target: { members: { some: { userId } } } }
        ],
      },
      include: {
        members: {
          select: {
            userId: true,
            lastSeenAt: true,
            user: { select: { id: true, name: true, email: true, role: true, avatar: true } }
          }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            createdAt: true,
            sender: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateChannel(id: string, data: { name?: string; description?: string; isArchived?: boolean }) {
    return prisma.chatChannel.update({
      where: { id },
      data,
    });
  }

  // 2. MEMBERS
  static async addMemberToChannel(channelId: string, userId: string) {
    return prisma.chatMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: {},
      create: {
        channelId,
        userId,
      },
    });
  }

  static async removeMemberFromChannel(channelId: string, userId: string) {
    return prisma.chatMember.deleteMany({
      where: { channelId, userId },
    });
  }

  static async checkChannelMembership(channelId: string, userId: string): Promise<boolean> {
    const member = await prisma.chatMember.findUnique({
      where: {
        channelId_userId: { channelId, userId },
      },
    });
    return !!member;
  }

  static async updateLastSeen(channelId: string, userId: string) {
    return prisma.chatMember.updateMany({
      where: { channelId, userId },
      data: { lastSeenAt: new Date() },
    });
  }

  // 3. MESSAGES
  static async createMessage(data: {
    channelId: string;
    senderId: string;
    content: string;
    messageType: MessageType;
    parentMessageId?: string;
  }) {
    return prisma.chatMessage.create({
      data: {
        channelId: data.channelId,
        senderId: data.senderId,
        content: data.content,
        messageType: data.messageType,
        parentMessageId: data.parentMessageId || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        pinnedMessage: true,
      },
    });
  }

  static async findMessageById(id: string) {
    return prisma.chatMessage.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        channel: true,
      },
    });
  }

  static async getChannelMessages(channelId: string, limit = 50, cursor?: string) {
    const query: any = {
      channelId,
      parentMessageId: null, // Thread replies are fetched separately
    };

    return prisma.chatMessage.findMany({
      where: query,
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        pinnedMessage: {
          include: {
            pinnedBy: { select: { name: true } },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: 'desc' }, // Order by newest for virtualization/cursor, client will reverse it
    });
  }

  static async getThreadReplies(parentMessageId: string) {
    return prisma.chatMessage.findMany({
      where: { parentMessageId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
        reactions: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async updateMessage(id: string, content: string) {
    return prisma.chatMessage.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, role: true, avatar: true },
        },
      },
    });
  }

  static async deleteMessage(id: string) {
    return prisma.chatMessage.delete({
      where: { id },
    });
  }

  // 4. REACTIONS
  static async addReaction(messageId: string, userId: string, emoji: string) {
    return prisma.messageReaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      update: {},
      create: { messageId, userId, emoji },
    });
  }

  static async removeReaction(messageId: string, userId: string, emoji: string) {
    return prisma.messageReaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  static async getMessageReactions(messageId: string) {
    return prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  // 5. PINNED MESSAGES
  static async pinMessage(channelId: string, messageId: string, pinnedById: string) {
    return prisma.pinnedMessage.upsert({
      where: {
        channelId_messageId: { channelId, messageId },
      },
      update: {},
      create: { channelId, messageId, pinnedById },
      include: {
        message: {
          include: {
            sender: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });
  }

  static async unpinMessage(channelId: string, messageId: string) {
    return prisma.pinnedMessage.deleteMany({
      where: { channelId, messageId },
    });
  }

  static async getPinnedMessages(channelId: string) {
    return prisma.pinnedMessage.findMany({
      where: { channelId },
      include: {
        message: {
          include: {
            sender: { select: { id: true, name: true, role: true, avatar: true } },
            reactions: true,
          },
        },
        pinnedBy: { select: { id: true, name: true } },
      },
    });
  }

  // 6. SEARCH
  static async searchMessages(userId: string, query: string, channelId?: string) {
    const searchConditions: any = {
      content: { contains: query, mode: 'insensitive' },
    };

    if (channelId) {
      searchConditions.channelId = channelId;
    } else {
      // If no channel is specified, only search channels where user is a member or public announcement channels
      searchConditions.channel = {
        OR: [
          { type: 'ANNOUNCEMENT' },
          { members: { some: { userId } } },
        ],
      };
    }

    return prisma.chatMessage.findMany({
      where: searchConditions,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        channel: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
