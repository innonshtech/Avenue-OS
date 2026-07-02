import { Request, Response } from 'express';
import { NotificationTrackerService } from '../services/audit/notification-tracker.service';
import prisma from '../utils/prisma';

export const getHistory = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (user.role === 'PRODUCT_MANAGER' || user.role === 'ADMIN') {
      const allNotifications = await NotificationTrackerService.getAllNotifications();
      return res.status(200).json(allNotifications);
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
};

export const getMemberNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Only allow self or PM/Admin
    if (user.id !== id && user.role !== 'PRODUCT_MANAGER' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const notifications = await NotificationTrackerService.getMemberNotifications(id);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch member notifications' });
  }
};

// In-app Notifications Controllers for Bell Icon

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true }
    });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const clearNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.notification.delete({
      where: { id, userId }
    });
    res.status(200).json({ message: 'Notification cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear notification' });
  }
};

export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.deleteMany({
      where: { userId }
    });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear all notifications' });
  }
};
