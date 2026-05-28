import { Router } from 'express';
import { SecurityController } from './security.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Apply auth middleware to all security routes
router.use(authMiddleware);

router.get('/sessions', SecurityController.getSessions);
router.delete('/sessions/:id', SecurityController.revokeSession);
router.delete('/logout-all', SecurityController.logoutAll); // we can support DELETE or POST, but DELETE /logout-all is standard. Let's support both or match DELETE as in prompt: DELETE /api/v1/security/logout-all

export default router;
