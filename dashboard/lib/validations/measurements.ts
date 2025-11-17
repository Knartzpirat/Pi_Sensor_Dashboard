import { z } from 'zod';

/**
 * Create measurement validation
 */
export const createMeasurementSchema = z.object({
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
  sensors: z
    .array(
      z.object({
        sensorId: z.string().cuid('Invalid sensor ID format'),
        testObjectId: z.string().cuid('Invalid test object ID format').optional().nullable(),
      })
    )
    .min(1, 'At least one sensor is required')
    .max(50, 'Cannot add more than 50 sensors to a measurement'),
  interval: z
    .number()
    .min(0.1, 'Interval must be at least 0.1 seconds')
    .max(3600, 'Interval must not exceed 1 hour')
    .optional(),
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 second')
    .max(86400, 'Duration must not exceed 24 hours')
    .optional()
    .nullable(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;

/**
 * Update measurement validation
 */
export const updateMeasurementSchema = z.object({
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
  status: z.enum(['STARTING', 'RUNNING', 'COMPLETED', 'FAILED', 'STOPPED']).optional(),
});

export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

/**
 * Measurement ID parameter validation
 * Note: Uses cuid() to match Prisma's default ID format
 */
export const measurementIdSchema = z.object({
  id: z.string().cuid('Invalid measurement ID format'),
});

export type MeasurementIdParam = z.infer<typeof measurementIdSchema>;
