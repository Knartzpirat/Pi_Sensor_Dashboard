import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError as AppValidationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Validation error response format
 */
export interface ValidationErrorField {
  field: string;
  message: string;
}

/**
 * Format Zod validation errors into a user-friendly format
 */
export function formatZodErrors(error: ZodError): ValidationErrorField[] {
  // ZodError has an issues array with validation errors
  if (!error || !error.issues || !Array.isArray(error.issues)) {
    return [{ field: 'unknown', message: error?.message || 'Validation failed' }];
  }

  return error.issues.map((issue) => ({
    field: issue.path?.join('.') || 'unknown',
    message: issue.message || 'Invalid value',
  }));
}

/**
 * Validate request body with Zod schema
 * Returns parsed data or throws NextResponse with validation errors
 *
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data
 * @throws NextResponse with 400 status if validation fails
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new AppValidationError('Request validation failed', errors);
    }

    return result.data;
  } catch (error) {
    if (error instanceof AppValidationError) {
      throw error;
    }

    // JSON parsing error - log details for debugging
    try {
      logger.error('Failed to parse request body as JSON', error, {
        contentType: request.headers.get('content-type'),
        method: request.method,
        url: request.url,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    } catch (logError) {
      console.error('Logger failed:', logError);
      console.error('Original error:', error);
    }

    throw new AppValidationError('Invalid JSON in request body');
  }
}

/**
 * Validate URL parameters with Zod schema
 * Returns parsed data or throws NextResponse with validation errors
 *
 * @param params - URL parameters object
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data
 * @throws NextResponse with 400 status if validation fails
 */
export async function validateParams<T>(
  params: Record<string, string> | Promise<Record<string, string>>,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    // Handle both Promise and non-Promise params for Next.js 15/16 compatibility
    const resolvedParams = await Promise.resolve(params);

    const result = schema.safeParse(resolvedParams);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      logger.error('URL parameter validation failed', { errors, resolvedParams });
      throw new AppValidationError('Invalid URL parameters', errors);
    }

    return result.data;
  } catch (error) {
    if (error instanceof AppValidationError) {
      throw error;
    }

    // Log details for debugging - get keys from resolved params if possible
    const debugInfo: Record<string, unknown> = {
      paramsType: typeof params,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    };

    // Try to get resolved params keys for better debugging
    try {
      const resolved = await Promise.resolve(params);
      if (resolved && typeof resolved === 'object') {
        debugInfo.resolvedParamsKeys = Object.keys(resolved);
        debugInfo.resolvedParams = resolved;
      }
    } catch {
      debugInfo.resolveError = 'Failed to resolve params';
    }

    logger.error('Failed to validate URL parameters', error, debugInfo);

    throw new AppValidationError('Invalid parameters format');
  }
}

/**
 * Validate query parameters with Zod schema
 * Returns parsed data or throws NextResponse with validation errors
 *
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data
 * @throws NextResponse with 400 status if validation fails
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = schema.safeParse(params);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      throw new AppValidationError('Invalid query parameters', errors);
    }

    return result.data;
  } catch (error) {
    if (error instanceof AppValidationError) {
      throw error;
    }

    throw new AppValidationError('Invalid query parameters format');
  }
}

/**
 * Higher-order function to validate request body in API routes
 * Usage:
 * ```typescript
 * export const POST = withValidation(createUserSchema, async (request, data) => {
 *   // data is type-safe and validated
 *   return NextResponse.json({ user: data });
 * });
 * ```
 */
export function withValidation<TInput, TParams extends unknown[]>(
  schema: ZodSchema<TInput>,
  handler: (request: NextRequest, data: TInput, ...params: TParams) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...params: TParams): Promise<NextResponse> => {
    try {
      const data = await validateBody(request, schema);
      return handler(request, data, ...params);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Higher-order function to validate both auth and request body
 * Combines withAuth and withValidation
 * Usage:
 * ```typescript
 * export const POST = withAuthAndValidation(
 *   createUserSchema,
 *   async (request, user, data) => {
 *     // user is authenticated, data is validated
 *     return NextResponse.json({ user, data });
 *   }
 * );
 * ```
 */
export function withAuthAndValidation<TInput, TParams extends unknown[]>(
  schema: ZodSchema<TInput>,
  handler: (
    request: NextRequest,
    user: { userId: string; username: string; role: string },
    data: TInput,
    ...params: TParams
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...params: TParams): Promise<NextResponse> => {
    try {
      // Import here to avoid circular dependencies
      const { requireAuth } = await import('@/lib/auth-helpers');
      const user = await requireAuth();
      const data = await validateBody(request, schema);
      return handler(request, user, data, ...params);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Sanitize string input to prevent XSS
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, '') // Remove inline event handlers
    .trim();
}

/**
 * Sanitize all string fields in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}
