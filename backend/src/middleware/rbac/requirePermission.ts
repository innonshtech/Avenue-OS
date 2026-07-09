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
        // Only ADMIN or PROJECT_MANAGER can delete tasks
        if (role === 'PROJECT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Only Project Managers or Admins can delete tasks' });

      case 'RESOLVE_RFI':
        // Only ADMIN or PROJECT_MANAGER can resolve RFIs
        if (role === 'PROJECT_MANAGER' || role === 'PRINCIPAL_ENGINEER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Only Project Managers or Principal Engineers can resolve RFIs' });

      case 'MANAGE_TARGET':
        // Only ADMIN or PROJECT_MANAGER can manage targets
        if (role === 'PROJECT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Targets can only be managed by Project Managers or Admins' });

      case 'MANAGE_PROJECT':
        if (role === 'PROJECT_MANAGER') {
          return next();
        }
        return res.status(403).json({ success: false, message: 'Forbidden: Projects can only be managed by Project Managers or Admins' });

      default:
        next();
    }
  };
};
