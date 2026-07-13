import { Router } from 'express';
import { getOverview, getSprintsAnalytics, getTeamWorkload, getBlockersAnalytics, getProductivityTimeline, getBurndown } from '../controllers/analyticsController';
import { requirePermission } from '../middleware/rbac/requirePermission';


const router = Router();

router.use(requirePermission('VIEW_ANALYTICS'));

router.get('/overview', getOverview);
router.get('/sprints', getSprintsAnalytics);
router.get('/team-workload', getTeamWorkload);
router.get('/blockers', getBlockersAnalytics);
router.get('/productivity', getProductivityTimeline);
router.get('/burndown', getBurndown);

export default router;
