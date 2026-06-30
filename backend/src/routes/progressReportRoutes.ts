import { Router } from 'express';
import { getProgressReports, getTeamProgressReports, createProgressReport, deleteProgressReport, getMyLatestProgressReport, getMyProgressReports } from '../controllers/progressReportController';

const router = Router();

router.get('/my-latest', getMyLatestProgressReport);
router.get('/me', getMyProgressReports);
router.get('/', getProgressReports);
router.get('/team', getTeamProgressReports);
router.post('/', createProgressReport);
router.delete('/:id', deleteProgressReport);

export default router;
