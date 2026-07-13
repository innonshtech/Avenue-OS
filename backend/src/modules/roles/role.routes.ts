import { Router } from 'express';
import { RoleController } from './role.controller';
import { requireAuth } from '../../middleware/rbac/requireAuth';
import { requirePermission } from '../../middleware/rbac/requirePermission';

const router = Router();

// All role management requires ADMIN (or MANAGE_USERS feature flag if we generalize it, but ADMIN is safer for now)
router.use(requireAuth);
// Hardcode to require ADMIN role by checking req.user.role in a quick middleware or using requirePermission
router.use((req, res, next) => {
  if (req.user?.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Only Admins can manage roles' });
});

router.get('/', RoleController.getAllRoles);
router.post('/', RoleController.createRole);
router.put('/:name/permissions', RoleController.updateRolePermissions);
router.delete('/:name', RoleController.deleteRole);

export default router;
