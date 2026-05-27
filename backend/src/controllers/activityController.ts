import { Request, Response } from 'express';
import { ActivityTrackerService } from '../services/audit/activity-tracker.service';

export const getActivities = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const activities = await ActivityTrackerService.getActivities(user);

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

    res.status(200).json(filteredActivities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};
