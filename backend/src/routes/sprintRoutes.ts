import { Router } from 'express';
import { getSprints, getSprintById, createSprint, updateSprint, deleteSprint, archiveSprint } from '../controllers/sprintController';

import { requireProductManager } from '../middleware/requireProductManager';
import { validateRequest } from '../validators/validate';
import { createSprintSchema, updateSprintSchema } from '../validators/sprint.validator';

const router = Router();

router.get('/', getSprints);
router.get('/:id', getSprintById);
router.post('/', requireProductManager, validateRequest(createSprintSchema), createSprint);
router.put('/:id', requireProductManager, validateRequest(updateSprintSchema), updateSprint);
router.delete('/:id', requireProductManager, deleteSprint);
router.patch('/:id/archive', requireProductManager, archiveSprint);

export default router;
