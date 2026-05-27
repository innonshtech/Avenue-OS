import prisma from '../../utils/prisma';
import { SendTaskAssignedMailParams } from './email.types';
import { MAIL_FROM, MAIL_CC, EMAIL_MAPPINGS } from './email.constants';
import { getTaskAssignedTemplate } from './templates/taskAssignedTemplate';
import { transporter } from './transporter';

export class EmailService {
  /**
   * Logs email sending attempts to the database
   */
  private async logEmail(
    taskId: string,
    recipient: string,
    subject: string,
    status: 'sent' | 'failed' | 'queued',
    errorMessage?: string
  ) {
    try {
      await prisma.emailLog.create({
        data: {
          taskId,
          recipient,
          subject,
          status,
          provider: 'Nodemailer',
          errorMessage
        }
      });
    } catch (dbError) {
      console.error('Failed to log email to database:', dbError);
    }
  }

  async sendTaskAssignedMail(params: SendTaskAssignedMailParams): Promise<boolean> {
    const subject = `[ SprintOS ] New Task Assigned — ${params.taskKey}`;
    
    // Resolve email: Prefer passed email (from user table), fallback to mapping
    const toEmail = params.assigneeEmail || EMAIL_MAPPINGS[params.assigneeName] || 'unknown@innonsh.com';

    try {
      if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn('MAIL_USER or MAIL_PASS is missing. Mocking email send.');
        await this.logEmail(params.taskId, toEmail, subject, 'failed', 'Missing Gmail SMTP Credentials');
        return false;
      }

      const html = getTaskAssignedTemplate(params);

      await transporter.sendMail({
        from: MAIL_FROM,
        to: toEmail,
        cc: MAIL_CC,
        subject,
        html,
      });

      console.log('Task assignment mail sent successfully');
      await this.logEmail(params.taskId, toEmail, subject, 'sent');
      return true;
    } catch (error: any) {
      console.error('Task assignment mail failed:', error.message);
      await this.logEmail(params.taskId, toEmail, subject, 'failed', error.message);
      return false;
    }
  }

  async sendStandupReminderMail(userName: string, userEmail: string): Promise<boolean> {
    const subject = `[ SprintOS ] Daily Standup Reminder`;
    try {
      if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
        console.warn('MAIL_USER or MAIL_PASS is missing. Mocking standup reminder email send.');
        await this.logEmail('', userEmail, subject, 'failed', 'Missing Gmail SMTP Credentials');
        return false;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Daily Standup Reminder</h2>
          <p>Hi ${userName},</p>
          <p>This is a reminder to submit your daily standup update for today. Keeping the team in sync is essential for our sprint progress!</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/standups" 
               style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Submit Daily Standup
            </a>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 40px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
            This is an automated notification from SprintOS. Please do not reply to this email.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: MAIL_FROM,
        to: userEmail,
        cc: MAIL_CC,
        subject,
        html,
      });

      console.log(`Standup reminder mail sent to ${userEmail}`);
      await this.logEmail('', userEmail, subject, 'sent');
      return true;
    } catch (error: any) {
      console.error('Standup reminder mail failed:', error.message);
      await this.logEmail('', userEmail, subject, 'failed', error.message);
      return false;
    }
  }

  // Stubs for future implementation
  async sendBlockerEscalationMail() {
    console.log('Not implemented yet');
  }

  async sendSprintStartedMail() {
    console.log('Not implemented yet');
  }
}

export const emailService = new EmailService();
