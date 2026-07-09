import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTask, deleteTask, archiveTask, restoreTask, getMyTasks, addBlocker, resolveBlocker, addQuickUpdate, moveSprint } from '../controllers/taskController';
import { commentsController } from '../modules/comments/comments.controller';
import { addAttachment, deleteAttachment } from '../controllers/attachmentController';
import { addSubtask, updateSubtask, deleteSubtask } from '../controllers/subtaskController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

import { requirePermission } from '../middleware/rbac/requirePermission';
import { validateRequest } from '../validators/validate';
import { createTaskSchema, updateTaskSchema, resolveBlockerSchema, addCommentSchema } from '../validators/task.validator';

const router = Router();

router.get('/my-tasks', getMyTasks);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', validateRequest(createTaskSchema), createTask);
router.put('/:id', validateRequest(updateTaskSchema), updateTask);
router.delete('/:id', requirePermission('DELETE_TASK'), deleteTask);
router.patch('/:id/archive', archiveTask);
router.patch('/:id/restore', restoreTask);
router.patch('/:id/move-target', moveSprint);
router.post('/:id/rfi', addBlocker);
router.patch('/:id/rfi/:blockerId/resolve', requirePermission('RESOLVE_RFI'), validateRequest(resolveBlockerSchema), resolveBlocker);
router.post('/:id/update', addQuickUpdate);

// Comments (delegated to the new commentsController)
router.get('/:taskId/comments', commentsController.getComments);
router.post('/:taskId/comments', validateRequest(addCommentSchema), commentsController.createComment);
router.put('/comments/:id', commentsController.updateComment);
router.delete('/comments/:id', commentsController.deleteComment);

// Attachments
router.post('/:taskId/attachments', upload.single('file'), addAttachment);
router.delete('/attachments/:id', deleteAttachment);

// Subtasks
router.post('/:taskId/subtasks', addSubtask);
router.put('/subtasks/:id', updateSubtask);
router.delete('/subtasks/:id', deleteSubtask);

export default router;
