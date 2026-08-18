import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { inAppNotificationService } from '../services/notifications/inapp-notification.service';

const subtaskInclude = {
  assignee: true,
};

export const addSubtask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, assigneeId } = req.body;
    const user = req.user;

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const subtask = await prisma.taskSubtask.create({
      data: {
        title,
        taskId,
        assigneeId: assigneeId || null,
      },
      include: subtaskInclude,
    });

    if (assigneeId && assigneeId !== user.id) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { key: true, title: true } });
      if (task) {
        await inAppNotificationService.createNotification(
          assigneeId,
          'ASSIGNED',
          `Subtask Assigned: ${task.key}`,
          `You were assigned subtask "${title}" on task "${task.title}".`,
          `/dashboard/boards`
        );
      }
    }

    res.status(201).json(subtask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subtask' });
  }
};

export const updateSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isCompleted, title, assigneeId } = req.body;
    const user = req.user;

    const existing = await prisma.taskSubtask.findUnique({
      where: { id },
      include: { task: { select: { key: true, title: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Subtask not found' });

    const data: { isCompleted?: boolean; title?: string; assigneeId?: string | null } = {};
    if (isCompleted !== undefined) data.isCompleted = isCompleted;
    if (title !== undefined) data.title = title;
    if (assigneeId !== undefined) data.assigneeId = assigneeId;

    const subtask = await prisma.taskSubtask.update({
      where: { id },
      data,
      include: subtaskInclude,
    });

    if (assigneeId !== undefined && assigneeId !== existing.assigneeId && assigneeId && assigneeId !== user?.id) {
      await inAppNotificationService.createNotification(
        assigneeId,
        'ASSIGNED',
        `Subtask Assigned: ${existing.task.key}`,
        `You were assigned subtask "${subtask.title}" on task "${existing.task.title}".`,
        `/dashboard/boards`
      );
    }

    res.status(200).json(subtask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subtask' });
  }
};

export const deleteSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.taskSubtask.delete({ where: { id } });
    res.status(200).json({ message: 'Subtask deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
};
