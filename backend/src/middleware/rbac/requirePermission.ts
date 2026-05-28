import { Request, Response, NextFunction } from 'express';

export const requirePermission = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required' });
    }

    const { role } = req.user;

    // ADMIN has full permission access
    if (role === 'ADMIN') {
      return next();
    }

    switch (action) {
      case 'DELETE_TASK':
        // Only ADMIN or PRODUCT_MANAGER can delete tasks
        if (role === 'PRODUCT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Only Product Managers or Admins can delete tasks' });

      case 'RESOLVE_BLOCKER':
        // Only ADMIN or PRODUCT_MANAGER can resolve blockers
        if (role === 'PRODUCT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Members cannot resolve blockers' });

      case 'MANAGE_SPRINT':
        // Only ADMIN or PRODUCT_MANAGER can manage sprints
        if (role === 'PRODUCT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Sprints can only be managed by Product Managers or Admins' });

      case 'MANAGE_PROJECT':
        if (role === 'PRODUCT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Projects can only be managed by Product Managers or Admins' });

      default:
        next();
    }
  };
};
