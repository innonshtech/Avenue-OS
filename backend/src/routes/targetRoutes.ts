import { Router } from 'express';
import { getTargets, getTargetById, createTarget, updateTarget, deleteTarget, archiveTarget } from '../controllers/targetController';

import { requirePermission } from '../middleware/rbac/requirePermission';
import { validateRequest } from '../validators/validate';
import { createTargetSchema, updateTargetSchema } from '../validators/target.validator';

const router = Router();

router.get('/', getTargets);
router.get('/:id', getTargetById);
router.post('/', requirePermission('EDIT_PROJECT'), validateRequest(createTargetSchema), createTarget);
router.put('/:id', requirePermission('EDIT_PROJECT'), validateRequest(updateTargetSchema), updateTarget);
router.delete('/:id', requirePermission('EDIT_PROJECT'), deleteTarget);
router.patch('/:id/archive', requirePermission('EDIT_PROJECT'), archiveTarget);

export default router;
