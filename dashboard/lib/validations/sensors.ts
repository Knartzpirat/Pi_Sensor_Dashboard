import { z } from 'zod';

/**
 * Create sensor validation
 * Fixed: Use z.enum() instead of z.nativeEnum() for connection types
 */
export const createSensorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters')
    .trim(),
  driver: z
    .string()
    .min(1, 'Driver is required')
    .max(100, 'Driver must not exceed 100 characters'),
  connectionType: z.enum(['i2c', 'adc', 'io'], {
    errorMap: () => ({ message: 'Invalid connection type' }),
  }),
  boardType: z
    .string()
    .min(1, 'Board type is required')
    .max(50, 'Board type must not exceed 50 characters'),
  pin: z
    .number()
    .int('Pin must be an integer')
    .min(0, 'Pin must be non-negative')
    .max(100, 'Pin must not exceed 100')
    .optional()
    .nullable(),
  connectionParams: z.record(z.unknown()).optional(),
  pollInterval: z
    .number()
    .int('Poll interval must be an integer')
    .min(100, 'Poll interval must be at least 100ms')
    .max(3600000, 'Poll interval must not exceed 1 hour'),
  enabled: z.boolean().default(true),
  calibration: z.record(z.unknown()).optional(),
});

export type CreateSensorInput = z.infer<typeof createSensorSchema>;

/**
 * Update sensor validation
 */
export const updateSensorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters')
    .trim()
    .optional(),
  driver: z
    .string()
    .min(1, 'Driver is required')
    .max(100, 'Driver must not exceed 100 characters')
    .optional(),
  connectionType: z.enum(['i2c', 'adc', 'io']).optional(),
  boardType: z
    .string()
    .min(1, 'Board type is required')
    .max(50, 'Board type must not exceed 50 characters')
    .optional(),
  pin: z
    .number()
    .int('Pin must be an integer')
    .min(0, 'Pin must be non-negative')
    .max(100, 'Pin must not exceed 100')
    .optional()
    .nullable(),
  connectionParams: z.record(z.unknown()).optional(),
  pollInterval: z
    .number()
    .int('Poll interval must be an integer')
    .min(100, 'Poll interval must be at least 100ms')
    .max(3600000, 'Poll interval must not exceed 1 hour')
    .optional(),
  enabled: z.boolean().optional(),
  calibration: z.record(z.unknown()).optional(),
});

export type UpdateSensorInput = z.infer<typeof updateSensorSchema>;

/**
 * Sensor ID parameter validation
 * Note: Uses cuid() to match Prisma's default ID format
 */
export const sensorIdSchema = z.object({
  id: z.string().cuid('Invalid sensor ID format'),
});

export type SensorIdParam = z.infer<typeof sensorIdSchema>;
