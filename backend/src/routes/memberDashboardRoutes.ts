import { Router } from 'express';
import {
  getMemberOverview,
  getMemberSummary,
  getTodayFocus,
  createTodayFocus,
  updateTodayFocus
} from '../controllers/memberDashboardController';

const router = Router();

// Member Overview KPI API
router.get('/dashboard/member-overview', getMemberOverview);
router.get('/dashboard/member-summary', getMemberSummary);

// Today Focus APIs
router.get('/focus', getTodayFocus);
router.post('/focus', createTodayFocus);
router.put('/focus/:id', updateTodayFocus);

export default router;
