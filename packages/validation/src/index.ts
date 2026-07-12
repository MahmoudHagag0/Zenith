import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const registerSchema = z.object({
  email: z.string().email().max(254, 'Email must be at most 254 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().max(254, 'Email must be at most 254 characters'),
  password: z.string().min(1, 'Password is required').max(128, 'Password must be at most 128 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
