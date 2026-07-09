import { z } from 'zod';

export const createTargetSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Target name must be at least 2 characters'),
    goal: z.string().optional().nullable(),
    startDate: z.string().datetime().or(z.string()), // handles standard date strings and ISO datetimes
    endDate: z.string().datetime().or(z.string()),
    projectId: z.string().uuid('Invalid project ID format'),
    status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELED']).optional(),
  }),
});

export const updateTargetSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    goal: z.string().optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELED']).optional(),
  }),
});
