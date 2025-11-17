import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure random filename
 * Uses crypto.randomBytes instead of Math.random()
 */
export function generateSecureFilename(originalExtension: string): string {
  const timestamp = Date.now();
  const randomId = randomBytes(16).toString('hex'); // 32 hex chars
  return `${timestamp}-${randomId}.${originalExtension}`;
}

/**
 * Validate file extension against allowed list
 * Case-insensitive comparison
 */
export function isValidExtension(filename: string, allowedExtensions: readonly string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  return allowedExtensions.includes(ext);
}

/**
 * Sanitize filename to prevent path traversal attacks
 * Removes dangerous characters and patterns
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove special characters
    .replace(/^\.+/, '') // Remove leading dots
    .trim();
}

/**
 * Detect MIME type from file buffer (magic bytes)
 * More secure than trusting client-provided MIME type
 */
export function detectMimeType(buffer: Buffer): string | null {
  // Check magic bytes for common file types

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return 'image/png';
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // PDF: 25 50 44 46 (%PDF)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

/**
 * Validate that file content matches expected MIME type
 * Prevents MIME type spoofing attacks
 */
export function validateMimeType(
  buffer: Buffer,
  expectedMimeType: string,
  allowedMimeTypes: readonly string[]
): { valid: boolean; actualMimeType: string | null; error?: string } {
  const actualMimeType = detectMimeType(buffer);

  if (!actualMimeType) {
    return {
      valid: false,
      actualMimeType: null,
      error: 'Unable to detect file type from content',
    };
  }

  if (!allowedMimeTypes.includes(actualMimeType)) {
    return {
      valid: false,
      actualMimeType,
      error: `File type ${actualMimeType} is not allowed`,
    };
  }

  // Warn if client-provided MIME type doesn't match actual content
  if (expectedMimeType !== actualMimeType) {
    console.warn(
      `MIME type mismatch: client provided ${expectedMimeType}, actual is ${actualMimeType}`
    );
  }

  return {
    valid: true,
    actualMimeType,
  };
}

/**
 * Comprehensive file validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedMimeType?: string;
}

export function validateUploadedFile(
  file: File,
  buffer: Buffer,
  allowedExtensions: readonly string[],
  allowedMimeTypes: readonly string[],
  maxSize: number
): FileValidationResult {
  // 1. Check file size
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // 2. Sanitize and validate filename
  const sanitizedFilename = sanitizeFilename(file.name);
  if (!sanitizedFilename) {
    return { valid: false, error: 'Invalid filename' };
  }

  // 3. Validate extension
  if (!isValidExtension(sanitizedFilename, allowedExtensions)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  // 4. Validate MIME type from content (magic bytes)
  const mimeValidation = validateMimeType(buffer, file.type, allowedMimeTypes);
  if (!mimeValidation.valid) {
    return {
      valid: false,
      error: mimeValidation.error,
    };
  }

  return {
    valid: true,
    sanitizedFilename,
    detectedMimeType: mimeValidation.actualMimeType!,
  };
}
