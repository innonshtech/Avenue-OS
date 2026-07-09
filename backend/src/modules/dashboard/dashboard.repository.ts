import prisma from '../../utils/prisma';
import { autoUpdateTargetStatuses } from '../../utils/targetUpdater';

export class DashboardRepository {
  async getTarget(targetId?: string) {
    // Run asynchronously to prevent blocking the dashboard load
    autoUpdateTargetStatuses().catch(console.error);
    
    if (targetId) {
      return prisma.target.findUnique({
        where: { id: targetId },
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

    return prisma.target.findFirst({
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

  async getTargetTasks(targetId: string) {
    return prisma.task.findMany({
      where: { targetId },
      include: {
        assignee: true,
        rfis: true
      }
    });
  }

  async getRFITasks(targetId: string) {
    return prisma.task.findMany({
      where: {
        targetId,
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

  async getLatestProgressReports(targetId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return prisma.progressReport.findMany({
      where: { 
        targetId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { date: 'desc' },
      include: {
        user: true,
        target: {
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

  async getWeeklyManHours() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await prisma.task.aggregate({
      where: {
        updatedAt: { gte: oneWeekAgo }
      },
      _sum: {
        actualHours: true
      }
    });
    return result._sum.actualHours || 0;
  }
}
