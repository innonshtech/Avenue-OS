import { DashboardRepository } from './dashboard.repository';

export class DashboardService {
  private repo: DashboardRepository;

  constructor() {
    this.repo = new DashboardRepository();
  }

  async getStageHealth(stageId?: string, preloadedStage?: any) {
    const activeStage = preloadedStage || await this.repo.getStage(stageId);
    
    if (!activeStage) {
      return {
        activeStage: null,
        message: 'No active stage found'
      };
    }

    const tasks = activeStage.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const startDate = new Date(activeStage.startDate);
    const endDate = new Date(activeStage.endDate);
    const today = new Date();
    
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const rfiTasksRaw = await this.repo.getRFITasks(activeStage.id);
    const blockedTasks = rfiTasksRaw.map((t: any) => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee?.name || 'Unassigned',
      blockerReason: t.rfis[0]?.description || 'Unknown reason',
      severity: 'HIGH',
      timeBlocked: `${Math.ceil((today.getTime() - new Date(t.rfis[0]?.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
    }));

    const overdueTasks = tasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today).length;

    let stageStatus = 'HEALTHY';
    if (blockedTasks.length > 2 || overdueTasks > 3) {
      stageStatus = 'AT RISK';
    }
    if (daysRemaining <= 2 && completionPercentage < 70) {
      stageStatus = 'DELAYED';
    }

    const riskIndicators = [];
    if (blockedTasks.length > 0) riskIndicators.push(`⚠ High RFI count (${blockedTasks.length})`);
    if (overdueTasks > 0) riskIndicators.push(`⚠ ${overdueTasks} tasks overdue`);
    if (completionPercentage < (daysElapsed/totalDays)*100 - 15) riskIndicators.push(`⚠ Velocity dropping behind schedule`);

    return {
      activeStage: activeStage.name,
      completedTasks,
      totalTasks,
      completionPercentage,
      stageGoal: activeStage.goal || 'Complete scheduled tasks',
      stageStartDate: activeStage.startDate,
      stageEndDate: activeStage.endDate,
      daysRemaining,
      totalDays,
      status: stageStatus,
      riskIndicators,
      blockedTasks
    };
  }

  async getTeamWorkload(stageId?: string, preloadedStage?: any, preloadedMembers?: any) {
    const activeStage = preloadedStage || await this.repo.getStage(stageId);
    const members = preloadedMembers || await this.repo.getTeamMembers();
    
    if (!activeStage) return [];

    const tasks = activeStage.tasks || [];
    
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

  async getBoardSnapshot(stageId?: string, preloadedStage?: any) {
    const activeStage = preloadedStage || await this.repo.getStage(stageId);
    if (!activeStage) return null;

    const tasks = activeStage.tasks || [];
    
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

  async getProgressReportMonitoring(stageId?: string, preloadedStage?: any, preloadedMembers?: any) {
    const activeStage = preloadedStage || await this.repo.getStage(stageId);
    if (!activeStage) return [];

    const reports = await this.repo.getLatestProgressReports(activeStage.id);
    const members = preloadedMembers || await this.repo.getTeamMembers();
    
    const latestReports: any[] = [];
    
    members.forEach((member: any) => {
      const memberReports = reports.filter((s: any) => s.userId === member.id);
      const latest = memberReports[0]; // ordered desc by date
      
      if (latest) {
        latestReports.push({
          member: member.name,
          role: member.role,
          task: 'Working on stage tasks',
          todayWork: latest.today,
          blockers: latest.blockers || 'None',
          hasBlocker: !!latest.blockers && latest.blockers.trim() !== 'None' && latest.blockers.trim() !== '',
          helperRequired: 'Not specified',
          submittedAt: latest.date,
          projectName: latest.stage?.project?.name || 'Avenue Project',
          sprintName: latest.stage?.name || 'Framing'
        });
      }
    });

    return latestReports;
  }

  async getPMSummary(stageId?: string) {
    const [activeStage, members] = await Promise.all([
      this.repo.getStage(stageId),
      this.repo.getTeamMembers()
    ]);
    
    if (!activeStage) {
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

    const [health, workload, boardSnapshot, standups, activeProjects, globalBlockers, totalActiveTasks] = await Promise.all([
      this.getStageHealth(stageId, activeStage),
      this.getTeamWorkload(stageId, activeStage, members),
      this.getBoardSnapshot(stageId, activeStage),
      this.getProgressReportMonitoring(stageId, activeStage, members),
      this.repo.getActiveProjectsCount(),
      this.repo.getGlobalRFIsCount(),
      this.repo.getTotalActiveTasksCount()
    ]);

    return {
      health,
      workload,
      boardSnapshot,
      standups,
      kpis: {
        activeProjects,
        totalActiveTasks,
        globalBlockers
      }
    };
  }
}
