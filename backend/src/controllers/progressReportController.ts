import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getIO } from '../sockets/socket.server';
import { SOCKET_EVENTS } from '../sockets/socket.events';

export const getProgressReports = async (req: Request, res: Response) => {
  try {
    const { targetId, userId } = req.query;
    
    const query: any = {};
    if (targetId) query.targetId = String(targetId);
    if (userId) query.userId = String(userId);

    const reports = await prisma.progressReport.findMany({
      where: query,
      include: {
        user: true,
        target: {
          include: {
            project: true
          }
        },
      },
      orderBy: { date: 'desc' }
    });
    
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress reports' });
  }
};

export const getMyProgressReports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { targetId } = req.query;
    
    const query: any = { userId };
    if (targetId) query.targetId = String(targetId);

    const reports = await prisma.progressReport.findMany({
      where: query,
      include: {
        user: true,
        task: true,
        target: {
          include: {
            project: true
          }
        },
        reportedRFIs: true
      },
      orderBy: { date: 'desc' }
    });
    
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your progress reports' });
  }
};

export const getTeamProgressReports = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || (user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Forbidden: Project Manager access required' });
    }

    const { targetId } = req.query;
    
    const query: any = {};
    if (targetId) query.targetId = String(targetId);

    const reports = await prisma.progressReport.findMany({
      where: query,
      include: {
        user: true,
        task: true,
        reportedRFIs: true,
        target: {
          include: {
            project: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team progress reports' });
  }
};

export const createProgressReport = async (req: Request, res: Response) => {
  try {
    const { yesterday, today, blockers, userId, targetId, taskId, rfiDetails } = req.body;

    const report = await prisma.progressReport.create({
      data: {
        yesterday,
        today,
        blockers,
        userId,
        targetId,
        taskId,
      },
      include: {
        user: true,
        task: true
      }
    });

    // If there is a blocker/RFI details are provided, create it
    if (rfiDetails) {
      await prisma.rFI.create({
        data: {
          description: rfiDetails.description || blockers || 'RFI raised',
          severity: rfiDetails.severity || 'MEDIUM',
          type: rfiDetails.type || 'ARCHITECTURAL_CLARIFICATION',
          estimatedResolutionDate: rfiDetails.estimatedResolutionDate ? new Date(rfiDetails.estimatedResolutionDate) : null,
          helperId: rfiDetails.helperId,
          taskId: taskId || rfiDetails.taskId,
          reporterId: userId,
          progressReportId: report.id,
        }
      });
    }

    // Create activity log if task is linked
    if (taskId) {
      await prisma.taskActivity.create({
        data: {
          taskId,
          userId,
          action: 'PROGRESS_REPORT_UPDATE',
          newValue: today.substring(0, 50)
        }
      });
    }

    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      userId,
      'PROGRESS_REPORT_SUBMITTED',
      'PROGRESS_REPORT',
      report.id,
      `Progress Report Submitted`,
      `Today: ${today.substring(0, 100)}${today.length > 100 ? '...' : ''}`
    );

    let projectId: string | null = null;
    if (targetId) {
      const target = await prisma.target.findUnique({
        where: { id: targetId },
        select: { projectId: true }
      });
      projectId = target?.projectId || null;
    }

    try {
      const io = getIO();
      const payload = {
        progressReport: report,
        projectId,
        targetId
      };
      io.to('organization').emit(SOCKET_EVENTS.PROGRESS_REPORT_SUBMITTED, payload);
      if (projectId) {
        io.to(`project:${projectId}`).emit(SOCKET_EVENTS.PROGRESS_REPORT_SUBMITTED, payload);
      }
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit progress report' });
  }
};

export const deleteProgressReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.progressReport.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Progress report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete progress report' });
  }
};

export const getMyLatestProgressReport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const report = await prisma.progressReport.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    res.status(200).json(report);
  } catch(error) {
    res.status(500).json({ error: 'Failed to fetch latest progress report' });
  }
};
