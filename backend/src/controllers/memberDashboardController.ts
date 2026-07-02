import { Request, Response } from 'express';
import { TaskStatus } from '@prisma/client';
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

    // 1. Get active stage
    const activeStage = await prisma.stage.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tasks: {
          where: { assigneeId: userId }
        }
      }
    });

    // 2. Get user's tasks
    const allAssignedTasks = await prisma.task.findMany({
      where: { assigneeId: userId, isArchived: false },
      include: { rfis: { where: { isResolved: false } } }
    });

    const activeTasks = allAssignedTasks.filter(t => t.status !== TaskStatus.DONE);
    const completedTasks = allAssignedTasks.filter(t => t.status === TaskStatus.DONE);
    const strictlyPendingTasks = allAssignedTasks.filter(t => t.status === TaskStatus.PENDING);
    
    // Stage specific metrics
    const tasksInActiveStage = activeStage ? activeStage.tasks : [];
    const completedThisStage = tasksInActiveStage.filter(t => t.status === TaskStatus.DONE).length;
    
    // Calculate story points (completed vs total pending)
    const storyPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Date calculations for due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = activeTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    const overdueTasks = activeTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    });

    const urgentTasks = activeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'CRITICAL');

    // Review Queue
    const reviewQueue = activeTasks.filter(t => t.status === TaskStatus.INTERNAL_REVIEW || t.status === TaskStatus.EXTERNAL_REVIEW);

    // Active RFIs
    const blockers = allAssignedTasks.flatMap(t => t.rfis);

    // Stage Progress
    let stageProgress = 0;
    if (activeStage) {
      const totalTasks = tasksInActiveStage.length;
      if (totalTasks > 0) {
        stageProgress = (completedThisStage / totalTasks) * 100;
      }
    }

    const response = {
      pendingTasks: strictlyPendingTasks.length,
      dueToday: dueToday.length,
      overdueTasks: overdueTasks.length,
      urgentTasks: urgentTasks.length,
      completedTasks: completedTasks.length,
      completedThisSprint: completedThisStage,
      storyPoints,
      activeSprint: activeStage ? {
        id: activeStage.id,
        name: activeStage.name,
        startDate: activeStage.startDate,
        endDate: activeStage.endDate,
      } : null,
      sprintProgress: Math.round(stageProgress),
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

export const getMemberSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Get active stage
    const activeStage = await prisma.stage.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tasks: {
          where: { assigneeId: userId }
        }
      }
    });

    // 2. Get user's tasks with full relations for the UI
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId, isArchived: false },
      include: { project: true, stage: true, rfis: { where: { isResolved: false } } },
      orderBy: { createdAt: 'desc' }
    });

    const activeTasks = tasks.filter(t => t.status !== TaskStatus.DONE);
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE);
    const strictlyPendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
    // Stage specific metrics
    const tasksInActiveStage = activeStage ? activeStage.tasks : [];
    const completedThisStage = tasksInActiveStage.filter(t => t.status === TaskStatus.DONE).length;
    
    // Calculate story points (completed vs total pending)
    const storyPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Date calculations for due dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = activeTasks.filter(t => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });

    const overdueTasks = activeTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < today;
    });

    const urgentTasks = activeTasks.filter(t => t.priority === 'URGENT' || t.priority === 'CRITICAL');

    // Review Queue
    const reviewQueue = activeTasks.filter(t => t.status === TaskStatus.INTERNAL_REVIEW || t.status === TaskStatus.EXTERNAL_REVIEW);

    // Active RFIs
    const blockers = tasks.flatMap(t => t.rfis);

    // Stage Progress
    let stageProgress = 0;
    if (activeStage) {
      const totalTasks = tasksInActiveStage.length;
      if (totalTasks > 0) {
        stageProgress = (completedThisStage / totalTasks) * 100;
      }
    }

    const overview = {
      pendingTasks: strictlyPendingTasks.length,
      dueToday: dueToday.length,
      overdueTasks: overdueTasks.length,
      urgentTasks: urgentTasks.length,
      completedTasks: completedTasks.length,
      completedThisSprint: completedThisStage,
      storyPoints,
      activeSprint: activeStage ? {
        id: activeStage.id,
        name: activeStage.name,
        startDate: activeStage.startDate,
        endDate: activeStage.endDate,
      } : null,
      sprintProgress: Math.round(stageProgress),
      blockers: blockers.length,
      activeBlocker: blockers.length > 0 ? blockers[0] : null,
      reviewQueue: reviewQueue.length
    };

    res.json({ overview, tasks });
  } catch (error) {
    console.error('Error fetching member summary:', error);
    res.status(500).json({ error: 'Failed to fetch member summary' });
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
