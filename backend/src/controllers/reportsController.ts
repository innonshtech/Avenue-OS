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
    const stages = await prisma.stage.findMany({
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

    const formattedReports = stages.map(stage => {
      const totalTasks = stage.tasks.length;
      const completedTasks = stage.tasks.filter(t => t.status === 'DONE').length;
      const successRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const velocity = stage.tasks
        .filter(t => t.status === 'DONE')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        
      const rfiCount = stage.tasks.reduce((sum, t) => sum + t.rfis.length, 0);

      let summary = '';
      if (stage.status === 'COMPLETED') {
        summary = successRate === 100 ? 'Excellent stage with all goals achieved.' : `Stage completed with ${successRate}% success rate.`;
      } else {
        summary = successRate > 50 ? 'Stage is progressing well.' : 'Stage is currently at risk. Monitor RFIs.';
      }

      return {
        id: stage.id,
        stage: { name: stage.name },
        project: { name: stage.project.name },
        successRate,
        velocity,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        rfiCount,
        summary
      };
    });

    res.status(200).json(formattedReports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stage reports' });
  }
};

export const getTeamReports = async (req: Request, res: Response) => {
  if (!checkPMRole(req, res)) return;
  try {
    const activeStage = await prisma.stage.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });

    const stageFilter = activeStage ? { stageId: activeStage.id } : {};

    const users = await prisma.user.findMany({
      include: {
        tasksAssigned: {
          where: stageFilter
        },
        rfisReported: {
          where: stageFilter.stageId ? {
            task: { stageId: stageFilter.stageId }
          } : {}
        },
        progressReports: {
          where: stageFilter
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
      if (activeStage) {
        const stageStart = new Date(activeStage.startDate);
        const today = new Date();
        const endDay = new Date(activeStage.endDate) < today ? new Date(activeStage.endDate) : today;
        let workingDays = 0;
        let curr = new Date(stageStart);
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
        stage: { name: activeStage?.name || 'No Active Stage' },
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
        stageReports: true,
        tasks: {
          select: { status: true, dueDate: true }
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
        stageReports: p.stageReports
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
    const overallVelocity = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    
    // Average completion time (createdAt to updatedAt)
    let avgTime = 0;
    if (completedTasks.length > 0) {
      const ms = completedTasks.reduce((sum, t) => sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0);
      avgTime = Math.round(ms / completedTasks.length / (1000 * 60 * 60)); // hrs
    }
    
    const activeBlockers = await prisma.rFI.count({ where: { isResolved: false } });

    res.status(200).json({
      overallVelocity,
      averageCompletionTime: avgTime,
      activeBlockers,
      standupConsistency: 95
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch productivity reports' });
  }
};
