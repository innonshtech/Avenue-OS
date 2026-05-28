import { Router } from 'express';
import { commentsController } from './comments.controller';

const router = Router();

// Discussion thread retrieval
router.get('/task/:taskId', commentsController.getComments);

// Create new comment or reply
router.post('/task/:taskId', commentsController.createComment);

// Update comment content
router.put('/:id', commentsController.updateComment);

// Delete comment
router.delete('/:id', commentsController.deleteComment);

// Toggle emoji reaction
router.post('/:id/reactions', commentsController.toggleReaction);

export default router;
