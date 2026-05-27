import prisma from '../../utils/prisma';
import { NotificationType } from '@prisma/client';

export class InAppNotificationService {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    linkUrl?: string
  ) {
    try {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          linkUrl,
        },
      });
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
      return null;
    }
  }
}

export const inAppNotificationService = new InAppNotificationService();
