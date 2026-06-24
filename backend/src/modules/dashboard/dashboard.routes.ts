import { Router } from 'express';
import { getSprintHealth, getTeamWorkload, getBoardSnapshot, getStandupMonitoring, getPMSummary } from './dashboard.controller';

const router = Router();

router.get('/sprint-health', getSprintHealth);
router.get('/team-workload', getTeamWorkload);
router.get('/board-snapshot', getBoardSnapshot);
router.get('/standup-monitoring', getStandupMonitoring);
router.get('/pm-summary', getPMSummary);

export default router;
