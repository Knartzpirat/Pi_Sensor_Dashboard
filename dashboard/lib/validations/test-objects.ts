import { z } from 'zod';

/**
 * Create test object validation
 */
export const createTestObjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional()
    .nullable(),
  labelIds: z
    .array(z.string().cuid('Invalid label ID format'))
    .optional()
    .nullable(),
});

export type CreateTestObjectInput = z.infer<typeof createTestObjectSchema>;

/**
 * Update test object validation
 */
export const updateTestObjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional()
    .nullable(),
  labelIds: z
    .array(z.string().cuid('Invalid label ID format'))
    .optional()
    .nullable(),
});

export type UpdateTestObjectInput = z.infer<typeof updateTestObjectSchema>;

/**
 * Test object ID parameter validation
 * Note: Uses cuid() to match Prisma's default ID format
 */
export const testObjectIdSchema = z.object({
  id: z.string().cuid('Invalid test object ID format'),
});

export type TestObjectIdParam = z.infer<typeof testObjectIdSchema>;
