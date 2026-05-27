import { DashboardRepository } from './dashboard.repository';

export class DashboardService {
  private repo: DashboardRepository;

  constructor() {
    this.repo = new DashboardRepository();
  }

  async getSprintHealth(sprintId?: string) {
    const activeSprint = await this.repo.getSprint(sprintId);
    
    if (!activeSprint) {
      return {
        activeSprint: null,
        message: 'No active sprint found'
      };
    }

    const tasks = activeSprint.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const startDate = new Date(activeSprint.startDate);
    const endDate = new Date(activeSprint.endDate);
    const today = new Date();
    
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const blockedTasksRaw = await this.repo.getBlockedTasks(activeSprint.id);
    const blockedTasks = blockedTasksRaw.map(t => ({
      id: t.id,
      title: t.title,
      assignee: t.assignee?.name || 'Unassigned',
      blockerReason: t.blockers[0]?.description || 'Unknown reason',
      severity: 'HIGH', // Can be dynamic based on Priority
      timeBlocked: `${Math.ceil((today.getTime() - new Date(t.blockers[0]?.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days`
    }));

    const overdueTasks = tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < today).length;

    let sprintStatus = 'HEALTHY';
    if (blockedTasks.length > 2 || overdueTasks > 3) {
      sprintStatus = 'AT RISK';
    }
    if (daysRemaining <= 2 && completionPercentage < 70) {
      sprintStatus = 'DELAYED';
    }

    const riskIndicators = [];
    if (blockedTasks.length > 0) riskIndicators.push(`⚠ High blocker count (${blockedTasks.length})`);
    if (overdueTasks > 0) riskIndicators.push(`⚠ ${overdueTasks} tasks overdue`);
    if (completionPercentage < (daysElapsed/totalDays)*100 - 15) riskIndicators.push(`⚠ Velocity dropping behind schedule`);

    return {
      activeSprint: activeSprint.name,
      completedTasks,
      totalTasks,
      completionPercentage,
      sprintGoal: activeSprint.goal || 'Complete scheduled tasks',
      sprintStartDate: activeSprint.startDate,
      sprintEndDate: activeSprint.endDate,
      daysRemaining,
      totalDays,
      status: sprintStatus,
      riskIndicators,
      blockedTasks
    };
  }

  async getTeamWorkload(sprintId?: string) {
    const activeSprint = await this.repo.getSprint(sprintId);
    const members = await this.repo.getTeamMembers();
    
    if (!activeSprint) return [];

    const tasks = activeSprint.tasks || [];
    
    return members.map(member => {
      const memberTasks = tasks.filter(t => t.assigneeId === member.id);
      const assignedTasks = memberTasks.length;
      const completedTasks = memberTasks.filter(t => t.status === 'DONE').length;
      const pendingTasks = assignedTasks - completedTasks;
      const blockers = memberTasks.filter(t => t.blockers && t.blockers.some((b: any) => !b.isResolved)).length;
      
      const utilization = Math.min(100, assignedTasks === 0 ? 0 : Math.round((assignedTasks / 8) * 100)); // Assuming 8 is max capacity per sprint
      
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

  async getBoardSnapshot(sprintId?: string) {
    const activeSprint = await this.repo.getSprint(sprintId);
    if (!activeSprint) return null;

    const tasks = activeSprint.tasks || [];
    
    const getColData = (statusStr: string) => {
      const colTasks = tasks.filter(t => t.status === statusStr);
      return {
        count: colTasks.length,
        storyPoints: colTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0),
        members: [...new Set(colTasks.map(t => t.assignee?.avatar || t.assignee?.name?.charAt(0)).filter(Boolean))]
      };
    };

    return {
      todo: getColData('TODO'),
      inProgress: getColData('IN_PROGRESS'),
      review: getColData('IN_REVIEW'),
      testing: getColData('IN_TESTING'),
      done: getColData('DONE'),
      totalStoryPoints: tasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0)
    };
  }

  async getStandupMonitoring(sprintId?: string) {
    const activeSprint = await this.repo.getSprint(sprintId);
    if (!activeSprint) return [];

    const standups = await this.repo.getLatestStandups(activeSprint.id);
    const members = await this.repo.getTeamMembers();
    
    // Group by member, get latest
    const latestStandups: any[] = [];
    
    members.forEach(member => {
      const memberStandups = standups.filter(s => s.userId === member.id);
      const latest = memberStandups[0]; // ordered desc by date
      
      if (latest) {
        latestStandups.push({
          member: member.name,
          role: member.role,
          task: 'Working on sprint tasks',
          todayWork: latest.today,
          blockers: latest.blockers || 'None',
          hasBlocker: !!latest.blockers && latest.blockers.trim() !== 'None' && latest.blockers.trim() !== '',
          helperRequired: 'Not specified',
          submittedAt: latest.date,
          projectName: latest.sprint?.project?.name || 'Smart Parking System',
          sprintName: latest.sprint?.name || 'Sprint 3'
        });
      }
    });

    return latestStandups;
  }
}
