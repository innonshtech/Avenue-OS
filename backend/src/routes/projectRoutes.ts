import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, archiveProject } from '../controllers/projectController';

import { requirePermission } from '../middleware/rbac/requirePermission';

const router = Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requirePermission('CREATE_PROJECT'), createProject);
router.put('/:id', requirePermission('EDIT_PROJECT'), updateProject);
router.delete('/:id', requirePermission('DELETE_PROJECT'), deleteProject);
router.patch('/:id/archive', requirePermission('EDIT_PROJECT'), archiveProject);

export default router;
