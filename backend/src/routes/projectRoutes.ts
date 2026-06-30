import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, archiveProject } from '../controllers/projectController';

import { requireProjectManager } from '../middleware/requireProjectManager';

const router = Router();

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', requireProjectManager, createProject);
router.put('/:id', requireProjectManager, updateProject);
router.delete('/:id', requireProjectManager, deleteProject);
router.patch('/:id/archive', requireProjectManager, archiveProject);

export default router;
