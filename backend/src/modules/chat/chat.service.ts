import { ChatRepository } from './chat.repository';
import { ChannelType, MessageType } from './chat.types';
import prisma from '../../utils/prisma';
import { inAppNotificationService } from '../../services/notifications/inapp-notification.service';
import { ActivityTrackerService } from '../../services/audit/activity-tracker.service';

export class ChatService {
  // 1. ACCESS CONTROL
  static async validateUserAccess(channelId: string, userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Admin (Nikheel) has access to everything
    if (user.role === 'ADMIN') return true;

    const channel = await ChatRepository.findChannelById(channelId);
    if (!channel) return false;

    // Product Manager (Saket) has access to all operational channels (not private DMs of others)
    if (user.role === 'PRODUCT_MANAGER' && channel.type !== 'DIRECT') {
      return true;
    }

    // Check direct membership first
    const isMember = await ChatRepository.checkChannelMembership(channelId, userId);
    if (isMember) return true;

    // Check contextual access for regular users
    if (channel.type === 'PROJECT' && channel.projectId) {
      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: channel.projectId, userId } },
      });
      return !!pm;
    }

    if (channel.type === 'SPRINT' && channel.sprintId) {
      const sm = await prisma.sprintMember.findUnique({
        where: { sprintId_userId: { sprintId: channel.sprintId, userId } },
      });
      return !!sm;
    }

    if (channel.type === 'TASK' && channel.taskId) {
      const task = await prisma.task.findUnique({ where: { id: channel.taskId } });
      if (!task) return false;
      
      // Developer/QA can access if they are assigned, created, or belong to the project
      if (task.assigneeId === userId || task.creatorId === userId) return true;

      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: task.projectId, userId } },
      });
      return !!pm;
    }

    if (channel.type === 'BLOCKER' && channel.blockerId) {
      const blocker = await prisma.blocker.findUnique({
        where: { id: channel.blockerId },
        include: { task: true },
      });
      if (!blocker) return false;

      // Access allowed to reporter, helper, or project members
      if (blocker.reporterId === userId || blocker.helperId === userId) return true;

      const pm = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: blocker.task.projectId, userId } },
      });
      return !!pm;
    }

    if (channel.type === 'ANNOUNCEMENT') {
      return true; // Announcements can be read by everyone
    }

    return false;
  }

  // 2. DM CHANNELS
  static async getOrCreateDMChannel(userAId: string, userBId: string) {
    if (userAId === userBId) {
      throw new Error('Cannot start a direct message with yourself');
    }

    let channel = await ChatRepository.findDMChannelBetweenUsers(userAId, userBId);
    if (!channel) {
      // Find user profiles to build a friendly name
      const userA = await prisma.user.findUnique({ where: { id: userAId } });
      const userB = await prisma.user.findUnique({ where: { id: userBId } });
      if (!userA || !userB) throw new Error('User not found');

      // Create new direct channel
      const newChannel = await ChatRepository.createChannel({
        name: `${userA.name} & ${userB.name}`,
        type: 'DIRECT',
        createdById: userAId,
      });

      // Add both members
      await ChatRepository.addMemberToChannel(newChannel.id, userAId);
      await ChatRepository.addMemberToChannel(newChannel.id, userBId);

      // Log channel creation
      await ActivityTrackerService.logActivity({
        userId: userAId,
        actionType: 'CHAT_CHANNEL_CREATED',
        entityType: 'CHAT_CHANNEL',
        entityId: newChannel.id,
        title: 'New Direct Message Room Started',
        description: `${userA.name} started a DM with ${userB.name}`,
      });

      // Reload channel to include members relations
      const reloaded = await ChatRepository.findDMChannelBetweenUsers(userAId, userBId);
      if (!reloaded) throw new Error('Failed to load created DM channel');
      channel = reloaded;
    }

    return channel;
  }

  // 3. GROUP CHANNELS
  static async createGroupChannel(data: {
    name: string;
    description?: string;
    type: ChannelType;
    projectId?: string;
    sprintId?: string;
    taskId?: string;
    blockerId?: string;
    createdById: string;
    memberIds?: string[];
  }) {
    const user = await prisma.user.findUnique({ where: { id: data.createdById } });
    if (!user) throw new Error('Creator not found');

    // Role verification for Announcement channel: Only Nikheel (Admin) or Saket (Product Manager)
    if (data.type === 'ANNOUNCEMENT') {
      const allowedEmails = ['saket.innonsh@gmail.com', 'nikheel.innonsh@gmail.com'];
      const allowedRoles = ['ADMIN', 'PRODUCT_MANAGER'];
      if (!allowedRoles.includes(user.role) || !allowedEmails.includes(user.email)) {
        throw new Error('Unauthorized: Only Nikheel and Saket can post announcements');
      }
    }

    const channel = await ChatRepository.createChannel(data);

    // Auto add creator to the channel
    await ChatRepository.addMemberToChannel(channel.id, data.createdById);

    // Invite other members
    if (data.memberIds && data.memberIds.length > 0) {
      for (const id of data.memberIds) {
        await ChatRepository.addMemberToChannel(channel.id, id);
      }
    }

    // Log Activity
    await ActivityTrackerService.logActivity({
      userId: data.createdById,
      actionType: 'CHAT_CHANNEL_CREATED',
      entityType: 'CHAT_CHANNEL',
      entityId: channel.id,
      title: `Channel #${data.name} Created`,
      description: `Created new chat channel of type ${data.type}`,
    });

    return channel;
  }

  // 4. AUTO CHANNELS
  static async createAutoTaskChannel(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { creator: true, assignee: true },
    });
    if (!task) return null;

    // Check if channel already exists
    const existing = await ChatRepository.findChannelByEntity('TASK', taskId);
    if (existing) return existing;

    const channel = await ChatRepository.createChannel({
      name: `task:${task.key}`,
      description: `Discussion for task: ${task.title}`,
      type: 'TASK',
      projectId: task.projectId,
      sprintId: task.sprintId || undefined,
      taskId: task.id,
      createdById: task.creatorId,
    });

    // Add creator, assignee, and project owner to channel members
    await ChatRepository.addMemberToChannel(channel.id, task.creatorId);
    if (task.assigneeId) {
      await ChatRepository.addMemberToChannel(channel.id, task.assigneeId);
    }

    // Add project owner too
    const project = await prisma.project.findUnique({ where: { id: task.projectId } });
    if (project && project.ownerId !== task.creatorId && project.ownerId !== task.assigneeId) {
      await ChatRepository.addMemberToChannel(channel.id, project.ownerId);
    }

    return channel;
  }

  static async createAutoBlockerChannel(blockerId: string) {
    const blocker = await prisma.blocker.findUnique({
      where: { id: blockerId },
      include: { task: true, reporter: true },
    });
    if (!blocker) return null;

    const existing = await ChatRepository.findChannelByEntity('BLOCKER', blockerId);
    if (existing) return existing;

    const channel = await ChatRepository.createChannel({
      name: `blocker:${blocker.task.key}`,
      description: `Blocker Escalation: ${blocker.description}`,
      type: 'BLOCKER',
      projectId: blocker.task.projectId,
      sprintId: blocker.task.sprintId || undefined,
      taskId: blocker.taskId,
      blockerId: blocker.id,
      createdById: blocker.reporterId,
    });

    // Add reporter, assignee, and helper (if set)
    await ChatRepository.addMemberToChannel(channel.id, blocker.reporterId);
    if (blocker.helperId) {
      await ChatRepository.addMemberToChannel(channel.id, blocker.helperId);
    }
    if (blocker.task.assigneeId) {
      await ChatRepository.addMemberToChannel(channel.id, blocker.task.assigneeId);
    }

    // Log escalation chat
    await ActivityTrackerService.logActivity({
      userId: blocker.reporterId,
      actionType: 'BLOCKER_ESCALATED',
      entityType: 'BLOCKER',
      entityId: blocker.id,
      title: 'Blocker Escalation Discussion Created',
      description: `Escalation room for blocker on task ${blocker.task.key}`,
    });

    return channel;
  }

  // 5. POST MESSAGE & PARSE MENTIONS
  static async sendMessage(data: {
    channelId: string;
    senderId: string;
    content: string;
    messageType: MessageType;
    parentMessageId?: string;
  }) {
    // 1. Enforce access control
    const hasAccess = await this.validateUserAccess(data.channelId, data.senderId);
    if (!hasAccess) {
      throw new Error('Unauthorized access to this chat channel');
    }

    // 2. Announcements verification: Only Nikheel and Saket can post in ANNOUNCEMENT channels
    const channel = await ChatRepository.findChannelById(data.channelId);
    if (channel?.type === 'ANNOUNCEMENT') {
      const sender = await prisma.user.findUnique({ where: { id: data.senderId } });
      const allowedEmails = ['saket.innonsh@gmail.com', 'nikheel.innonsh@gmail.com'];
      const allowedRoles = ['ADMIN', 'PRODUCT_MANAGER'];
      if (!sender || !allowedRoles.includes(sender.role) || !allowedEmails.includes(sender.email)) {
        throw new Error('Only Saket or Nikheel can send messages in announcements');
      }
    }

    // 3. Save message
    const message = await ChatRepository.createMessage(data);

    // 4. Parse Mentions and trigger notifications
    await this.processMentions(message.content, message.id, data.senderId, data.channelId);

    // 5. Log Activity for new chat messages (non-threaded only to avoid logs flooding)
    if (!data.parentMessageId) {
      await ActivityTrackerService.logActivity({
        userId: data.senderId,
        actionType: 'CHAT_MESSAGE_SENT',
        entityType: 'CHAT_MESSAGE',
        entityId: message.id,
        title: `Message in #${channel?.name || 'chat'}`,
        description: `${message.sender.name} sent a message.`,
      });
    }

    // 6. Update sender's Last Seen for this channel
    await ChatRepository.updateLastSeen(data.channelId, data.senderId);

    return message;
  }

  static async processMentions(content: string, messageId: string, senderId: string, channelId: string) {
    const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return;

    const sender = await prisma.user.findUnique({ where: { id: senderId } });
    const channel = await ChatRepository.findChannelById(channelId);
    if (!sender || !channel) return;

    const uniqueNames = Array.from(new Set(matches.map(m => m.slice(1))));

    for (const name of uniqueNames) {
      // Find user by name (case-insensitive)
      const user = await prisma.user.findFirst({
        where: {
          name: { equals: name, mode: 'insensitive' },
        },
      });

      if (user && user.id !== senderId) {
        // Send Notification
        await inAppNotificationService.createNotification(
          user.id,
          'MENTION',
          `Mentioned in #${channel.name}`,
          `${sender.name} mentioned you in chat: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          `/dashboard/chat?channelId=${channelId}`
        );

        // Log mention activity
        await ActivityTrackerService.logActivity({
          userId: senderId,
          actionType: 'CHAT_MENTION_CREATED',
          entityType: 'USER',
          entityId: user.id,
          title: `Mentioned ${user.name}`,
          description: `Mentioned ${user.name} in #${channel.name}`,
        });
      }
    }
  }

  // 6. MESSAGE CONVERSION TO TASK
  static async convertMessageToTask(messageId: string, userId: string) {
    const message = await ChatRepository.findMessageById(messageId);
    if (!message) throw new Error('Message not found');

    // Create log tracking the conversion intent
    await ActivityTrackerService.logActivity({
      userId,
      actionType: 'CHAT_TO_TASK_CONVERTED',
      entityType: 'CHAT_MESSAGE',
      entityId: messageId,
      title: 'Message Flagged for Task Conversion',
      description: `User converted chat message "${message.content.substring(0, 30)}..." into a task.`,
    });

    return {
      title: message.content,
      description: `Converted from chat discussion in channel: ${message.channel?.name || 'Unknown'}\nOriginal Author: ${message.sender?.name || 'Unknown'}`,
    };
  }
}
