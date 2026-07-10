import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from './auth.controller';
import { authMiddleware } from './auth.middleware';

const router = Router();

// Rate limiter for authentication routes: max 5 requests per 15 minutes
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for active testing/development
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/public-users', AuthController.getPublicUsers);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', authRateLimiter, AuthController.refresh);
router.post('/logout', AuthController.logout);
router.get('/me', authMiddleware, AuthController.me);

router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword);
router.post('/change-password', authMiddleware, AuthController.changePassword);

export default router;
