import prisma from '../../utils/prisma';
import { inAppNotificationService } from '../../services/notifications/inapp-notification.service';
import { NotificationType } from '@prisma/client';
import { getIO } from '../../sockets/socket.server';
import { SOCKET_EVENTS } from '../../sockets/socket.events';

export class CommentsService {
  /**
   * Retrieves discussion threads for a task, including top-level comments, nested replies, and reactions.
   */
  async getCommentsForTask(taskId: string) {
    return await prisma.comment.findMany({
      where: { taskId, parentCommentId: null },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Creates a new comment or reply, parses mentions, logs activity, and broadcasts.
   */
  async createComment(
    taskId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ) {
    // 1. Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, title: true },
    });
    if (!task) {
      throw new Error('Task not found');
    }

    // 2. Create the comment
    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        reactions: true,
        replies: true,
      },
    });

    const projectId = task.projectId;
    const commenterName = comment.user.name;

    // 3. Log task activity
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: parentCommentId ? 'COMMENT_REPLY_ADDED' : 'COMMENT_ADDED',
        newValue: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      },
    });

    // 4. Parse mentions: e.g. @username or @Name
    const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
    const mentionedNames: string[] = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedNames.push(match[1]);
    }

    // Process mentions asynchronously (non-blocking to main execution)
    for (const name of mentionedNames) {
      try {
        const targetUser = await prisma.user.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: 'insensitive' } },
              { email: { startsWith: name, mode: 'insensitive' } },
            ],
          },
        });

        // Notify if user found, and not notifying self
        if (targetUser && targetUser.id !== userId) {
          const mentionTitle = `Mentioned on ${task.title}`;
          const mentionMsg = `${commenterName} mentioned you in a comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`;
          const targetUrl = `/dashboard/tasks/${taskId}`;

          await inAppNotificationService.createNotification(
            targetUser.id,
            NotificationType.MENTION,
            mentionTitle,
            mentionMsg,
            targetUrl
          );

          // Log mention activity
          await prisma.taskActivity.create({
            data: {
              taskId,
              userId: targetUser.id,
              action: 'USER_MENTIONED',
              newValue: `Mentioned by ${commenterName}`,
            },
          });
        }
      } catch (err) {
        console.error(`Failed to process mention for @${name}:`, err);
      }
    }

    // 5. Broadcast to Socket.IO project room
    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit(SOCKET_EVENTS.COMMENT_NEW, {
        comment,
        taskId,
        projectId,
      });
    } catch (wsError) {
      console.warn('Could not broadcast comment:new via Socket.IO:', wsError);
    }

    return comment;
  }

  /**
   * Updates comment content.
   */
  async updateComment(commentId: string, userId: string, role: string, content: string) {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { projectId: true } } },
    });

    if (!existing) {
      throw new Error('Comment not found');
    }

    // Authorization: Owner or PM/Admin
    if (existing.userId !== userId && role !== 'ADMIN' && role !== 'PRODUCT_MANAGER') {
      throw new Error('Forbidden');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        reactions: true,
      },
    });

    // Broadcast update
    try {
      const io = getIO();
      io.to(`project:${existing.task.projectId}`).emit(SOCKET_EVENTS.COMMENT_UPDATED, {
        comment: updated,
        taskId: existing.taskId,
      });
    } catch (wsError) {
      console.warn('Could not broadcast comment:updated via Socket.IO:', wsError);
    }

    return updated;
  }

  /**
   * Deletes a comment.
   */
  async deleteComment(commentId: string, userId: string, role: string) {
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { projectId: true } } },
    });

    if (!existing) {
      throw new Error('Comment not found');
    }

    // Authorization: Owner or PM/Admin
    if (existing.userId !== userId && role !== 'ADMIN' && role !== 'PRODUCT_MANAGER') {
      throw new Error('Forbidden');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Broadcast deletion
    try {
      const io = getIO();
      io.to(`project:${existing.task.projectId}`).emit(SOCKET_EVENTS.COMMENT_DELETED, {
        commentId,
        taskId: existing.taskId,
      });
    } catch (wsError) {
      console.warn('Could not broadcast comment:deleted via Socket.IO:', wsError);
    }

    return { success: true };
  }

  /**
   * Toggles emoji reaction on a comment.
   */
  async toggleReaction(commentId: string, userId: string, emoji: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { projectId: true } } },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check if reaction already exists
    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId,
          userId,
          emoji,
        },
      },
    });

    if (existing) {
      // Remove reaction
      await prisma.commentReaction.delete({
        where: { id: existing.id },
      });
    } else {
      // Add reaction
      await prisma.commentReaction.create({
        data: {
          commentId,
          userId,
          emoji,
        },
      });
    }

    // Fetch updated list of reactions for this comment
    const reactions = await prisma.commentReaction.findMany({
      where: { commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Broadcast updated reactions
    try {
      const io = getIO();
      io.to(`project:${comment.task.projectId}`).emit(SOCKET_EVENTS.REACTION_UPDATED, {
        commentId,
        taskId: comment.taskId,
        reactions,
      });
    } catch (wsError) {
      console.warn('Could not broadcast reaction:updated via Socket.IO:', wsError);
    }

    return reactions;
  }
}

export const commentsService = new CommentsService();
