import { DashboardRepository } from './dashboard.repository';

export class DashboardService {
  private repo: DashboardRepository;

  constructor() {
    this.repo = new DashboardRepository();
  }

  async getTargetHealth(targetId?: string, preloadedTarget?: any) {
    const activeTarget = preloadedTarget || await this.repo.getTarget(targetId);
    
    if (!activeTarget) {
      return {
        activeTarget: null,
        message: 'No active target found'
      };
    }

    const tasks = activeTarget.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const startDate = new Date(activeTarget.startDate);
    const endDate = new Date(activeTarget.endDate);
    const today = new Date();
    
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const rfiTasksRaw = await this.repo.getRFITasks(activeTarget.id);
    const blockedTasks = rfiTasksRaw.map((t: any) => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee?.name || 'Unassigned',
      blockerReason: t.rfis[0]?.description || 'Unknown reason',
      severity: 'HIGH',
      timeBlocked: `${Math.ceil((today.getTime() - new Date(t.rfis[0]?.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
    }));

    const overdueTasks = tasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today).length;

    let targetStatus = 'HEALTHY';
    if (blockedTasks.length > 2 || overdueTasks > 3) {
      targetStatus = 'AT RISK';
    }
    if (daysRemaining <= 2 && completionPercentage < 70) {
      targetStatus = 'DELAYED';
    }

    const riskIndicators = [];
    if (blockedTasks.length > 0) riskIndicators.push(`⚠ High RFI count (${blockedTasks.length})`);
    if (overdueTasks > 0) riskIndicators.push(`⚠ ${overdueTasks} tasks overdue`);
    if (completionPercentage < (daysElapsed/totalDays)*100 - 15) riskIndicators.push(`⚠ Progress dropping behind schedule`);

    return {
      activeTarget: activeTarget.name,
      completedTasks,
      totalTasks,
      completionPercentage,
      targetGoal: activeTarget.goal || 'Complete scheduled tasks',
      targetStartDate: activeTarget.startDate,
      targetEndDate: activeTarget.endDate,
      daysRemaining,
      totalDays,
      status: targetStatus,
      riskIndicators,
      blockedTasks
    };
  }

  async getTeamWorkload(targetId?: string, preloadedTarget?: any, preloadedMembers?: any) {
    const activeTarget = preloadedTarget || await this.repo.getTarget(targetId);
    const members = preloadedMembers || await this.repo.getTeamMembers();
    
    if (!activeTarget) return [];

    const tasks = activeTarget.tasks || [];
    
    return members.map((member: any) => {
      const memberTasks = tasks.filter((t: any) => t.assigneeId === member.id);
      const assignedTasks = memberTasks.length;
      const completedTasks = memberTasks.filter((t: any) => t.status === 'DONE').length;
      const pendingTasks = assignedTasks - completedTasks;
      const blockers = memberTasks.filter((t: any) => t.rfis && t.rfis.some((b: any) => !b.isResolved)).length;
      
      const utilization = Math.min(100, assignedTasks === 0 ? 0 : Math.round((assignedTasks / 8) * 100)); // Assuming 8 is max capacity
      
      let status = 'Healthy';
      if (utilization > 90) status = 'Overloaded';
      else if (blockers > 0) status = 'Critical';
      else if (utilization < 40) status = 'Low';

      return {
        member: member.name,
        assignedTasks,
        completedTasks,
        pendingTasks,
        blockers,
        utilization,
        status
      };
    });
  }

  async getBoardSnapshot(targetId?: string, preloadedTarget?: any) {
    const activeTarget = preloadedTarget || await this.repo.getTarget(targetId);
    if (!activeTarget) return null;

    const tasks = activeTarget.tasks || [];
    
    const getColData = (statusStr: string) => {
      const colTasks = tasks.filter((t: any) => t.status === statusStr);
      return {
        count: colTasks.length,
        storyPoints: colTasks.reduce((acc: number, t: any) => acc + (t.storyPoints || 0), 0),
        members: [...new Set(colTasks.map((t: any) => t.assignee?.avatar || t.assignee?.name?.charAt(0)).filter(Boolean))]
      };
    };

    return {
      pending: getColData('PENDING'),
      inProgress: getColData('IN_PROGRESS'),
      internalReview: getColData('INTERNAL_REVIEW'),
      externalReview: getColData('EXTERNAL_REVIEW'),
      modificationRequired: getColData('MODIFICATION_REQUIRED'),
      approved: getColData('APPROVED'),
      done: getColData('DONE'),
      totalStoryPoints: tasks.reduce((acc: number, t: any) => acc + (t.storyPoints || 0), 0)
    };
  }

  async getProgressReportMonitoring(targetId?: string, preloadedTarget?: any, preloadedMembers?: any) {
    const activeTarget = preloadedTarget || await this.repo.getTarget(targetId);
    if (!activeTarget) return [];

    const reports = await this.repo.getLatestProgressReports(activeTarget.id);
    const members = preloadedMembers || await this.repo.getTeamMembers();
    
    const latestReports: any[] = [];
    
    members.forEach((member: any) => {
      const memberReports = reports.filter((s: any) => s.userId === member.id);
      const latest = memberReports[0]; // ordered desc by date
      
      if (latest) {
        latestReports.push({
          member: member.name,
          role: member.role,
          task: 'Working on target tasks',
          todayWork: latest.today,
          blockers: latest.blockers || 'None',
          hasBlocker: !!latest.blockers && latest.blockers.trim() !== 'None' && latest.blockers.trim() !== '',
          helperRequired: 'Not specified',
          submittedAt: latest.date,
          projectName: latest.target?.project?.name || 'Avenue Project',
          sprintName: latest.target?.name || 'Framing'
        });
      }
    });

    return latestReports;
  }

  async getPMSummary(targetId?: string) {
    const [activeTarget, members] = await Promise.all([
      this.repo.getTarget(targetId),
      this.repo.getTeamMembers()
    ]);
    
    if (!activeTarget) {
      return {
        health: null,
        workload: [],
        boardSnapshot: null,
        standups: [],
        kpis: {
          activeProjects: 0,
          totalActiveTasks: 0,
          globalBlockers: 0,
        }
      };
    }

    const [health, workload, boardSnapshot, standups, activeProjects, globalBlockers, totalActiveTasks, weeklyManHours] = await Promise.all([
      this.getTargetHealth(targetId, activeTarget),
      this.getTeamWorkload(targetId, activeTarget, members),
      this.getBoardSnapshot(targetId, activeTarget),
      this.getProgressReportMonitoring(targetId, activeTarget, members),
      this.repo.getActiveProjectsCount(),
      this.repo.getGlobalRFIsCount(),
      this.repo.getTotalActiveTasksCount(),
      this.repo.getWeeklyManHours()
    ]);

    return {
      health,
      workload,
      boardSnapshot,
      standups,
      kpis: {
        activeProjects,
        totalActiveTasks,
        globalBlockers,
        weeklyManHours
      }
    };
  }
}
