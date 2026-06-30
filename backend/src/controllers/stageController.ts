import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { autoUpdateStageStatuses } from '../utils/stageUpdater';

export const getStages = async (req: Request, res: Response) => {
  try {
    await autoUpdateStageStatuses();
    
    const { projectId } = req.query;
    
    const query: any = { isArchived: false };
    if (projectId) {
      query.projectId = String(projectId);
    }
    
    const user = req.user;
    if (user && user.role !== 'PROJECT_MANAGER') {
      query.project = {
        members: {
          some: {
            userId: user.id
          }
        }
      };
    }

    const stages = await prisma.stage.findMany({
      where: query,
      include: {
        project: true,
      },
      orderBy: { startDate: 'desc' }
    });
    
    res.status(200).json(stages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
};

export const getStageById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stage = await prisma.stage.findUnique({
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

    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }

    res.status(200).json(stage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stage' });
  }
};

export const createStage = async (req: Request, res: Response) => {
  try {
    const { name, goal, startDate, endDate, status, projectId } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);

    if (start < minStartDate) {
      return res.status(400).json({ error: 'Stage start date cannot be in the past.' });
    }
    if (end < start) {
      return res.status(400).json({ error: 'Stage end date cannot be before start date.' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project && project.deadline) {
      if (end > new Date(project.deadline)) {
        return res.status(400).json({ error: 'Stage end date cannot exceed the project deadline.' });
      }
    }

    const stage = await prisma.stage.create({
      data: {
        name,
        goal,
        startDate: start,
        endDate: end,
        status: status || 'PLANNED',
        projectId,
      }
    });

    res.status(201).json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create stage' });
  }
};

export const updateStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, goal, startDate, endDate, status } = req.body;

    const currentStage = await prisma.stage.findUnique({ where: { id }, include: { project: true } });
    if (!currentStage) return res.status(404).json({ error: 'Stage not found' });

    const start = startDate ? new Date(startDate) : new Date(currentStage.startDate);
    const end = endDate ? new Date(endDate) : new Date(currentStage.endDate);
    
    if (startDate) {
      const minStartDate = new Date(Date.now() - 36 * 60 * 60 * 1000);
      if (start < minStartDate) {
        return res.status(400).json({ error: 'Stage start date cannot be in the past.' });
      }
    }

    if (end < start) {
      return res.status(400).json({ error: 'Stage end date cannot be before start date.' });
    }

    if (currentStage.project && currentStage.project.deadline) {
      if (end > new Date(currentStage.project.deadline)) {
        return res.status(400).json({ error: 'Stage end date cannot exceed the project deadline.' });
      }
    }

    const dataToUpdate: any = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (goal !== undefined) dataToUpdate.goal = goal;
    if (startDate !== undefined) dataToUpdate.startDate = start;
    if (endDate !== undefined) dataToUpdate.endDate = end;
    if (status !== undefined) dataToUpdate.status = status;

    const stage = await prisma.stage.update({
      where: { id },
      data: dataToUpdate
    });

    res.status(200).json(stage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stage' });
  }
};

export const deleteStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.stage.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Stage deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stage' });
  }
};

export const archiveStage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    const stage = await prisma.stage.update({
      where: { id },
      data: { isArchived }
    });
    res.status(200).json(stage);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to archive stage' });
  }
};
