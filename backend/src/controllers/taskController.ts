import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { notificationService } from '../services/notifications/notification.service';
import { inAppNotificationService } from '../services/notifications/inapp-notification.service';
import { ActivityTrackerService } from '../services/audit/activity-tracker.service';
import { getIO } from '../sockets/socket.server';
import { SOCKET_EVENTS } from '../sockets/socket.events';
import { ChatService } from '../modules/chat/chat.service';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId, targetId, assigneeId, isArchived } = req.query;
    
    const query: any = {};
    if (projectId) query.projectId = String(projectId);
    if (targetId) query.targetId = String(targetId);
    
    if (assigneeId) {
      query.assigneeId = String(assigneeId);
    }
    
    query.isArchived = isArchived === 'true';

    const tasks = await prisma.task.findMany({
      where: query,
      include: {
        assignee: true,
        project: true,
        target: true,
        rfis: {
          where: { isResolved: false }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        creator: true,
        project: true,
        target: true,
        rfis: true,
        subtasks: {
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        progressReports: {
          include: { user: true },
          orderBy: { date: 'desc' }
        },
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'asc' }
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { key, title, description, taskCategory, type, status, priority, storyPoints, estimatedHours, actualHours, drawingNumber, revisionNumber, projectId, targetId, assigneeId, creatorId } = req.body;

    const task = await prisma.task.create({
      data: {
        key,
        title,
        description,
        taskCategory: taskCategory || 'DESIGN',
        type: type || 'MODELING',
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        storyPoints: storyPoints ? parseInt(storyPoints) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        actualHours: actualHours ? parseFloat(actualHours) : null,
        drawingNumber,
        revisionNumber,
        projectId,
        targetId,
        assigneeId,
        creatorId,
      },
      include: {
        assignee: true,
        project: true,
        target: true,
        rfis: true
      }
    });

    const dbCreator = creatorId ? await prisma.user.findUnique({ where: { id: creatorId } }) : null;
    const creatorName = dbCreator?.name || 'Saket';

    let emailTriggered = false;
    if (task.assignee) {
      emailTriggered = await notificationService.handleTaskAssignment({
        assigneeEmail: task.assignee.email,
        assigneeName: task.assignee.name,
        projectName: task.project.name,
        sprintName: task.target ? task.target.name : 'Unassigned',
        taskTitle: task.title,
        taskKey: task.key,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No due date',
        storyPoints: task.storyPoints ? task.storyPoints.toString() : 'Unestimated',
        description: task.description || '',
        acceptanceCriteria: task.acceptanceCriteria || '',
        taskId: task.id
      });

      // Send in-app notification to assignee
      await inAppNotificationService.createNotification(
        task.assigneeId!,
        'ASSIGNED',
        `New Task Assigned: ${task.key}`,
        `${creatorName} assigned task "${task.title}" to you.`,
        `/dashboard/boards`
      );
    }

    try {
      const io = getIO();
      io.to(`project:${projectId}`).to('organization').emit(SOCKET_EVENTS.TASK_UPDATED, {
        action: 'CREATE',
        taskId: task.id,
        projectId
      });
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task,
      emailTriggered,
    });
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A task with this key already exists.' });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // Check edit permission
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    const dbUser = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
    const performerName = dbUser?.name || 'Saket';

    if (user && user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN' && existingTask.assigneeId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own assigned tasks' });
    }

    const { title, description, taskCategory, type, status, priority, storyPoints, estimatedHours, actualHours, drawingNumber, revisionNumber, targetId, assigneeId, dueDate, startDate, acceptanceCriteria, labels } = req.body;

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (taskCategory !== undefined) dataToUpdate.taskCategory = taskCategory;
    if (type !== undefined) dataToUpdate.type = type;
    if (estimatedHours !== undefined) dataToUpdate.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    if (actualHours !== undefined) dataToUpdate.actualHours = actualHours ? parseFloat(actualHours) : null;
    const fromInternalReviewToDone = (existingTask.status === 'INTERNAL_REVIEW' && status === 'DONE');
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (fromInternalReviewToDone) {
        dataToUpdate.completedAt = new Date();
        dataToUpdate.completedById = user?.id;
      }
    }
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (storyPoints !== undefined) dataToUpdate.storyPoints = storyPoints ? parseInt(storyPoints) : null;
    if (drawingNumber !== undefined) dataToUpdate.drawingNumber = drawingNumber;
    if (revisionNumber !== undefined) dataToUpdate.revisionNumber = revisionNumber;
    if (targetId !== undefined) dataToUpdate.targetId = targetId;
    if (assigneeId !== undefined) dataToUpdate.assigneeId = assigneeId;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (acceptanceCriteria !== undefined) dataToUpdate.acceptanceCriteria = acceptanceCriteria;
    if (labels !== undefined) dataToUpdate.labels = labels;

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: true,
        project: true,
        rfis: {
          where: { isResolved: false }
        }
      }
    });

    const statusChanged = status !== undefined && status !== existingTask.status;
    
    if (fromInternalReviewToDone) {
      // 1. Log activity for the user who completed the task
      await ActivityTrackerService.logActivity({
        userId: user?.id || 'SYSTEM',
        actionType: 'TASK_COMPLETED_FROM_REVIEW',
        entityType: 'TASK',
        entityId: task.id,
        title: `Completed Task from Internal Review`,
        description: `Moved task ${task.key} from INTERNAL REVIEW to DONE.`,
      });

      // 2. Log activity for Project Manager
      const pm = await prisma.user.findFirst({
        where: { role: 'PROJECT_MANAGER' }
      });
      if (pm && pm.id !== user?.id) {
        await ActivityTrackerService.logActivity({
          userId: pm.id,
          actionType: 'TASK_COMPLETED_FROM_REVIEW',
          entityType: 'TASK',
          entityId: task.id,
          title: `Engineer completed task from Internal Review`,
          description: `${performerName} moved task ${task.key} from INTERNAL REVIEW to DONE.`,
        });
      }
    } else if (status === 'DONE' && existingTask.status !== 'DONE') {
      const { AuditEngineService } = await import('../services/audit/audit.service');
      await AuditEngineService.logAction(
        user?.id || 'SYSTEM',
        'TASK_COMPLETED',
        'TASK',
        task.id,
        `Task Completed: ${task.title}`,
        `${performerName} completed task ${task.key}`
      );
    }

    // In-app notifications for task assignments and updates
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId && task.assigneeId && task.assigneeId !== user?.id) {
      await inAppNotificationService.createNotification(
        task.assigneeId,
        'ASSIGNED',
        `Task Assigned: ${task.key}`,
        `${performerName} assigned task "${task.title}" to you.`,
        `/dashboard/boards`
      );
    } else if (task.assigneeId && task.assigneeId !== user?.id) {
      const changes: string[] = [];
      if (title !== undefined && title !== existingTask.title) changes.push('title');
      if (description !== undefined && description !== existingTask.description) changes.push('description');
      if (statusChanged) changes.push(`status to ${status}`);
      if (priority !== undefined && priority !== existingTask.priority) changes.push(`priority to ${priority}`);
      if (targetId !== undefined && targetId !== existingTask.targetId) changes.push('target');

      if (changes.length > 0) {
        await inAppNotificationService.createNotification(
          task.assigneeId,
          'STATUS_CHANGE',
          `Task Updated: ${task.key}`,
          `${performerName} updated the ${changes.join(', ')} of your assigned task "${task.title}".`,
          `/dashboard/boards`
        );
      }
    }

    try {
      const io = getIO();
      io.to(`project:${task.projectId}`).to('organization').emit(SOCKET_EVENTS.TASK_UPDATED, {
        action: 'UPDATE',
        taskId: task.id,
        projectId: task.projectId
      });
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Managers or Admins can delete tasks' });
    }

    // Soft delete: remove target and archive
    const task = await prisma.task.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedById: user?.id,
        targetId: null // Remove from target
      }
    });
    
    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      user?.id || 'SYSTEM',
      'TASK_DELETED',
      'TASK',
      task.id,
      `Task Deleted: ${task.title}`,
      `${user?.name || 'User'} deleted task ${task.key}`
    );

    try {
      const io = getIO();
      io.to(`project:${task.projectId}`).to('organization').emit(SOCKET_EVENTS.TASK_UPDATED, {
        action: 'DELETE',
        taskId: task.id,
        projectId: task.projectId
      });
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(200).json({ message: 'Task deleted successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

export const archiveTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Managers or Admins can archive tasks' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedById: user?.id,
      }
    });
    
    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      user?.id || 'SYSTEM',
      'TASK_ARCHIVED',
      'TASK',
      task.id,
      `Task Archived: ${task.title}`,
      `${user?.name || 'User'} archived task ${task.key}`
    );

    res.status(200).json({ message: 'Task archived successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive task' });
  }
};

