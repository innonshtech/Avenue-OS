import crypto from 'crypto';
import prisma from '../../utils/prisma';

export class SessionService {
  private static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async createSession(params: {
    userId: string;
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const tokenHash = this.hashToken(params.refreshToken);

    return prisma.userSession.create({
      data: {
        userId: params.userId,
        refreshTokenHash: tokenHash,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceName: params.deviceName,
        expiresAt,
      },
    });
  }

  static async findSession(id: string) {
    return prisma.userSession.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  static async rotateSession(params: {
    sessionId: string;
    oldRefreshToken: string;
    newRefreshToken: string;
  }) {
    const session = await prisma.userSession.findUnique({
      where: { id: params.sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    const oldHash = this.hashToken(params.oldRefreshToken);
    if (session.refreshTokenHash !== oldHash) {
      // Refresh token mismatch! Potential token theft / abuse.
      // Revoke all sessions for this user for safety
      await this.revokeAllUserSessions(session.userId);
      
      // Log suspicious activity
      await prisma.securityAuditLog.create({
        data: {
          userId: session.userId,
          action: 'SUSPICIOUS_TOKEN_REUSE',
          severity: 'HIGH',
          metadata: {
            sessionId: params.sessionId,
            message: 'Refresh token reuse detected. Revoking all sessions for this user.',
          },
        },
      });

      throw new Error('Token abuse detected');
    }

    const newHash = this.hashToken(params.newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.userSession.update({
      where: { id: params.sessionId },
      data: {
        refreshTokenHash: newHash,
        expiresAt,
      },
    });
  }

  static async revokeSession(id: string) {
    return prisma.userSession.update({
      where: { id },
      data: { isActive: false },
    });
  }

  static async revokeAllUserSessions(userId: string) {
    return prisma.userSession.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  static async getActiveSessions(userId: string) {
    return prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
