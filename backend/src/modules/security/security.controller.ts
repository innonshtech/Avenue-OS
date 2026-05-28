import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { SessionService } from '../auth/session.service';

export class SecurityController {
  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const sessions = await SessionService.getActiveSessions(req.user.id);
      
      const formattedSessions = sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceName: s.deviceName,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === req.user?.sessionId,
      }));

      return res.status(200).json({
        success: true,
        sessions: formattedSessions,
      });
    } catch (error) {
      next(error);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const session = await prisma.userSession.findUnique({
        where: { id },
      });

      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      // Users can only revoke their own sessions (unless ADMIN)
      if (session.userId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot revoke other users sessions' });
      }

      await SessionService.revokeSession(id);

      // Log security action
      await prisma.securityAuditLog.create({
        data: {
          userId: req.user.id,
          action: 'SESSION_REVOKED',
          severity: 'MEDIUM',
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          metadata: { revokedSessionId: id },
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await SessionService.revokeAllUserSessions(req.user.id);

      // Log security action
      await prisma.securityAuditLog.create({
        data: {
          userId: req.user.id,
          action: 'LOGOUT_ALL_DEVICES',
          severity: 'HIGH',
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || '',
          userAgent: req.headers['user-agent'] || '',
        },
      });

      // Clear current user's cookies too
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logged out of all devices successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
