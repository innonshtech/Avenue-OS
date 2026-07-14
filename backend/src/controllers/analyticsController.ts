import { Request, Response } from 'express';
import prisma from '../utils/prisma';



export const getOverview = async (req: Request, res: Response) => {

  try {
    const targetId = req.query.targetId as string || req.query.sprintId as string;

    const baseTaskQuery: any = {};
    if (targetId) {
      baseTaskQuery.targetId = String(targetId);
    }

    const totalActiveTasks = await prisma.task.count({
      where: { 
        ...baseTaskQuery,
        status: { in: ['PENDING', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'EXTERNAL_REVIEW', 'MODIFICATION_REQUIRED', 'APPROVED'] } 
      }
    });

    // To calculate completion rate and velocity, we need the tasks
    const tasks = await prisma.task.findMany({
      where: baseTaskQuery
    });

    const totalTasksCount = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE');
    const completedTasksCount = completedTasks.length;

    const targetCompletionRate = totalTasksCount > 0 
      ? (completedTasksCount / totalTasksCount) * 100 
      : 0;

    const delayedTasks = await prisma.task.count({
      where: {
        ...baseTaskQuery,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });

    const blockersCount = await prisma.rFI.count({
      where: { 
        isResolved: false,
        ...(targetId ? { task: { targetId: String(targetId) } } : {})
      }
    });

    const activeProjects = await prisma.project.count({
      where: { status: 'ACTIVE' }
    });

    // Velocity (completed story points)
    const teamVelocity = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasks = await prisma.task.findMany({
      where: {
        ...baseTaskQuery,
        updatedAt: { gte: oneWeekAgo },
        actualHours: { not: null }
      }
    });
    const weeklyManHours = recentTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Avg completion time
    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTimeMs = completedTasks.reduce((sum, t) => sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
      avgCompletionTime = Math.round((totalTimeMs / completedTasks.length) / (1000 * 60 * 60)); // in hours
    }

    const teamUtilization = 85; 

    res.status(200).json({
      totalActiveTasks,
      sprintCompletionRate: targetCompletionRate,
      delayedTasks,
      blockersCount,
      teamVelocity,
      weeklyManHours,
      avgCompletionTime,
      activeProjects,
      teamUtilization,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch analytics overview' });
  }
};

export const getSprintsAnalytics = async (req: Request, res: Response) => {

  try {
    const targets = await prisma.target.findMany({
      where: { status: { in: ['ACTIVE', 'COMPLETED'] } },
      include: { tasks: true },
      orderBy: { startDate: 'asc' },
      take: 10
    });

    const data = targets.map(s => {
      const plannedPoints = s.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedPoints = s.tasks.filter(t => t.status === 'DONE').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      return {
        name: s.name,
        planned: plannedPoints,
        completed: completedPoints,
        velocity: completedPoints
      };
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch target analytics' });
  }
};

export const getTeamWorkload = async (req: Request, res: Response) => {

  try {
    const targetId = req.query.targetId as string || req.query.sprintId as string;
    
    const taskFilter: any = {};
    if (targetId) {
      taskFilter.targetId = String(targetId);
    }

    const users = await prisma.user.findMany({
      include: {
        tasksAssigned: {
          where: taskFilter
        }
      }
    });

    const data = users.map(u => {
      const pending = u.tasksAssigned.filter(t => t.status !== 'DONE').length;
      const completed = u.tasksAssigned.filter(t => t.status === 'DONE').length;
      
      return {
        member: u.name,
        assigned: u.tasksAssigned.length,
        completed: completed,
        pending: pending
      };
    }).filter(d => d.assigned > 0);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team workload' });
  }
};

export const getBlockersAnalytics = async (req: Request, res: Response) => {

  try {
    const targetId = req.query.targetId as string || req.query.sprintId as string;

    const rfis = await prisma.rFI.findMany({
      where: {
        ...(targetId ? { task: { targetId: String(targetId) } } : {})
      }
    });

    const grouped: Record<string, number> = {};
    rfis.forEach(b => {
      grouped[b.type] = (grouped[b.type] || 0) + 1;
    });

    const data = Object.keys(grouped).map(key => ({
      category: key,
      count: grouped[key]
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch RFI analytics' });
  }
};

export const getProductivityTimeline = async (req: Request, res: Response) => {

  try {
    const targetId = req.query.targetId as string || req.query.sprintId as string;
    
    const taskFilter: any = { status: 'DONE' };
    if (targetId) {
      taskFilter.targetId = String(targetId);
    }

    const completedTasks = await prisma.task.findMany({
      where: taskFilter,
      select: { updatedAt: true }
    });

    const reportFilter: any = {};
    if (targetId) {
      reportFilter.targetId = String(targetId);
    }

    const reports = await prisma.progressReport.findMany({
      where: reportFilter,
      select: { createdAt: true }
    });

    const dateMap: Record<string, { completed: number; standups: number }> = {};

    completedTasks.forEach(t => {
      const date = new Date(t.updatedAt).toISOString().split('T')[0];
      if (!dateMap[date]) dateMap[date] = { completed: 0, standups: 0 };
      dateMap[date].completed += 1;
    });

    reports.forEach((s: any) => {
      const date = new Date(s.createdAt).toISOString().split('T')[0];
      if (!dateMap[date]) dateMap[date] = { completed: 0, standups: 0 };
      dateMap[date].standups += 1;
    });

    const data = Object.keys(dateMap).sort().map(date => ({
      date,
      completed: dateMap[date].completed,
      standups: dateMap[date].standups
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch productivity timeline' });
  }
};

export const getBurndown = async (req: Request, res: Response) => {

  try {
    const targetId = req.query.targetId as string || req.query.sprintId as string;

    let targetTarget;
    if (targetId) {
      targetTarget = await prisma.target.findUnique({
        where: { id: String(targetId) },
        include: { tasks: true }
      });
    } else {
      targetTarget = await prisma.target.findFirst({
        where: { status: 'ACTIVE' },
        include: { tasks: true }
      });
    }

    if (!targetTarget || !targetTarget.startDate || !targetTarget.endDate) {
      return res.status(200).json([]);
    }

    const tasks = targetTarget.tasks;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    const start = new Date(targetTarget.startDate);
    const end = new Date(targetTarget.endDate);
    
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const data = [];
    let remainingActual = totalPoints;
    const idealDropPerDay = totalPoints / (totalDays || 1);

    for (let i = 0; i < totalDays; i++) {
      const currentDay = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      currentDay.setHours(23,59,59,999);

      const completedToday = tasks.filter(t => {
        if (t.status !== 'DONE') return false;
        const taskUpdated = new Date(t.updatedAt);
        taskUpdated.setHours(0,0,0,0);
        const loopDay = new Date(currentDay);
        loopDay.setHours(0,0,0,0);
        return taskUpdated.getTime() === loopDay.getTime();
      });

      const pointsCompletedToday = completedToday.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      
      const isFuture = currentDay.getTime() > Date.now();
      
      if (!isFuture) {
        remainingActual -= pointsCompletedToday;
        if (remainingActual < 0) remainingActual = 0;
      }

      data.push({
        day: `Day ${i + 1}`,
        date: currentDay.toLocaleDateString(),
        remaining: isFuture ? null : remainingActual,
        ideal: Math.max(0, Math.round(totalPoints - (idealDropPerDay * (i + 1))))
      });
    }

    data.unshift({
      day: 'Start',
      date: start.toLocaleDateString(),
      remaining: totalPoints,
      ideal: totalPoints
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch burndown data' });
  }
};
