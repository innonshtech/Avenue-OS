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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Standup Reminder</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4f5f7; padding: 40px 0;">
            <tr>
              <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #4f46e5; padding: 32px 40px; text-align: left;">
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <span style="color: #ffffff; font-size: 24px; font-weight: 800; tracking-tight: -0.025em; font-family: -apple-system, sans-serif;">Innonsh SprintOS</span>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 40px 40px 30px 40px;">
                      <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px; font-weight: 700; line-height: 1.3;">Daily Standup Submission Reminder</h2>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        Hi <strong>${userName}</strong>,
                      </p>
                      <p style="margin: 0 0 24px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                        This is an official automated reminder to submit your daily standup update for today. Keeping the team aligned and tracking blockages in real-time is critical to our current sprint progress.
                      </p>
                      
                      <!-- Action Button -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="https://sprintos.innonsh.com/dashboard/standups" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: background-color 0.2s;">
                              Submit Daily Standup
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0 0 12px 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                        Please note: Daily standup records should be submitted before the end of your working hours to ensure they are captured in the sprint analytics report.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px 40px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: left;">
                      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">
                        This email was sent automatically by Innonsh SprintOS in accordance with project management policy. Please do not reply directly to this mailbox.
                      </p>
                      <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.4;">
                        &copy; 2026 Innonsh Technologies. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
