import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { autoUpdateSprintStatuses } from '../utils/sprintUpdater';

export const getSprints = async (req: Request, res: Response) => {
  try {
    await autoUpdateSprintStatuses();
    
    const { projectId } = req.query;
    
    const query: any = { isArchived: false };
    if (projectId) {
      query.projectId = String(projectId);
    }
    
    const user = req.user;
    if (user && user.role !== 'PRODUCT_MANAGER') {
      query.project = {
        members: {
          some: {
            userId: user.id
          }
        }
      };
    }

    const sprints = await prisma.sprint.findMany({
      where: query,
      include: {
        project: true,
      },
      orderBy: { startDate: 'desc' }
    });
    
    res.status(200).json(sprints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
};

export const getSprintById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sprint = await prisma.sprint.findUnique({
      where: { id },
      include: {
        project: true,
        tasks: {
          include: {
            assignee: true,
            blockers: true,
          }
        },
        standups: true,
      }
    });

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    res.status(200).json(sprint);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sprint' });
  }
};

export const createSprint = async (req: Request, res: Response) => {
  try {
    const { name, goal, startDate, endDate, status, projectId } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Timezone-safe check: allow start date if it's within the last 36 hours to account for timezone differences
    const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);

    if (start < minStartDate) {
      return res.status(400).json({ error: 'Sprint start date cannot be in the past.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'Sprint end date cannot be before start date.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.deadline) {
      if (end > new Date(project.deadline)) {
        return res.status(400).json({ error: 'Sprint end date cannot exceed the project deadline.' });
      }
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: start,
        endDate: end,
        status: status || 'PLANNED',
        projectId,
      }
    });

    res.status(201).json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create sprint' });
  }
};

export const updateSprint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    const currentSprint = await prisma.sprint.findUnique({ where: { id }, include: { project: true } });
    if (!currentSprint) return res.status(404).json({ error: 'Sprint not found' });

    const start = startDate ? new Date(startDate) : new Date(currentSprint.startDate);
    const end = endDate ? new Date(endDate) : new Date(currentSprint.endDate);
    
    // Only validate start date against today if it's being updated
    if (startDate) {
      const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);
      if (start < minStartDate) {
        return res.status(400).json({ error: 'Sprint start date cannot be in the past.' });
      }
    }

    if (end < start) {
      return res.status(400).json({ error: 'Sprint end date cannot be before start date.' });
    }

    if (currentSprint.project && currentSprint.project.deadline) {
      if (end > new Date(currentSprint.project.deadline)) {
        return res.status(400).json({ error: 'Sprint end date cannot exceed the project deadline.' });
      }
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (goal !== undefined) dataToUpdate.goal = goal;
    if (startDate !== undefined) dataToUpdate.startDate = start;
    if (endDate !== undefined) dataToUpdate.endDate = end;
    if (status !== undefined) dataToUpdate.status = status;

    const sprint = await prisma.sprint.update({
      where: { id },
      data: dataToUpdate
    });

    res.status(200).json(sprint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update sprint' });
  }
};

export const deleteSprint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.sprint.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
};

export const archiveSprint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const sprint = await prisma.sprint.update({
      where: { id },
      data: { isArchived }
    });
    res.status(200).json(sprint);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to archive sprint' });
  }
};
