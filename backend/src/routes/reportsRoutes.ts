import { Router } from 'express';
import { getSprintReports, getTeamReports, getProjectReports, getProductivityReports } from '../controllers/reportsController';
import { requirePermission } from '../middleware/rbac/requirePermission';


const router = Router();

router.use(requirePermission('VIEW_REPORTS'));

router.get('/sprints', getSprintReports);
router.get('/team', getTeamReports);
router.get('/projects', getProjectReports);
router.get('/productivity', getProductivityReports);

export default router;
