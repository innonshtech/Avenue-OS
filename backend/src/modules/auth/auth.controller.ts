import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';

const COOKIE_SECURE = process.env.NODE_ENV === 'production';

function parseUserAgent(uaString: string | undefined): { browser: string; device: string } {
  if (!uaString) return { browser: 'Unknown', device: 'Unknown' };
  let browser = 'Unknown Browser';
  let device = 'Unknown OS';

  if (/chrome|crios/i.test(uaString)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(uaString)) browser = 'Firefox';
  else if (/safari/i.test(uaString)) browser = 'Safari';
  else if (/opr\//i.test(uaString)) browser = 'Opera';
  else if (/edg/i.test(uaString)) browser = 'Edge';

  if (/windows/i.test(uaString)) device = 'Windows';
  else if (/macintosh|mac os x/i.test(uaString)) device = 'macOS';
  else if (/linux/i.test(uaString)) device = 'Linux';
  else if (/iphone|ipad|ipod/i.test(uaString)) device = 'iOS';
  else if (/android/i.test(uaString)) device = 'Android';

  return { browser, device };
}

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';
    const { email, password } = req.body;

    const { browser, device } = parseUserAgent(userAgent);
    const deviceName = `${device} - ${browser}`;

    try {
      // 1. Detect multiple failed attempts
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const failedCount = await prisma.loginHistory.count({
        where: {
          email,
          status: 'FAILED',
          loggedInAt: { gte: fifteenMinsAgo },
        },
      });

      if (failedCount >= 15) {
        // Log locked account/suspicious activity
        await prisma.securityAuditLog.create({
          data: {
            action: 'SUSPICIOUS_BRUTE_FORCE',
            severity: 'HIGH',
            ipAddress,
            userAgent,
            metadata: { email, message: 'Too many failed login attempts.' },
          },
        });
        
        // Log history as locked
        await prisma.loginHistory.create({
          data: {
            email,
            ipAddress,
            userAgent,
            deviceName,
            status: 'LOCKED',
            failureReason: 'Account temporarily locked due to excessive failed attempts',
          },
        });

        return res.status(429).json({
          success: false,
          message: 'Too many failed login attempts. Please try again in 15 minutes.',
        });
      }

      // 2. Validate credentials
      let user;
      try {
        user = await AuthService.validateCredentials(email, password);
      } catch (err: any) {
        // Log failure
        await prisma.loginHistory.create({
          data: {
            email,
            ipAddress,
            userAgent,
            deviceName,
            status: 'FAILED',
            failureReason: err.message,
          },
        });

        // If this failure makes it 5, log suspicious activity
        if (failedCount + 1 >= 5) {
          await prisma.securityAuditLog.create({
            data: {
              action: 'SUSPICIOUS_BRUTE_FORCE',
              severity: 'HIGH',
              ipAddress,
              userAgent,
              metadata: { email, message: 'Brute-force limit reached.' },
            },
          });
        }

        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // 3. Check for new IP or device (Suspicious Login Detection)
      const previousLogin = await prisma.loginHistory.findFirst({
        where: { userId: user.id, status: 'SUCCESS' },
        orderBy: { loggedInAt: 'desc' },
      });

      if (previousLogin) {
        const isNewIP = previousLogin.ipAddress !== ipAddress;
        const isNewDevice = previousLogin.userAgent !== userAgent;
        if (isNewIP || isNewDevice) {
          await prisma.securityAuditLog.create({
            data: {
              userId: user.id,
              action: isNewIP ? 'SUSPICIOUS_NEW_IP' : 'SUSPICIOUS_NEW_DEVICE',
              severity: 'MEDIUM',
              ipAddress,
              userAgent,
              metadata: {
                message: isNewIP ? 'Login from a new IP address detected' : 'Login from a new device/browser detected',
                previousIp: previousLogin.ipAddress,
                currentIp: ipAddress,
                previousAgent: previousLogin.userAgent,
                currentAgent: userAgent,
              },
            },
          });
        }
      }

      // 4. Generate refresh token & session
      // Create session first to get session ID
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: '', // Placeholder, will update below
          ipAddress,
          userAgent,
          deviceName,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      const refreshToken = TokenService.generateRefreshToken({
        userId: user.id,
        sessionId: session.id,
      });

      // Update session with hashed refresh token
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.userSession.update({
        where: { id: session.id },
        data: { refreshTokenHash: hash },
      });

      // 5. Generate access token
      const accessToken = TokenService.generateAccessToken({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      // 6. Set Cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // 7. Log login history & security audit
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: user.email,
          ipAddress,
          userAgent,
          deviceName,
          status: 'SUCCESS',
        },
      });

      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          severity: 'LOW',
          ipAddress,
          userAgent,
          metadata: { deviceName },
        },
      });

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No refresh token provided' });
    }

    try {
      // 1. Verify Refresh Token
      const decoded = TokenService.verifyRefreshToken(refreshToken);
      
      // 2. Generate new tokens
      const newRefreshToken = TokenService.generateRefreshToken({
        userId: decoded.userId,
        sessionId: decoded.sessionId,
      });

      // 3. Rotate session in DB (detects token abuse)
      try {
        const rotated = await SessionService.rotateSession({
          sessionId: decoded.sessionId,
          oldRefreshToken: refreshToken,
          newRefreshToken: newRefreshToken,
        });

        if (!rotated) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Session expired or invalid' });
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user || !user.isActive) {
          return res.status(401).json({ success: false, message: 'Unauthorized: User inactive' });
        }

        const newAccessToken = TokenService.generateAccessToken({
          userId: user.id,
          role: user.role,
          email: user.email,
        });

        // 4. Set cookies
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: COOKIE_SECURE,
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000,
        });

        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: COOKIE_SECURE,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ success: true });
      } catch (rotationErr: any) {
        // Rotation service handles revoking sessions and logging suspicious attempts
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: Session security compromised',
        });
      }
    } catch (err) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid refresh token' });
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    const refreshToken = req.cookies.refreshToken;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    try {
      if (refreshToken) {
        try {
          const decoded = TokenService.verifyRefreshToken(refreshToken);
          await SessionService.revokeSession(decoded.sessionId);

          await prisma.securityAuditLog.create({
            data: {
              userId: decoded.userId,
              action: 'LOGOUT',
              severity: 'LOW',
              ipAddress,
              userAgent,
            },
          });
        } catch (err) {
          // Token might be expired or malformed, continue with clearing cookies
        }
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          avatar: true,
        },
      });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
}
