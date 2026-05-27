import { Router } from 'express';
import { getHistory, getMemberNotifications } from '../controllers/notificationController';

const router = Router();

router.get('/history', getHistory);
router.get('/member/:id', getMemberNotifications);

export default router;
