import prisma from '../../utils/prisma';
import { autoUpdateStageStatuses } from '../../utils/stageUpdater';

export class DashboardRepository {
  async getStage(stageId?: string) {
    // Run asynchronously to prevent blocking the dashboard load
    autoUpdateStageStatuses().catch(console.error);
    
    if (stageId) {
      return prisma.stage.findUnique({
        where: { id: stageId },
        include: {
          tasks: {
            include: {
              assignee: true,
              rfis: true
            }
          }
        }
      });
    }

    return prisma.stage.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tasks: {
          include: {
            assignee: true,
            rfis: true
          }
        }
      }
    });
  }

  async getStageTasks(stageId: string) {
    return prisma.task.findMany({
      where: { stageId },
      include: {
        assignee: true,
        rfis: true
      }
    });
  }

  async getRFITasks(stageId: string) {
    return prisma.task.findMany({
      where: {
        stageId,
        rfis: {
          some: {
            isResolved: false
          }
        }
      },
      include: {
        assignee: true,
        rfis: {
          where: { isResolved: false }
        }
      }
    });
  }

  async getTeamMembers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: ['PRINCIPAL_ENGINEER', 'ENGINEER', 'DRAFTSMAN', 'ARCHITECT'] }
      }
    });
  }

  async getLatestProgressReports(stageId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return prisma.progressReport.findMany({
      where: { 
        stageId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { date: 'desc' },
      include: {
        user: true,
        stage: {
          include: {
            project: true
          }
        }
      }
    });
  }

  async getActiveProjectsCount() {
    return prisma.project.count({
      where: { status: 'ACTIVE' }
    });
  }

  async getGlobalRFIsCount() {
    return prisma.rFI.count({
      where: { isResolved: false }
    });
  }

  async getTotalActiveTasksCount() {
    return prisma.task.count({
      where: { status: { not: 'DONE' } }
    });
  }
}
