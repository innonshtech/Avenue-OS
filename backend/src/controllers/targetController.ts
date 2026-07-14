import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hasPermission } from '../utils/permissionHelper';
import { autoUpdateTargetStatuses } from '../utils/targetUpdater';

export const getTargets = async (req: Request, res: Response) => {
  try {
    await autoUpdateTargetStatuses();
    
    const { projectId } = req.query;
    
    const query: any = { isArchived: false };
    if (projectId) {
      query.projectId = String(projectId);
    }
    
    const user = req.user;
    const canManageProjects = user ? await hasPermission(user.role, 'CREATE_PROJECT') : false;
    if (user && !canManageProjects) {
      query.project = {
        members: {
          some: {
            userId: user.id
          }
        }
      };
    }

    const targets = await prisma.target.findMany({
      where: query,
      include: {
        project: true,
      },
      orderBy: { startDate: 'desc' }
    });
    
    res.status(200).json(targets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch targets' });
  }
};

export const getTargetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const target = await prisma.target.findUnique({
      where: { id },
      include: {
        project: true,
        tasks: {
          include: {
            assignee: true,
            rfis: true,
          }
        },
        progressReports: true,
      }
    });

    if (!target) {
      return res.status(404).json({ error: 'Target not found' });
    }

    res.status(200).json(target);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch target' });
  }
};

export const createTarget = async (req: Request, res: Response) => {
  try {
    const { name, goal, startDate, endDate, status, budgetedHours, projectId } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);

    if (start < minStartDate) {
      return res.status(400).json({ error: 'Target start date cannot be in the past.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'Target end date cannot be before start date.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.deadline) {
      if (end > new Date(project.deadline)) {
        return res.status(400).json({ error: 'Target end date cannot exceed the project deadline.' });
      }
    }

    const target = await prisma.target.create({
      data: {
        name,
        goal,
        startDate: start,
        endDate: end,
        status: status || 'PLANNED',
        budgetedHours: budgetedHours ? parseFloat(budgetedHours) : null,
        projectId,
      },
      include: {
        project: {
          select: { ownerId: true }
        }
      }
    });

    // Auto-create Target Chat Channel
    await prisma.chatChannel.create({
      data: {
        name: `target-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        description: `Discussion for ${name} target`,
        type: 'TARGET',
        projectId,
        targetId: target.id,
        createdById: target.project.ownerId,
      }
    });

    res.status(201).json(target);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create target' });
  }
};

export const updateTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate, status, budgetedHours } = req.body;

    const currentTarget = await prisma.target.findUnique({ where: { id }, include: { project: true } });
    if (!currentTarget) return res.status(404).json({ error: 'Target not found' });

    const start = startDate ? new Date(startDate) : new Date(currentTarget.startDate);
    const end = endDate ? new Date(endDate) : new Date(currentTarget.endDate);
    
    if (startDate) {
      const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);
      if (start < minStartDate) {
        return res.status(400).json({ error: 'Target start date cannot be in the past.' });
      }
    }

    if (end < start) {
      return res.status(400).json({ error: 'Target end date cannot be before start date.' });
    }

    if (currentTarget.project && currentTarget.project.deadline) {
      if (end > new Date(currentTarget.project.deadline)) {
        return res.status(400).json({ error: 'Target end date cannot exceed the project deadline.' });
      }
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (goal !== undefined) dataToUpdate.goal = goal;
    if (startDate !== undefined) dataToUpdate.startDate = start;
    if (endDate !== undefined) dataToUpdate.endDate = end;
    if (status !== undefined) dataToUpdate.status = status;
    if (budgetedHours !== undefined) dataToUpdate.budgetedHours = budgetedHours ? parseFloat(budgetedHours) : null;

    const target = await prisma.target.update({
      where: { id },
      data: dataToUpdate
    });

    res.status(200).json(target);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update target' });
  }
};

export const deleteTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.target.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Target deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete target' });
  }
};

export const archiveTarget = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const target = await prisma.target.update({
      where: { id },
      data: { isArchived }
    });
    res.status(200).json(target);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to archive target' });
  }
};
