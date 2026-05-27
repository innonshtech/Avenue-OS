import { Request, Response } from 'express';
import { NotificationTrackerService } from '../services/audit/notification-tracker.service';

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
