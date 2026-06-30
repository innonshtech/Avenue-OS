export class AdminAnalytics {
  generateInsights(data: any) {
    const insights = [];

    // Check project health
    if (data.projects) {
      data.projects.forEach((project: any) => {
        const delayedTasks = project.delayedTasks || 0;
        if (delayedTasks > 3) {
          insights.push({
            type: 'WARNING',
            message: `${project.name} has ${delayedTasks} delayed tasks. Delivery risk is high.`,
            source: 'PROJECT_HEALTH'
          });
        }
      });
    }

    // Check workload
    if (data.workload) {
      data.workload.forEach((member: any) => {
        if (member._count.tasksAssigned > 8) {
          insights.push({
            type: 'WARNING',
            message: `${member.name} is currently overloaded with ${member._count.tasksAssigned} active tasks.`,
            source: 'TEAM_WORKLOAD'
          });
        } else if (member._count.tasksAssigned === 0) {
          insights.push({
            type: 'INFO',
            message: `${member.name} has no active tasks. Consider assigning new work.`,
            source: 'TEAM_WORKLOAD'
          });
        }
      });
    }

    // Check RFIs
    if (data.rfis) {
      if (data.rfis.length > 5) {
        insights.push({
          type: 'CRITICAL',
          message: `Organization currently has ${data.rfis.length} unresolved RFIs. Immediate attention required.`,
          source: 'RFIs'
        });
      }
    }

    return insights;
  }
}

export const adminAnalytics = new AdminAnalytics();
