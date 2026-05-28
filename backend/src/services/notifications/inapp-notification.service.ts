import prisma from '../../utils/prisma';
import { NotificationType } from '@prisma/client';
import { getIO } from '../../sockets/socket.server';
import { SOCKET_EVENTS } from '../../sockets/socket.events';

export class InAppNotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string
  ) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          linkUrl,
        },
      });

      // Emit real-time notification to the user via Socket.IO
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
      } catch (wsError) {
        // Log WebSocket emission failure but do not crash the service
        console.warn('Could not emit live notification via Socket.IO:', wsError);
      }

      return notification;
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
      return null;
    }
  }
}

export const inAppNotificationService = new InAppNotificationService();
