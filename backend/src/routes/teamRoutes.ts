import { Router } from 'express';
import { getTeam, getTeamMember, getTeamWorkload, assignProject, assignSprint, createTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/teamController';


const router = Router();



router.get('/', getTeam);
router.get('/workload', getTeamWorkload);
router.get('/:id', getTeamMember);
router.put('/:id/assign-project', assignProject);
router.put('/:id/assign-sprint', assignSprint);

router.post('/', createTeamMember);
router.put('/:id', updateTeamMember);
router.delete('/:id', deleteTeamMember);

export default router;
