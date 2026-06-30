import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper to get current active stage for user if not provided
const resolveStageId = async (stageId?: string): Promise<string | null> => {
  if (stageId) return stageId;
  const activeStage = await prisma.stage.findFirst({
    where: { status: 'ACTIVE' }
  });
  return activeStage?.id || null;
};

export const getSprintSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stageId = await resolveStageId(req.query.sprintId as string || req.query.stageId as string);
    if (!stageId) return res.status(404).json({ error: 'No active stage found' });

    const stage = await prisma.stage.findUnique({
      where: { id: stageId }
    });
    if (!stage) return res.status(404).json({ error: 'Stage not found' });

    const now = new Date();
    const totalDays = Math.ceil((stage.endDate.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.ceil((now.getTime() - stage.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - elapsedDays);
    const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100)) || 0;

    res.status(200).json({
      id: stage.id,
      name: stage.name,
      totalDays,
      elapsedDays,
      daysRemaining,
      progress
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stage summary' });
  }
};

export const getCompletedTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stageId = await resolveStageId(req.query.sprintId as string || req.query.stageId as string);
    if (!stageId) return res.status(404).json({ error: 'No stage found' });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        stageId,
        status: 'DONE'
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completed tasks' });
  }
};

export const getPendingTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stageId = await resolveStageId(req.query.sprintId as string || req.query.stageId as string);
    if (!stageId) return res.status(404).json({ error: 'No stage found' });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        stageId,
        status: { not: 'DONE' }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
};

export const getBlockers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Find RFIs reported by user
    const blockers = await prisma.rFI.findMany({
      where: {
        reporterId: userId
      },
      include: { task: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(blockers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RFIs' });
  }
};

export const getProductivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const stageId = await resolveStageId(req.query.sprintId as string || req.query.stageId as string);
    if (!stageId) return res.status(404).json({ error: 'No stage found' });

    const completed = await prisma.task.count({
      where: { assigneeId: userId, stageId, status: 'DONE' }
    });

    const pending = await prisma.task.count({
      where: { assigneeId: userId, stageId, status: { not: 'DONE' } }
    });

    const blockersCount = await prisma.rFI.count({
      where: { reporterId: userId, task: { stageId } }
    });

    const totalTasks = completed + pending;
    const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    const allStoryPoints = await prisma.task.aggregate({
      where: { assigneeId: userId, stageId, status: 'DONE' },
      _sum: { storyPoints: true }
    });
    
    // Calculate or fetch MemberStageStats
    let stats = await prisma.memberStageStats.findFirst({
      where: { userId, stageId }
    });

    const storyPointsSum = allStoryPoints._sum?.storyPoints || 0;

    if (!stats) {
      stats = await prisma.memberStageStats.create({
        data: {
          userId,
          stageId,
          completedTasks: completed,
          pendingTasks: pending,
          storyPoints: storyPointsSum,
          completionRate,
          rfiCount: blockersCount
        }
      });
    } else {
      // Update with latest dynamically calculated
      stats = await prisma.memberStageStats.update({
        where: { id: stats.id },
        data: {
          completedTasks: completed,
          pendingTasks: pending,
          storyPoints: storyPointsSum,
          completionRate,
          rfiCount: blockersCount
        }
      });
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch productivity' });
  }
};
