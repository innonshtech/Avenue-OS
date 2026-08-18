import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character'),
    role: z.enum([
      'ADMIN', 'DIRECTOR', 'ASSOCIATE_DIRECTOR', 'PROJECT_MANAGER',
      'LEAD_ENGINEER', 'DESIGN_ENGINEER', 'ENGINEER', 'JR_DRAFTSMAN', 'INTERN',
      'PRINCIPAL_ENGINEER', 'DRAFTSMAN', 'ARCHITECT', 'CLIENT'
    ]),
    department: z.string().min(1, 'Department is required'),
    avatar: z.string().url().optional().or(z.string().length(0)),
  }),
});
