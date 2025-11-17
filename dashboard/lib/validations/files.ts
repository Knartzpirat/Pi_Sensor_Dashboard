import { z } from 'zod';
import { EntityType } from '@prisma/client';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

/**
 * Allowed document MIME types
 */
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
] as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * File upload validation
 */
export const uploadFileSchema = z.object({
  entityId: z
    .string()
    .cuid('Invalid entity ID format'),
  entityType: z.nativeEnum(EntityType, {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }),
  images: z
    .array(
      z.object({
        file: z.instanceof(File),
        order: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        file: z.instanceof(File),
        order: z.number().int().min(0).optional(),
      })
    )
    .optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `File size must not exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB` };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { valid: false, error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return { valid: false, error: `File size must not exceed ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB` };
  }

  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type as typeof ALLOWED_DOCUMENT_TYPES[number])) {
    return { valid: false, error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Update picture validation (name or order)
 */
export const updatePictureSchema = z.object({
  originalName: z
    .string()
    .min(1, 'Original name must not be empty')
    .max(255, 'Original name must not exceed 255 characters')
    .optional(),
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative')
    .optional(),
}).refine((data) => data.originalName !== undefined || data.order !== undefined, {
  message: 'At least one of originalName or order must be provided',
});

export type UpdatePictureInput = z.infer<typeof updatePictureSchema>;

/**
 * Update document validation (name or order)
 */
export const updateDocumentSchema = z.object({
  originalName: z
    .string()
    .min(1, 'Original name must not be empty')
    .max(255, 'Original name must not exceed 255 characters')
    .optional(),
  order: z
    .number()
    .int('Order must be an integer')
    .min(0, 'Order must be non-negative')
    .optional(),
}).refine((data) => data.originalName !== undefined || data.order !== undefined, {
  message: 'At least one of originalName or order must be provided',
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

/**
 * Move picture validation
 */
export const movePictureSchema = z.object({
  direction: z.enum(['up', 'down'], {
    errorMap: () => ({ message: 'Direction must be "up" or "down"' }),
  }),
});

export type MovePictureInput = z.infer<typeof movePictureSchema>;

/**
 * Picture/Document ID parameter validation
 * Note: Uses cuid() to match Prisma's default ID format
 */
export const fileIdSchema = z.object({
  id: z.string().cuid('Invalid file ID format'),
});

export type FileIdParam = z.infer<typeof fileIdSchema>;
