import type { Task } from '@/types/core';

export type MyTasksView = 'all' | 'assigned' | 'delegated';

/** Whether the user can see this task in "My Tasks" or their filtered list. */
export function isTaskVisibleToUser(task: Task, userId?: string | null): boolean {
  if (!userId) return false;
  if (task.assigneeId === userId) return true;
  if (task.originalAssigneeId === userId) return true;
  if (task.delegatedById === userId) return true;
  if (task.creatorId === userId) return true;
  if (task.subtasks?.some((st) => st.assigneeId === userId)) return true;
  return false;
}

/** Task is currently assigned to the user. */
export function isTaskAssignedToUser(task: Task, userId?: string | null): boolean {
  return !!userId && task.assigneeId === userId;
}

/** User created or reassigned the task to someone else. */
export function isTaskDelegatedByUser(task: Task, userId?: string | null): boolean {
  if (!userId || task.assigneeId === userId) return false;
  if (task.delegatedById === userId) return true;
  if (task.originalAssigneeId === userId) return true;
  if (task.creatorId === userId) return true;
  return false;
}

/** Badge label for how this task relates to the user on My Tasks. */
export function getTaskTrackingLabel(task: Task, userId?: string | null): string | null {
  if (!userId) return null;
  if (isTaskDelegatedByUser(task, userId)) {
    if (task.delegatedById === userId || task.originalAssigneeId === userId) return 'Delegated by me';
    if (task.creatorId === userId) return 'Created by me';
  }
  if (task.assigneeId === userId) return 'Assigned to me';
  if (task.subtasks?.some((st) => st.assigneeId === userId)) return 'Subtask assigned';
  return null;
}

export function matchesMyTasksView(task: Task, userId: string | undefined, view: MyTasksView): boolean {
  if (!userId || view === 'all') return true;
  if (view === 'assigned') return isTaskAssignedToUser(task, userId);
  if (view === 'delegated') return isTaskDelegatedByUser(task, userId);
  return true;
}
