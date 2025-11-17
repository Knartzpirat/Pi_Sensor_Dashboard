import { z } from 'zod';
import { EntityType } from '@prisma/client';

/**
 * Create label validation
 */
export const createLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code (e.g., #FF5733)')
    .optional()
    .nullable(),
  type: z.nativeEnum(EntityType, {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }),
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;

/**
 * Update label validation
 */
export const updateLabelSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code (e.g., #FF5733)')
    .optional()
    .nullable(),
});

export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

/**
 * Label ID parameter validation
 * Note: Uses cuid() to match Prisma's default ID format
 */
export const labelIdSchema = z.object({
  id: z.string().cuid('Invalid label ID format'),
});

export type LabelIdParam = z.infer<typeof labelIdSchema>;
