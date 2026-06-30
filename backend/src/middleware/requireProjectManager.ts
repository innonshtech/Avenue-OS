import { Request, Response, NextFunction } from 'express';

export const requireProjectManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'PROJECT_MANAGER') {
    return res.status(403).json({ error: 'Access denied. Requires PROJECT_MANAGER role.' });
  }
  next();
};
