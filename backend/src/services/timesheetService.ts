import prisma from '../utils/prisma';


export class TimesheetService {
  /**
   * Fetch timesheets based on user role and permissions.
   * - ADMIN and PRODUCT_MANAGER (Saket) can see ALL timesheets.
   * - Other roles see their OWN timesheets + PRODUCT_MANAGER's timesheets.
   */
  static async getVisibleTimesheets(userId: string, userRole: string) {
    if (userRole === 'ADMIN' || userRole === 'PROJECT_MANAGER') {
      return prisma.timesheet.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, role: true }
          }
        },
        orderBy: { date: 'desc' }
      });
    }

    // Normal users see their own AND PM timesheets
    return prisma.timesheet.findMany({
      where: {
        OR: [
          { userId },
          { user: { role: 'PROJECT_MANAGER' } }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Submit a new timesheet
   */
  static async createTimesheet(data: {
    userId: string;
    tasksWorkedOn: string;
    hoursWorked: number;
    notes?: string;
  }) {
    return prisma.timesheet.create({
      data: {
        userId: data.userId,
        tasksWorkedOn: data.tasksWorkedOn,
        hoursWorked: data.hoursWorked,
        notes: data.notes,
        date: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, role: true }
        }
      }
    });
  }
}
