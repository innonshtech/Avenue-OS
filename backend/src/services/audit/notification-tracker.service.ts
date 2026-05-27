import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export class NotificationTrackerService {
  static async sendNotification(data: {
    type: string;
    title: string;
    description: string;
    senderId: string;
    receiverId: string;
    receiverEmail: string;
    taskId?: string;
    sprintId?: string;
    projectId?: string;
  }) {
    let mailSent = false;
    let deliveryStatus = 'PENDING';
    let errorMessage = null;

    try {
      if (data.receiverEmail && process.env.SMTP_USER) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"SprintOS" <noreply@sprintos.com>',
          to: data.receiverEmail,
          subject: data.title,
          text: data.description,
          html: `<p>${data.description}</p>`,
        });
        mailSent = true;
        deliveryStatus = 'DELIVERED';
      } else {
        deliveryStatus = 'FAILED_NO_EMAIL_CONFIG';
      }
    } catch (error: any) {
      console.error('Failed to send email:', error);
      deliveryStatus = 'FAILED';
      errorMessage = error.message;
    }

    try {
      await prisma.notificationHistory.create({
        data: {
          type: data.type,
          title: data.title,
          description: data.description,
          senderId: data.senderId,
          receiverId: data.receiverId,
          taskId: data.taskId,
          sprintId: data.sprintId,
          projectId: data.projectId,
          mailSent,
          deliveryStatus,
        },
      });

      if (data.receiverEmail) {
        await prisma.emailLog.create({
          data: {
            recipient: data.receiverEmail,
            subject: data.title,
            status: deliveryStatus,
            errorMessage: errorMessage,
            taskId: data.taskId,
            provider: 'nodemailer',
          }
        });
      }
    } catch (error) {
      console.error('Failed to log notification history:', error);
    }
  }

  static async getMemberNotifications(receiverId: string) {
    return prisma.notificationHistory.findMany({
      where: { receiverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllNotifications() {
     return prisma.notificationHistory.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
