import prisma from '../../utils/prisma';
import { autoUpdateSprintStatuses } from '../../utils/sprintUpdater';

export class DashboardRepository {
  async getSprint(sprintId?: string) {
    await autoUpdateSprintStatuses();
    
    if (sprintId) {
      return prisma.sprint.findUnique({
        where: { id: sprintId },
        include: {
          tasks: {
            include: {
              assignee: true,
              blockers: true
            }
          }
        }
      });
    }

    return prisma.sprint.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tasks: {
          include: {
            assignee: true,
            blockers: true
          }
        }
      }
    });
  }

  async getSprintTasks(sprintId: string) {
    return prisma.task.findMany({
      where: { sprintId },
      include: {
        assignee: true,
        blockers: true
      }
    });
  }

  async getBlockedTasks(sprintId: string) {
    return prisma.task.findMany({
      where: {
        sprintId,
        blockers: {
          some: {
            isResolved: false
          }
        }
      },
      include: {
        assignee: true,
        blockers: {
          where: { isResolved: false }
        }
      }
    });
  }

  async getTeamMembers() {
    return prisma.user.findMany({
      where: {
        // Exclude people who aren't active team members if needed, or get all developers
        role: { in: ['DEVELOPER', 'MARKETING'] }
      }
    });
  }

  async getLatestStandups(sprintId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return prisma.dailyStandup.findMany({
      where: { 
        sprintId,
        date: {
          gte: todayStart,
          lte: todayEnd
        }
      },
      orderBy: { date: 'desc' },
      include: {
        user: true,
        sprint: {
          include: {
            project: true
          }
        }
      }
    });
  }
}
