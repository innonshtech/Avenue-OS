import { Router } from 'express';
import { 
  getHistory, 
  getMemberNotifications, 
  getMyNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../controllers/notificationController';

const router = Router();

router.get('/history', getHistory);
router.get('/member/:id', getMemberNotifications);

// In-app notifications
router.get('/', getMyNotifications);
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

export default router;
