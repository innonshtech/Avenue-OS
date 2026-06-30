import cron from 'node-cron';
import prisma from '../utils/prisma';
import { emailService } from '../services/email/email.service';
import { inAppNotificationService } from '../services/notifications/inapp-notification.service';

export const initProgressReportReminderCron = () => {
  // Cron schedule: 6:00 PM every day -> "0 18 * * *" in Asia/Kolkata (IST)
  cron.schedule('0 18 * * *', () => {
    console.log('Running daily progress report reminder job at 6:00 PM IST...');
    (async () => {
      try {
        const activeMembers = await prisma.user.findMany({
          where: {
            role: {
              in: ['PRINCIPAL_ENGINEER', 'ENGINEER', 'DRAFTSMAN', 'ARCHITECT']
            },
            isActive: true
          }
        });

        for (const member of activeMembers) {
          // Send email
          await emailService.sendStandupReminderMail(member.name, member.email);

          // Add in-app notification
          await inAppNotificationService.createNotification(
            member.id,
            'SYSTEM',
            'Daily Progress Report Reminder',
            'Please remember to submit your daily progress report today.',
            '/dashboard/standups'
          );
        }
        console.log(`Progress report reminders sent to ${activeMembers.length} active members.`);
      } catch (error) {
        console.error('Error in daily progress report reminder job:', error);
      }
    })();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  } as any);
};
