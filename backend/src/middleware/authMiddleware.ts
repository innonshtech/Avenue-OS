import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../modules/auth/token.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        sessionId?: string;
      };
    }
  }
}

export const extractUserContext = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const decoded = TokenService.verifyAccessToken(token);
      req.user = {
        id: decoded.userId,
        role: decoded.role,
        sessionId: decoded.sessionId,
      };
    } catch (error) {
      // Access token expired or invalid, do not set user context
    }
  }

  next();
};

