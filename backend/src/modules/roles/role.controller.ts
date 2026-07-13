import { Request, Response } from 'express';
import prisma from '../../utils/prisma';

export class RoleController {
  static async getAllRoles(req: Request, res: Response) {
    try {
      const roles = await prisma.systemRole.findMany({
        orderBy: { name: 'asc' }
      });
      return res.status(200).json({ success: true, data: roles });
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch roles', error: error.message });
    }
  }

  static async createRole(req: Request, res: Response) {
    try {
      const { name, description, permissions } = req.body;
      
      if (!name) {
        return res.status(400).json({ success: false, message: 'Role name is required' });
      }

      const existingRole = await prisma.systemRole.findUnique({ where: { name: name.toUpperCase() } });
      if (existingRole) {
        return res.status(400).json({ success: false, message: 'Role already exists' });
      }

      const newRole = await prisma.systemRole.create({
        data: {
          name: name.toUpperCase(),
          description,
          permissions: permissions || []
        }
      });

      return res.status(201).json({ success: true, data: newRole });
    } catch (error: any) {
      console.error('Error creating role:', error);
      return res.status(500).json({ success: false, message: 'Failed to create role', error: error.message });
    }
  }

  static async updateRolePermissions(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const { permissions, description } = req.body;

      const existingRole = await prisma.systemRole.findUnique({ where: { name } });
      
      if (!existingRole) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (existingRole.isSystem && name === 'ADMIN') {
        return res.status(400).json({ success: false, message: 'Cannot modify ADMIN system role permissions' });
      }

      const updatedRole = await prisma.systemRole.update({
        where: { name },
        data: {
          permissions: permissions !== undefined ? permissions : existingRole.permissions,
          description: description !== undefined ? description : existingRole.description
        }
      });

      return res.status(200).json({ success: true, data: updatedRole });
    } catch (error: any) {
      console.error('Error updating role:', error);
      return res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
    }
  }

  static async deleteRole(req: Request, res: Response) {
    try {
      const { name } = req.params;

      const existingRole = await prisma.systemRole.findUnique({ where: { name } });
      if (!existingRole) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (existingRole.isSystem) {
        return res.status(400).json({ success: false, message: 'Cannot delete a system role' });
      }

      // Ensure no users are currently assigned to this role before deleting
      const usersWithRole = await prisma.user.count({ where: { role: name } });
      if (usersWithRole > 0) {
        return res.status(400).json({ success: false, message: `Cannot delete role. ${usersWithRole} users are currently assigned to this role.` });
      }

      await prisma.systemRole.delete({ where: { name } });

      return res.status(200).json({ success: true, message: 'Role deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting role:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete role', error: error.message });
    }
  }
}
