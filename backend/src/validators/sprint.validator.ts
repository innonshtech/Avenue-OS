import { z } from 'zod';

export const createSprintSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Sprint name must be at least 2 characters'),
    goal: z.string().optional().nullable(),
    startDate: z.string().datetime().or(z.string()), // handles standard date strings and ISO datetimes
    endDate: z.string().datetime().or(z.string()),
    projectId: z.string().uuid('Invalid project ID format'),
    status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELED']).optional(),
  }),
});

export const updateSprintSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    goal: z.string().optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELED']).optional(),
  }),
});
