import { Request, Response } from 'express';
import { ActivityTrackerService } from '../services/audit/activity-tracker.service';
import prisma from '../utils/prisma';
import { hasPermission } from '../utils/permissionHelper';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const canViewAll = await hasPermission(user.role, 'VIEW_TEAM');
    const activities = await ActivityTrackerService.getActivities(user, canViewAll);

    // Apply additional filters from query
    let filteredActivities = activities;
    const { actionType, memberId, entityType } = req.query;
    
    if (actionType) {
      filteredActivities = filteredActivities.filter(a => a.actionType === String(actionType));
    }
    if (memberId) {
      filteredActivities = filteredActivities.filter(a => a.userId === String(memberId));
    }
    if (entityType) {
      filteredActivities = filteredActivities.filter(a => a.entityType === String(entityType));
    }

    // Query and attach task details for TASK entities
    const taskIds = filteredActivities
      .filter(a => a.entityType === 'TASK')
      .map(a => a.entityId);

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, key: true, title: true }
    });

    const tasksMap = new Map(tasks.map(t => [t.id, t]));

    const enrichedActivities = filteredActivities.map(a => {
      if (a.entityType === 'TASK') {
        return {
          ...a,
          task: tasksMap.get(a.entityId) || null
        };
      }
      return a;
    });

    res.status(200).json(enrichedActivities);
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};
