import { Request, Response, NextFunction } from 'express';
import { TokenService } from './token.service';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Access token missing' });
  }

  try {
    const decoded = TokenService.verifyAccessToken(token);
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      sessionId: decoded.sessionId,
    };
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired access token' });
  }
};
