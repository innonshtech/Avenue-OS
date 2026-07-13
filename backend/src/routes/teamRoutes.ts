import { Router } from 'express';
import { getTeam, getTeamMember, getTeamWorkload, assignProject, assignSprint, createTeamMember, updateTeamMember, deleteTeamMember } from '../controllers/teamController';
import { validateRequest } from '../validators/validate';
import { createUserSchema } from '../validators/user.validator';
import { requirePermission } from '../middleware/rbac/requirePermission';

const router = Router();

router.get('/', requirePermission('VIEW_TEAM'), getTeam);
router.get('/workload', requirePermission('VIEW_TEAM'), getTeamWorkload);
router.get('/:id', requirePermission('VIEW_TEAM'), getTeamMember);
router.put('/:id/assign-project', requirePermission('MANAGE_USERS'), assignProject);
router.put('/:id/assign-sprint', requirePermission('MANAGE_USERS'), assignSprint);

router.post('/', requirePermission('MANAGE_USERS'), validateRequest(createUserSchema), createTeamMember);
router.put('/:id', requirePermission('MANAGE_USERS'), updateTeamMember);
router.delete('/:id', requirePermission('MANAGE_USERS'), deleteTeamMember);

export default router;
