import { Request, Response } from 'express';
import { PrismaClient, TaskStatus, BlockerSeverity } from '@prisma/client';
import prisma from '../utils/prisma';

// ==========================================
// MEMBER OVERVIEW
// ==========================================
export const getMemberOverview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Get active sprint
    const activeSprint = await prisma.sprint.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tasks: {
          where: { assigneeId: userId }
        }
      }
    });

    // 2. Get user's tasks
    const allAssignedTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: { blockers: { where: { isResolved: false } } }
    });

    const pendingTasks = allAssignedTasks.filter(t => t.status !== TaskStatus.DONE);
    const completedTasks = allAssignedTasks.filter(t => t.status === TaskStatus.DONE);
    
    // Sprint specific metrics
    const tasksInActiveSprint = activeSprint ? activeSprint.tasks : [];
    const completedThisSprint = tasksInActiveSprint.filter(t => t.status === TaskStatus.DONE).length;
    
    // Calculate story points (completed vs total pending)
    const storyPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Date calculations for due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = pendingTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    const overdueTasks = pendingTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    });

    const urgentTasks = pendingTasks.filter(t => t.priority === 'URGENT' || t.priority === 'CRITICAL');

    // Review Queue
    const reviewQueue = pendingTasks.filter(t => t.status === TaskStatus.IN_REVIEW);

    // Active Blockers
    const blockers = allAssignedTasks.flatMap(t => t.blockers);

    // Sprint Progress
    let sprintProgress = 0;
    if (activeSprint) {
      const totalTasks = tasksInActiveSprint.length;
      if (totalTasks > 0) {
        sprintProgress = (completedThisSprint / totalTasks) * 100;
      }
    }

    const response = {
      pendingTasks: pendingTasks.length,
      dueToday: dueToday.length,
      overdueTasks: overdueTasks.length,
      urgentTasks: urgentTasks.length,
      completedTasks: completedTasks.length,
      completedThisSprint,
      storyPoints,
      activeSprint: activeSprint ? {
        id: activeSprint.id,
        name: activeSprint.name,
        startDate: activeSprint.startDate,
        endDate: activeSprint.endDate,
      } : null,
      sprintProgress: Math.round(sprintProgress),
      blockers: blockers.length,
      activeBlocker: blockers.length > 0 ? blockers[0] : null,
      reviewQueue: reviewQueue.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching member overview:', error);
    res.status(500).json({ error: 'Failed to fetch member overview' });
  }
};

// ==========================================
// TODAY FOCUS
// ==========================================
export const getTodayFocus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get today's start and end date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const focus = await prisma.todayFocus.findFirst({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    res.json(focus);
  } catch (error) {
    console.error('Error fetching today focus:', error);
    res.status(500).json({ error: 'Failed to fetch today focus' });
  }
};

export const createTodayFocus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content } = req.body;

    const focus = await prisma.todayFocus.create({
      data: {
        userId,
        content
      }
    });

    res.status(201).json(focus);
  } catch (error) {
    console.error('Error creating today focus:', error);
    res.status(500).json({ error: 'Failed to create today focus' });
  }
};

export const updateTodayFocus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Verify ownership
    const existing = await prisma.todayFocus.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Focus not found' });
    }

    const focus = await prisma.todayFocus.update({
      where: { id },
      data: { content }
    });

    res.json(focus);
  } catch (error) {
    console.error('Error updating today focus:', error);
    res.status(500).json({ error: 'Failed to update today focus' });
  }
};
