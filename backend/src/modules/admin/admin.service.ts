import prisma from '../../utils/prisma';
import { adminRepository } from './admin.repository';
import { adminAnalytics } from './admin.analytics';

export class AdminService {
  async getOverview() {
    const stats = await adminRepository.getOverviewStats();
    
    // Calculate global productivity (mock logic for now based on stats)
    const productivityScore = stats.totalTasks > 0 
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
      : 100;
      
    const sprintSuccessRate = 85; // This could be calculated from past sprint reports
    const standupCompliance = 92; // Could be calculated from daily standup logs vs active members
    
    return {
      ...stats,
      productivityScore,
      sprintSuccessRate,
      standupCompliance,
      pendingReviews: Math.floor(stats.activeSprints * 3), // mock
      qaDelays: Math.floor(stats.activeSprints * 1.5), // mock
    };
  }

  async getProjects() {
    const projects = await adminRepository.getAllProjects();
    return projects.map((p: any) => {
      const completedTasks = p.tasks.filter((t: any) => t.status === 'DONE').length;
      const totalTasks = p.tasks.length;
      const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const delayedTasks = p.tasks.filter((t: any) => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
      
      let health = 'Healthy';
      if (delayedTasks > 5) health = 'Critical';
      else if (delayedTasks > 0) health = 'Warning';
      
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        owner: p.owner?.name,
        activeSprint: p.sprints[0]?.name || 'None',
        completionPercent,
        totalTasks,
        completedTasks,
        delayedTasks,
        health,
        healthScore: Math.max(0, 100 - (delayedTasks * 5)), // mock health score
      };
    });
  }

  async getSprints() {
    const sprints = await adminRepository.getAllSprints();
    return sprints.map((s: any) => {
      const completedTasks = s.tasks.filter((t: any) => t.status === 'DONE').length;
      const totalTasks = s.tasks.length;
      const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        id: s.id,
        name: s.name,
        projectName: s.project?.name,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        completionPercent,
        totalTasks,
        completedTasks,
        standupsCount: s.standups.length,
      };
    });
  }

  async getTeamPerformance() {
    const members = await adminRepository.getTeamPerformance();
    return members.map((m: any) => {
      const completedTasks = m.tasksAssigned.filter((t: any) => t.status === 'DONE').length;
      const totalTasks = m.tasksAssigned.length;
      const overdueTasks = m.tasksAssigned.filter((t: any) => t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
      const blockersCount = m.blockersReported.length;
      const standupConsistency = Math.min(100, Math.round((m.standups.length / 5) * 100)); // assuming 5 workdays
      
      let productivityStatus = 'Healthy';
      if (overdueTasks > 3 || blockersCount > 2) productivityStatus = 'At Risk';
      if (totalTasks > 10) productivityStatus = 'Overloaded';
      if (totalTasks < 2) productivityStatus = 'Underutilized';
      if (completedTasks > 5 && overdueTasks === 0) productivityStatus = 'Excellent';
      
      return {
        id: m.id,
        name: m.name,
        role: m.role,
        department: m.department,
        avatar: m.avatar,
        assignedTasks: totalTasks,
        completedTasks,
        overdueTasks,
        blockersCount,
        standupConsistency,
        productivityStatus,
        productivityScore: Math.max(0, 100 - (overdueTasks * 10) - (blockersCount * 5)),
      };
    });
  }

  async getWorkload() {
    return adminRepository.getWorkload();
  }

  async getBlockers() {
    return adminRepository.getActiveBlockers();
  }

  async getActivityFeed() {
    return adminRepository.getRecentActivities();
  }

  async getAuditLogs() {
    return adminRepository.getAuditLogs();
  }

  async getIntelligenceInsights() {
    const [projects, workload, blockers] = await Promise.all([
      this.getProjects(),
      this.getWorkload(),
      this.getBlockers(),
    ]);

    return adminAnalytics.generateInsights({ projects, workload, blockers });
  }

  async getSecurityMetrics() {
    const failedAttempts = await prisma.loginHistory.count({
      where: { status: { in: ['FAILED', 'LOCKED'] } },
    });

    const activeSessions = await prisma.userSession.count({
      where: { isActive: true, expiresAt: { gt: new Date() } },
    });

    const securityAlerts = await prisma.securityAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    const recentLogs = await prisma.loginHistory.findMany({
      orderBy: { loggedInAt: 'desc' },
      take: 15,
    });

    return {
      failedAttempts,
      activeSessions,
      securityAlerts,
      recentLogs,
    };
  }
}

export const adminService = new AdminService();
