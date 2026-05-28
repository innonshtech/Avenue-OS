import { z } from 'zod';

export const createChannelSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Channel name must be at least 2 characters'),
    description: z.string().optional(),
    type: z.enum(['PROJECT', 'SPRINT', 'TASK', 'BLOCKER', 'ANNOUNCEMENT']),
    projectId: z.string().uuid().optional().nullable(),
    sprintId: z.string().uuid().optional().nullable(),
    taskId: z.string().uuid().optional().nullable(),
    blockerId: z.string().uuid().optional().nullable(),
    memberIds: z.array(z.string().uuid()).optional(),
  }),
});

export const updateChannelSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Message content cannot be empty'),
    messageType: z.enum(['TEXT', 'SYSTEM', 'TASK_REFERENCE']).optional().default('TEXT'),
    parentMessageId: z.string().uuid().optional().nullable(),
  }),
});

export const createDMSchema = z.object({
  body: z.object({
    recipientId: z.string().uuid('Invalid recipient ID format'),
  }),
});

export const reactionSchema = z.object({
  body: z.object({
    emoji: z.string().min(1, 'Emoji is required'),
  }),
});
