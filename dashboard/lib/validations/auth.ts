import { z } from 'zod';

/**
 * Login request validation
 */
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters'),
  stayLoggedIn: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Recovery code verification
 */
export const verifyRecoveryCodeSchema = z.object({
  recoveryCode: z
    .string()
    .min(1, 'Recovery code is required')
    .regex(/^[A-Z0-9-]+$/, 'Invalid recovery code format')
    .transform((val) => val.toUpperCase().replace(/-/g, '')),
});

export type VerifyRecoveryCodeInput = z.infer<typeof verifyRecoveryCodeSchema>;

/**
 * Reset password request
 */
export const resetPasswordSchema = z.object({
  recoveryCode: z
    .string()
    .min(1, 'Recovery code is required'),
  userId: z
    .string()
    .cuid('Invalid user ID format'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Setup request validation
 */
export const setupSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  databaseUrl: z
    .string()
    .url('Invalid database URL')
    .startsWith('postgresql://', 'Database URL must be a PostgreSQL connection string'),
});

export type SetupInput = z.infer<typeof setupSchema>;
