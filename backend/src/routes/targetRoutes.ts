import { Router } from 'express';
import { getTargets, getTargetById, createTarget, updateTarget, deleteTarget, archiveTarget } from '../controllers/targetController';

import { requireProjectManager } from '../middleware/requireProjectManager';
import { validateRequest } from '../validators/validate';
import { createTargetSchema, updateTargetSchema } from '../validators/target.validator';

const router = Router();

router.get('/', getTargets);
router.get('/:id', getTargetById);
router.post('/', requireProjectManager, validateRequest(createTargetSchema), createTarget);
router.put('/:id', requireProjectManager, validateRequest(updateTargetSchema), updateTarget);
router.delete('/:id', requireProjectManager, deleteTarget);
router.patch('/:id/archive', requireProjectManager, archiveTarget);

export default router;
