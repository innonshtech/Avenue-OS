import { Router } from 'express';
import { getStages, getStageById, createStage, updateStage, deleteStage, archiveStage } from '../controllers/stageController';

import { requireProjectManager } from '../middleware/requireProjectManager';
import { validateRequest } from '../validators/validate';
import { createStageSchema, updateStageSchema } from '../validators/stage.validator';

const router = Router();

router.get('/', getStages);
router.get('/:id', getStageById);
router.post('/', requireProjectManager, validateRequest(createStageSchema), createStage);
router.put('/:id', requireProjectManager, validateRequest(updateStageSchema), updateStage);
router.delete('/:id', requireProjectManager, deleteStage);
router.patch('/:id/archive', requireProjectManager, archiveStage);

export default router;
