import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { hasPermission } from '../utils/permissionHelper';
import { notificationService } from '../services/notifications/notification.service';
import { inAppNotificationService } from '../services/notifications/inapp-notification.service';
import { ActivityTrackerService } from '../services/audit/activity-tracker.service';
import { getIO } from '../sockets/socket.server';
import { SOCKET_EVENTS } from '../sockets/socket.events';
import { ChatService } from '../modules/chat/chat.service';

const taskListInclude = {
  assignee: true,
  originalAssignee: true,
  delegatedBy: true,
  creator: true,
  project: true,
  target: true,
  subtasks: {
    select: { id: true, assigneeId: true, title: true, isCompleted: true },
  },
  rfis: {
    where: { isResolved: false }
  }
};

const subtaskInclude = {
  assignee: true,
};

const userTaskVisibilityFilter = (userId: string) => ({
  isArchived: false,
  OR: [
    { assigneeId: userId },
    { originalAssigneeId: userId },
    { delegatedById: userId },
    { creatorId: userId },
    { subtasks: { some: { assigneeId: userId } } },
  ],
});

async function enrichTaskActivities(activities: { id: string; action: string; oldValue: string | null; newValue: string | null; user?: any; createdAt: Date }[]) {
  const userIds = new Set<string>();
  for (const activity of activities) {
    if (activity.action === 'ASSIGNEE_CHANGED') {
      if (activity.oldValue) userIds.add(activity.oldValue);
      if (activity.newValue) userIds.add(activity.newValue);
    }
  }

  const users = userIds.size
    ? await prisma.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return activities.map((activity) => {
    if (activity.action === 'ASSIGNEE_CHANGED') {
      const fromName = activity.oldValue ? nameById.get(activity.oldValue) || 'Unknown' : 'Unassigned';
      const toName = activity.newValue ? nameById.get(activity.newValue) || 'Unknown' : 'Unassigned';
      return { ...activity, oldAssigneeName: fromName, newAssigneeName: toName };
    }
    return activity;
  });
}

