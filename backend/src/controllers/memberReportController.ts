import { Request, Response } from 'express';
import prisma from '../utils/prisma';

// Helper to get current active target for user if not provided
const resolveTargetId = async (targetId?: string): Promise<string | null> => {
  if (targetId) return targetId;
  const activeTarget = await prisma.target.findFirst({
    where: { status: 'ACTIVE' }
  });
  return activeTarget?.id || null;
};

export const getSprintSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = await resolveTargetId(req.query.sprintId as string || req.query.targetId as string);
    if (!targetId) return res.status(404).json({ error: 'No active target found' });

    const target = await prisma.target.findUnique({
      where: { id: targetId }
    });
    if (!target) return res.status(404).json({ error: 'Target not found' });

    const now = new Date();
    const totalDays = Math.ceil((target.endDate.getTime() - target.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.ceil((now.getTime() - target.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - elapsedDays);
    const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100)) || 0;

    res.status(200).json({
      id: target.id,
      name: target.name,
      totalDays,
      elapsedDays,
      daysRemaining,
      progress
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch target summary' });
  }
};

export const getCompletedTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const targetId = await resolveTargetId(req.query.sprintId as string || req.query.targetId as string);
    if (!targetId) return res.status(404).json({ error: 'No target found' });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        targetId,
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

    const targetId = await resolveTargetId(req.query.sprintId as string || req.query.targetId as string);
    if (!targetId) return res.status(404).json({ error: 'No target found' });

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        targetId,
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

    const targetId = await resolveTargetId(req.query.sprintId as string || req.query.targetId as string);
    if (!targetId) return res.status(404).json({ error: 'No target found' });

    const completed = await prisma.task.count({
      where: { assigneeId: userId, targetId, status: 'DONE' }
    });

    const pending = await prisma.task.count({
      where: { assigneeId: userId, targetId, status: { not: 'DONE' } }
    });

    const blockersCount = await prisma.rFI.count({
      where: { reporterId: userId, task: { targetId } }
    });

    const totalTasks = completed + pending;
    const completionRate = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;

    const allStoryPoints = await prisma.task.aggregate({
      where: { assigneeId: userId, targetId, status: 'DONE' },
      _sum: { storyPoints: true }
    });
    
    // Calculate or fetch MemberTargetStats
    let stats = await prisma.memberTargetStats.findFirst({
      where: { userId, targetId }
    });

    const storyPointsSum = allStoryPoints._sum?.storyPoints || 0;

    if (!stats) {
      stats = await prisma.memberTargetStats.create({
        data: {
          userId,
          targetId,
          completedTasks: completed,
          pendingTasks: pending,
          storyPoints: storyPointsSum,
          completionRate,
          rfiCount: blockersCount
        }
      });
    } else {
      // Update with latest dynamically calculated
      stats = await prisma.memberTargetStats.update({
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
