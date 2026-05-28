import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    type: z.enum(['STORY', 'BUG', 'TASK', 'EPIC']).optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'IN_TESTING', 'DONE', 'CANCELED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    storyPoints: z.number().nullable().optional(),
    dueDate: z.string().datetime({ precision: 3 }).nullable().optional().or(z.string().nullable().optional()),
    projectId: z.string().uuid('Invalid project ID format'),
    sprintId: z.string().uuid('Invalid sprint ID format').nullable().optional(),
    assigneeId: z.string().uuid('Invalid assignee ID format').nullable().optional(),
    labels: z.array(z.string()).optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'IN_TESTING', 'DONE', 'CANCELED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    storyPoints: z.number().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    sprintId: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
  }),
});

export const resolveBlockerSchema = z.object({
  body: z.object({
    resolutionNote: z.string().min(2, 'Resolution note must be at least 2 characters'),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty'),
  }),
});
