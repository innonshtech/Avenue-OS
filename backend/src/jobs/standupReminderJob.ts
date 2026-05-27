import cron from 'node-cron';
import prisma from '../utils/prisma';
import { emailService } from '../services/email/email.service';
import { inAppNotificationService } from '../services/notifications/inapp-notification.service';

export const initStandupReminderCron = () => {
  // Cron schedule: 6:00 PM every day -> "0 18 * * *" in Asia/Kolkata (IST)
  cron.schedule('0 18 * * *', () => {
    console.log('Running daily standup reminder job at 6:00 PM IST...');
    (async () => {
      try {
        const activeMembers = await prisma.user.findMany({
          where: {
            role: {
              in: ['DEVELOPER', 'MARKETING', 'HR', 'QA']
            },
            isActive: true
          }
        });

        for (const member of activeMembers) {
          // Send email (logs to EmailLog if MAIL credentials not set)
          await emailService.sendStandupReminderMail(member.name, member.email);

          // Add in-app notification
          await inAppNotificationService.createNotification(
            member.id,
            'SYSTEM',
            'Daily Standup Reminder',
            'Please remember to submit your daily standup update today.',
            '/dashboard/standups'
          );
        }
        console.log(`Standup reminders sent to ${activeMembers.length} active members.`);
      } catch (error) {
        console.error('Error in daily standup reminder job:', error);
      }
    })();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  } as any);
};