export const restoreTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Managers or Admins can restore tasks' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        isArchived: false,
        archivedAt: null,
        archivedById: null,
      }
    });
    
    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      user?.id || 'SYSTEM',
      'TASK_RESTORED',
      'TASK',
      task.id,
      `Task Restored: ${task.title}`,
      `${user?.name || 'User'} restored task ${task.key}`
    );

    res.status(200).json({ message: 'Task restored successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore task' });
  }
};

export const moveSprint = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { targetId } = req.body;
    const user = req.user;
    
    // Check edit permission
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });
    
    if (user && user.role !== 'PROJECT_MANAGER' && user.role !== 'ADMIN' && existingTask.assigneeId !== user.id) {
      return res.status(403).json({ error: 'Forbidden: You can only move your own assigned tasks' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: { targetId }
    });

    try {
      const io = getIO();
      io.to(`project:${task.projectId}`).to('organization').emit(SOCKET_EVENTS.TASK_UPDATED, {
        action: 'MOVE_TARGET',
        taskId: task.id,
        projectId: task.projectId
      });
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(200).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to move task to target' });
  }
};

export const getMyTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: { project: true, target: true, rfis: { where: { isResolved: false } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

export const addBlocker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { description, severity, type, helperId } = req.body;
    const rfi = await prisma.rFI.create({
      data: {
        description,
        severity: severity || 'HIGH',
        type: type || 'ARCHITECTURAL_CLARIFICATION',
        helperId,
        taskId: id,
        reporterId: userId,
      }
    });

    try {
      const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
      if (task?.projectId) {
        const io = getIO();
        io.to(`project:${task.projectId}`).to('organization').emit(SOCKET_EVENTS.RFI_ADDED, {
          rfi,
          projectId: task.projectId,
          taskId: id
        });
      }
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(201).json(rfi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create RFI' });
  }
};

export const addQuickUpdate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    
    const { updateText } = req.body;
    const activity = await prisma.taskActivity.create({
      data: {
        taskId: id,
        userId: userId,
        action: 'QUICK_UPDATE',
        newValue: updateText
      }
    });
    res.status(201).json(activity);
  } catch(error) {
    res.status(500).json({ error: 'Failed to create quick update' });
  }
};

export const resolveBlocker = async (req: Request, res: Response) => {
  try {
    const { id, blockerId } = req.params;
    const user = req.user as any;
    
    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only Project Manager or Admin can resolve RFIs' });
    }

    const { resolutionNote } = req.body;
    
    const rfi = await prisma.rFI.update({
      where: { id: blockerId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedById: user?.id,
        resolutionNote
      }
    });

    const { AuditEngineService } = await import('../services/audit/audit.service');
    await AuditEngineService.logAction(
      user?.id || 'SYSTEM',
      'RFI_RESOLVED',
      'RFI',
      rfi.id,
      `RFI Resolved`,
      `${user?.name || 'User'} resolved RFI with note: ${resolutionNote || 'No note'}`
    );

    try {
      const task = await prisma.task.findUnique({ where: { id }, select: { projectId: true } });
      if (task?.projectId) {
        const io = getIO();
        io.to(`project:${task.projectId}`).to('organization').emit(SOCKET_EVENTS.RFI_RESOLVED, {
          rfiId: blockerId,
          projectId: task.projectId,
          taskId: id
        });
      }
    } catch (wsError) {
      console.warn('WebSocket emission failed:', wsError);
    }

    res.status(200).json(rfi);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve RFI' });
  }
};
