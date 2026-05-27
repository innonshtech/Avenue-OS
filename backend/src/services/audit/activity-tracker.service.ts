import prisma from '../../utils/prisma';

export class ActivityTrackerService {
  static async logActivity(data: {
    userId: string;
    actionType: string;
    entityType: string;
    entityId: string;
    title: string;
    description: string;
    metadata?: any;
  }) {
    try {
      await prisma.activityLog.create({
        data,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  static async getActivities(user: any) {
    if (user.role === 'ADMIN' || user.role === 'PRODUCT_MANAGER') {
      // PRODUCT_MANAGER and ADMIN can see organization-wide activities
      return prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, avatar: true, email: true, role: true },
          },
        },
      });
    } else {
      // Regular members can only see their own activities
      return prisma.activityLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, avatar: true, email: true, role: true },
          },
        },
      });
    }
  }
}
