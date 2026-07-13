import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';

export const requirePermission = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Authentication required' });
      }

      const { role } = req.user;

      // ADMIN has full permission access
      if (role === 'ADMIN') {
        return next();
      }

      // Fetch dynamic role permissions from DB
      const systemRole = await prisma.systemRole.findUnique({
        where: { name: role }
      });

      if (!systemRole) {
        return res.status(403).json({ success: false, message: `Forbidden: Role '${role}' not found in system` });
      }

      if (systemRole.permissions.includes(action)) {
        return next();
      }

      return res.status(403).json({ success: false, message: `Forbidden: Your role does not have the '${action}' feature enabled` });
    } catch (error) {
      console.error('Error in requirePermission middleware:', error);
      return res.status(500).json({ success: false, message: 'Internal server error checking permissions' });
    }
  };
};
