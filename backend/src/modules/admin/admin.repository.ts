import prisma from '../../utils/prisma';

export class AdminRepository {
  async getOverviewStats() {
    const [
      totalProjects,
      activeStages,
      totalTasks,
      completedTasks,
      delayedTasks,
      activeRFIs,
      activeMembers,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.stage.count({ where: { status: 'ACTIVE' } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'DONE' } }),
      prisma.task.count({
        where: {
          status: { not: 'DONE' },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.rFI.count({ where: { isResolved: false } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      totalProjects,
      activeStages,
      totalTasks,
      completedTasks,
      delayedTasks,
      activeRFIs,
      activeMembers,
    };
  }

  async getAllProjects() {
    return prisma.project.findMany({
      include: {
        owner: true,
        tasks: {
          select: { status: true, dueDate: true }
        },
        stages: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
        _count: {
          select: { tasks: true }
        }
      },
    });
  }

  async getAllStages() {
    return prisma.stage.findMany({
      include: {
        project: true,
        tasks: {
          select: { status: true }
        },
        progressReports: true,
      },
      orderBy: {
        startDate: 'desc'
      }
    });
  }

  async getTeamPerformance() {
    return prisma.user.findMany({
      include: {
        tasksAssigned: {
          select: { status: true, dueDate: true }
        },
        rfisReported: {
          where: { isResolved: false }
        },
        progressReports: {
          where: {
            date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } // Last 7 days
          }
        }
      }
    });
  }

  async getWorkload() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        _count: {
          select: {
            tasksAssigned: {
              where: { status: { not: 'DONE' } }
            }
          }
        }
      }
    });
  }

  async getActiveRFIs() {
    return prisma.rFI.findMany({
      where: { isResolved: false },
      include: {
        task: {
          include: { project: true, stage: true }
        },
        reporter: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getAuditLogs(limit: number = 50) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentActivities(limit: number = 50) {
    return prisma.taskActivity.findMany({
      include: {
        task: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const adminRepository = new AdminRepository();
