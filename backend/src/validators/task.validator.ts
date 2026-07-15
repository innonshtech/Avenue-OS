import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    taskCategory: z.enum(['DESIGN', 'DRAFTING', 'STUDY']).optional(),
    type: z.enum(['MODELING', 'ANALYSIS', 'SITE_CHECK', 'REVIEW']).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'EXTERNAL_REVIEW', 'MODIFICATION_REQUIRED', 'APPROVED', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    storyPoints: z.number().nullable().optional(),
    drawingNumber: z.string().nullable().optional(),
    revisionNumber: z.string().nullable().optional(),
    dueDate: z.string().datetime({ precision: 3 }).nullable().optional().or(z.string().nullable().optional()),
    projectId: z.string().uuid('Invalid project ID format'),
    targetId: z.string().uuid('Invalid target ID format').nullable().optional(),
    assigneeId: z.string().uuid('Invalid assignee ID format').nullable().optional(),
    labels: z.array(z.string()).optional(),
    estimatedHours: z.number().nullable().optional(),
    actualHours: z.number().nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().nullable().optional(),
    taskCategory: z.enum(['DESIGN', 'DRAFTING', 'STUDY']).optional(),
    type: z.string().nullable().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'EXTERNAL_REVIEW', 'MODIFICATION_REQUIRED', 'APPROVED', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
    storyPoints: z.number().nullable().optional(),
    drawingNumber: z.string().nullable().optional(),
    revisionNumber: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    acceptanceCriteria: z.string().nullable().optional(),
    assigneeId: z.string().nullable().optional(),
    targetId: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    estimatedHours: z.number().nullable().optional(),
    actualHours: z.number().nullable().optional(),
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
export const addRFISchema = z.object({
  body: z.object({
    description: z.string().min(2, 'Description must be at least 2 characters'),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    type: z.enum(['ARCHITECTURAL_CLARIFICATION', 'CLIENT_APPROVAL_PENDING', 'SITE_DISCREPANCY', 'RESOURCE_UNAVAILABLE']).optional(),
  }),
});
