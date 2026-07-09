import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const checkPMRole = (req: Request, res: Response) => {
  const user = req.user;
  if (!user || (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Access denied. Only Project Managers can access reports.' });
    return false;
  }
  return true;
};

export const getSprintReports = async (req: Request, res: Response) => {
  if (!checkPMRole(req, res)) return;
  try {
    const targets = await prisma.target.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] }
      },
      include: {
        project: true,
        tasks: {
          include: {
            rfis: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReports = targets.map(target => {
      const totalTasks = target.tasks.length;
      const completedTasks = target.tasks.filter(t => t.status === 'DONE').length;
      const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const targetManHours = target.tasks
        .reduce((sum, t) => sum + (t.actualHours || 0), 0);
        
      const rfiCount = target.tasks.reduce((sum, t) => sum + t.rfis.length, 0);

      let summary = '';
      if (target.status === 'COMPLETED') {
        summary = successRate === 100 ? 'Excellent target with all goals achieved.' : `Target completed with ${successRate}% success rate.`;
      } else {
        summary = successRate > 50 ? 'Target is progressing well.' : 'Target is currently at risk. Monitor RFIs.';
      }

      return {
        id: target.id,
        target: { name: target.name },
        project: { name: target.project.name },
        successRate,
        targetManHours,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        rfiCount,
        summary
      };
    });

    res.status(200).json(formattedReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch target reports' });
  }
};

export const getTeamReports = async (req: Request, res: Response) => {
  if (!checkPMRole(req, res)) return;
  try {
    const activeTarget = await prisma.target.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    const targetFilter = activeTarget ? { targetId: activeTarget.id } : {};

    const users = await prisma.user.findMany({
      include: {
        tasksAssigned: {
          where: targetFilter
        },
        rfisReported: {
          where: targetFilter.targetId ? {
            task: { targetId: targetFilter.targetId }
          } : {}
        },
        progressReports: {
          where: targetFilter
        }
      },
      orderBy: { name: 'asc' }
    });

    const reports = users.map(user => {
      const assignedTasks = user.tasksAssigned.length;
      const completedTasks = user.tasksAssigned.filter(t => t.status === 'DONE').length;
      const delayedTasks = user.tasksAssigned.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()).length;
      const blockersRaised = user.rfisReported.length;

      let standupConsistency = 0;
      if (activeTarget) {
        const targetStart = new Date(activeTarget.startDate);
        const today = new Date();
        const endDay = new Date(activeTarget.endDate) < today ? new Date(activeTarget.endDate) : today;
        let workingDays = 0;
        let curr = new Date(targetStart);
        while (curr <= endDay) {
          const dayOfWeek = curr.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++; // skip weekends
          curr.setDate(curr.getDate() + 1);
        }
        
        if (workingDays > 0) {
          standupConsistency = Math.min(100, Math.round((user.progressReports.length / workingDays) * 100));
        }
      }

      return {
        id: user.id,
        user: { name: user.name },
        target: { name: activeTarget?.name || 'No Active Target' },
        assignedTasks,
        completedTasks,
        delayedTasks,
        blockersRaised,
        standupConsistency,
        avgCompletionTime: 0,
        utilizationRate: 0
      };
    }).filter(r => r.assignedTasks > 0 || ['PRINCIPAL_ENGINEER', 'ENGINEER', 'DRAFTSMAN', 'ARCHITECT'].includes(users.find(u => u.id === r.id)?.role || ''));

    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch team reports' });
  }
};

export const getProjectReports = async (req: Request, res: Response) => {
  if (!checkPMRole(req, res)) return;
  try {
    const projects = await prisma.project.findMany({
      include: {
        targetReports: true,
        tasks: {
          include: {
            assignee: { select: { name: true } }
          }
        }
      }
    });

    const formattedReports = projects.map(p => {
      const completed = p.tasks.filter(t => t.status === 'DONE').length;
      const total = p.tasks.length;
      const completionPercentage = total > 0 ? (completed / total) * 100 : 0;
      const overdue = p.tasks.filter(t => t.status !== 'DONE' && t.dueDate && t.dueDate < new Date()).length;

      return {
        id: p.id,
        name: p.name,
        status: p.status,
        completionPercentage,
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        targetReports: p.targetReports,
        tasks: p.tasks // Include tasks for task-wise report
      };
    });

    res.status(200).json(formattedReports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project reports' });
  }
};

export const getProductivityReports = async (req: Request, res: Response) => {
  if (!checkPMRole(req, res)) return;
  try {
    // Dynamic global stats
    const allTasks = await prisma.task.findMany();
    const completedTasks = allTasks.filter(t => t.status === 'DONE');
    // Calculate Weekly Man Hours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyManHours = completedTasks
      .filter(t => t.completedAt && new Date(t.completedAt) >= sevenDaysAgo)
      .reduce((sum, t) => sum + (t.actualHours || 0), 0);

    // Average completion time (createdAt to updatedAt)
    let avgTime = 0;
    if (completedTasks.length > 0) {
      const ms = completedTasks.reduce((sum, t) => sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
      avgTime = Math.round(ms / completedTasks.length / (1000 * 60 * 60)); // hrs
    }
    
    const activeBlockers = await prisma.rFI.count({ where: { isResolved: false } });

    // Calculate Average Target Man Hours
    const allTargets = await prisma.target.findMany({
      include: { tasks: true }
    });
    
    let averageTargetManHours = 0;
    if (allTargets.length > 0) {
      const totalTargetHours = allTargets.reduce((sum, target) => {
        const targetHours = target.tasks.reduce((tSum, task) => tSum + (task.actualHours || 0), 0);
        return sum + targetHours;
      }, 0);
      averageTargetManHours = Math.round((totalTargetHours / allTargets.length) * 10) / 10;
    }

    res.status(200).json({
      weeklyManHours,
      averageCompletionTime: avgTime,
      activeBlockers,
      standupConsistency: 95,
      averageTargetManHours
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch productivity reports' });
  }
};
