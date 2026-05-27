import { ActivityTrackerService } from './activity-tracker.service';

export class AuditEngineService {
  static async logAction(
    userId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    title: string,
    description: string,
    metadata?: any
  ) {
    await ActivityTrackerService.logActivity({
      userId,
      actionType,
      entityType,
      entityId,
      title,
      description,
      metadata,
    });
  }
}
