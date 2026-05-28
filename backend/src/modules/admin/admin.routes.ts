import { Router } from 'express';
import { extractUserContext } from '../../middleware/authMiddleware';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as adminController from './admin.controller';

const router = Router();

// Apply auth and admin check to all admin routes
router.use(extractUserContext);
router.use(requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/projects', adminController.getProjects);
router.get('/sprints', adminController.getSprints);
router.get('/team-performance', adminController.getTeamPerformance);
router.get('/workload', adminController.getWorkload);
router.get('/blockers', adminController.getBlockers);
router.get('/activity-feed', adminController.getActivityFeed);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/intelligence', adminController.getIntelligence);
router.get('/security-metrics', adminController.getSecurityMetrics);

export default router;
