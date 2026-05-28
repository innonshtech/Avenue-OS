import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getIO } from '../sockets/socket.server';
import { SOCKET_EVENTS } from '../sockets/socket.events';

export const getStandups = async (req: Request, res: Response) => {
  try {
    const { sprintId, userId } = req.query;
    
    const query: any = {};
    if (sprintId) query.sprintId = String(sprintId);
    if (userId) query.userId = String(userId);

    const standups = await prisma.dailyStandup.findMany({
      where: query,
      include: {
        user: true,
        sprint: {
          include: {
            project: true
          }
        },
      },
      orderBy: { date: 'desc' }
    });
    
    res.status(200).json(standups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch standups' });
  }
};

export const getMyStandups = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { sprintId } = req.query;
    
    const query: any = { userId };
    if (sprintId) query.sprintId = String(sprintId);

    const standups = await prisma.dailyStandup.findMany({
      where: query,
      include: {
        user: true,
        task: true,
        sprint: {
          include: {
            project: true
          }
        },
        reportedBlockers: true
      },
      orderBy: { date: 'desc' }
    });
    
    res.status(200).json(standups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your standups' });
  }
};

export const getTeamStandups = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'PRODUCT_MANAGER') {
      return res.status(403).json({ error: 'Forbidden: PM access required' });
    }

    const { sprintId } = req.query;
    
    const query: any = {};
    if (sprintId) query.sprintId = String(sprintId);

    const standups = await prisma.dailyStandup.findMany({
      where: query,
      include: {
        user: true,
        task: true,
        reportedBlockers: true,
        sprint: {
          include: {
            project: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json(standups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team standups' });
  }
};

export const createStandup = async (req: Request, res: Response) => {
  try {
    const { yesterday, today, blockers, userId, sprintId, taskId, blockerDetails } = req.body;

    const standup = await prisma.dailyStandup.create({
      data: {
        yesterday,
        today,
        blockers,
        userId,
        sprintId,
        taskId,
      },
      include: {
        user: true,
        task: true
      }
    });

    // If there is a blocker and details are provided, create it
    if (blockers && blockerDetails) {
      await prisma.blocker.create({
        data: {
          description: blockerDetails.description || blockers,
          severity: blockerDetails.severity || 'MEDIUM',
          type: blockerDetails.type || 'TECHNICAL',
          estimatedResolutionDate: blockerDetails.estimatedResolutionDate ? new Date(blockerDetails.estimatedResolutionDate) : null,
          helperId: blockerDetails.helperId,
          taskId: taskId || blockerDetails.taskId,
          reporterId: userId,
          standupId: standup.id,
        }
      });
    }

    // Create activity log if task is linked
    if (taskId) {
      await prisma.taskActivity.create({
        data: {
          taskId,
          userId,
          action: 'STANDUP_UPDATE',
          newValue: today.substring(0, 50)
        }
      });
    }

    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      userId,
      'STANDUP_SUBMITTED',
      'STANDUP',
      standup.id,
      `Daily Standup Submitted`,
      `Today: ${today.substring(0, 100)}${today.length > 100 ? '...' : ''}`
    );

    let projectId: string | null = null;
    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId },
        select: { projectId: true }
      });
      projectId = sprint?.projectId || null;
    }

    try {
      const io = getIO();
      const payload = {
        standup,
        projectId,
        sprintId
      };
      io.to('organization').emit(SOCKET_EVENTS.STANDUP_SUBMITTED, payload);
      if (projectId) {
        io.to(`project:${projectId}`).emit(SOCKET_EVENTS.STANDUP_SUBMITTED, payload);
      }
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(201).json(standup);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit standup' });
  }
};

export const deleteStandup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.dailyStandup.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Standup deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete standup' });
  }
};

export const getMyLatestStandup = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const standup = await prisma.dailyStandup.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    res.status(200).json(standup);
  } catch(error) {
    res.status(500).json({ error: 'Failed to fetch latest standup' });
  }
};