async function notifyDelegatedTrackers(
  task: { id: string; key: string; title: string; assigneeId: string | null; originalAssigneeId: string | null; delegatedById: string | null; creatorId: string },
  performerId: string | undefined,
  title: string,
  message: string
) {
  const trackerIds = new Set<string>();
  if (task.delegatedById && task.delegatedById !== task.assigneeId) {
    trackerIds.add(task.delegatedById);
  }
  if (task.originalAssigneeId && task.originalAssigneeId !== task.assigneeId) {
    trackerIds.add(task.originalAssigneeId);
  }
  if (task.creatorId && task.creatorId !== task.assigneeId) {
    trackerIds.add(task.creatorId);
  }

  for (const trackerId of trackerIds) {
    if (trackerId !== performerId) {
      await inAppNotificationService.createNotification(
        trackerId,
        'STATUS_CHANGE',
        title,
        message,
        '/dashboard/my-tasks'
      );
    }
  }
}

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId, targetId, assigneeId, isArchived } = req.query;
    const user = req.user;
    const canViewAll = user ? await hasPermission(user.role, 'VIEW_ALL_TASKS') : false;
    
    const query: any = {};
    if (projectId) query.projectId = String(projectId);
    if (targetId) query.targetId = String(targetId);
    
    if (assigneeId) {
      query.assigneeId = String(assigneeId);
    }

    if (user && !canViewAll) {
      Object.assign(query, userTaskVisibilityFilter(user.id));
    } else {
      query.isArchived = isArchived === 'true';
    }

    const tasks = await prisma.task.findMany({
      where: query,
      include: taskListInclude,
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
        originalAssignee: true,
        delegatedBy: true,
        creator: true,
        project: true,
        target: true,
        rfis: true,
        subtasks: {
          include: subtaskInclude,
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

    const enrichedActivities = await enrichTaskActivities(task.activities);

    res.status(200).json({ ...task, activities: enrichedActivities });
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
        originalAssigneeId: assigneeId || null,
        delegatedById: assigneeId && assigneeId !== creatorId ? creatorId : null,
        creatorId,
      },
      include: {
        assignee: true,
        originalAssignee: true,
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

    await prisma.taskActivity.create({
      data: {
        taskId: task.id,
        userId: creatorId,
        action: 'TASK_CREATED',
        newValue: task.assignee?.name || 'Unassigned',
      },
    });

    await ActivityTrackerService.logActivity({
      userId: creatorId,
      actionType: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      title: `Created Task ${task.key}`,
      description: task.assignee
        ? `${creatorName} created "${task.title}" and assigned it to ${task.assignee.name}.`
        : `${creatorName} created "${task.title}".`,
    });

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

    const canManageTasks = user ? await hasPermission(user.role, 'CREATE_TASK') : false;
    const canAssignTasks = user ? await hasPermission(user.role, 'ASSIGN_TASK') : false;
    const isCurrentAssignee = existingTask.assigneeId === user?.id;
    const isOriginalAssignee = existingTask.originalAssigneeId === user?.id;
    const isDelegatedBy = existingTask.delegatedById === user?.id;
    const isCreator = existingTask.creatorId === user?.id;

    if (!canManageTasks && !isCurrentAssignee && !isOriginalAssignee && !isDelegatedBy && !isCreator) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own assigned tasks' });
    }

    const { title, description, taskCategory, type, status, priority, storyPoints, estimatedHours, actualHours, drawingNumber, revisionNumber, targetId, assigneeId, dueDate, startDate, acceptanceCriteria, labels } = req.body;

    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId && !canAssignTasks && !canManageTasks) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to reassign tasks' });
    }

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
    if (assigneeId !== undefined) {
      const assigneeChanged = assigneeId !== existingTask.assigneeId;
      dataToUpdate.assigneeId = assigneeId;

      if (assigneeChanged && user?.id) {
        dataToUpdate.delegatedById = user.id;

        if (existingTask.assigneeId === user.id) {
          dataToUpdate.originalAssigneeId = user.id;
        } else if (existingTask.assigneeId) {
          dataToUpdate.originalAssigneeId = existingTask.assigneeId;
        } else if (assigneeId && !existingTask.originalAssigneeId) {
          dataToUpdate.originalAssigneeId = assigneeId;
        }
      } else if (assigneeId && !existingTask.originalAssigneeId) {
        dataToUpdate.originalAssigneeId = assigneeId;
      }
    }
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (acceptanceCriteria !== undefined) dataToUpdate.acceptanceCriteria = acceptanceCriteria;
    if (labels !== undefined) dataToUpdate.labels = labels;

    const task = await prisma.task.update({
      where: { id },
      data: dataToUpdate,
      include: {
        assignee: true,
        originalAssignee: true,
        delegatedBy: true,
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
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      const oldAssignee = existingTask.assigneeId
        ? await prisma.user.findUnique({ where: { id: existingTask.assigneeId }, select: { name: true } })
        : null;
      const newAssignee = assigneeId
        ? await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } })
        : null;

      if (task.assigneeId && task.assigneeId !== user?.id) {
        await inAppNotificationService.createNotification(
          task.assigneeId,
          'ASSIGNED',
          `Task Assigned: ${task.key}`,
          `${performerName} assigned task "${task.title}" to you.`,
          `/dashboard/boards`
        );
      }

      if (existingTask.assigneeId && existingTask.assigneeId !== user?.id) {
        await inAppNotificationService.createNotification(
          existingTask.assigneeId,
          'STATUS_CHANGE',
          `Task Reassigned: ${task.key}`,
          `${performerName} reassigned task "${task.title}" to ${newAssignee?.name || 'someone else'}.`,
          `/dashboard/my-tasks`
        );
      }

      await notifyDelegatedTrackers(
        {
          ...task,
          originalAssigneeId: existingTask.originalAssigneeId,
          delegatedById: dataToUpdate.delegatedById ?? existingTask.delegatedById,
          creatorId: existingTask.creatorId,
        },
        user?.id,
        `Task Reassigned: ${task.key}`,
        `${performerName} reassigned "${task.title}" from ${oldAssignee?.name || 'Unassigned'} to ${newAssignee?.name || 'Unassigned'}.`
      );

      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: user?.id || 'SYSTEM',
          action: 'ASSIGNEE_CHANGED',
          oldValue: existingTask.assigneeId,
          newValue: assigneeId,
        }
      });
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

        await notifyDelegatedTrackers(
          {
            ...task,
            originalAssigneeId: existingTask.originalAssigneeId,
            delegatedById: existingTask.delegatedById,
            creatorId: existingTask.creatorId,
          },
          user?.id,
          `Delegated Task Updated: ${task.key}`,
          `${performerName} updated ${changes.join(', ')} on "${task.title}" (now with ${task.assignee?.name || 'assignee'}).`
        );
      }
    }

    if (statusChanged) {
      await prisma.taskActivity.create({
        data: {
          taskId: task.id,
          userId: user?.id || 'SYSTEM',
          action: 'STATUS_CHANGED',
          oldValue: existingTask.status,
          newValue: status,
        },
      });
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
    
    const canDelete = user ? await hasPermission(user.role, 'DELETE_TASK') : false;
    if (!canDelete) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to delete tasks' });
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
    
    const canArchive = user ? await hasPermission(user.role, 'DELETE_TASK') : false;
    if (!canArchive) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to archive tasks' });
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
    
    const canRestore = user ? await hasPermission(user.role, 'DELETE_TASK') : false;
    if (!canRestore) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to restore tasks' });
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
    
    const canManageTasks = user ? await hasPermission(user.role, 'CREATE_TASK') : false;
    if (!canManageTasks && existingTask.assigneeId !== user?.id) {
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
      where: userTaskVisibilityFilter(userId),
      include: {
        ...taskListInclude,
        subtasks: {
          include: subtaskInclude,
        },
      },
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
    
    const canResolve = user ? await hasPermission(user.role, 'RESOLVE_RFI') : false;
    if (!canResolve) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to resolve RFIs' });
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
