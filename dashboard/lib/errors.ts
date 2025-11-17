/**
 * Custom error classes for Pi Sensor Dashboard
 *
 * Provides structured error handling with:
 * - HTTP status codes
 * - Error codes for client-side handling
 * - Detailed error messages
 * - Contextual information
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { env } from './env';

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to API response
   */
  toResponse(): NextResponse {
    const isDevelopment = env.isDevelopment;

    const errorResponse: {
      error: string;
      code: string;
      statusCode: number;
      details?: Record<string, unknown>;
      stack?: string;
    } = {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };

    // Include additional details in development
    if (isDevelopment) {
      errorResponse.details = this.context;
      errorResponse.stack = this.stack;
    }

    // Log the error
    logger.error(this.message, this, {
      code: this.code,
      statusCode: this.statusCode,
      ...this.context,
    });

    return NextResponse.json(errorResponse, { status: this.statusCode });
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Array<{ field: string; message: string }>,
    context?: Record<string, unknown>
  ) {
    super(message, 400, 'VALIDATION_ERROR', { ...context, errors });
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    context?: Record<string, unknown>
  ) {
    super(message, 401, 'AUTHENTICATION_ERROR', context);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = 'Insufficient permissions',
    context?: Record<string, unknown>
  ) {
    super(message, 403, 'AUTHORIZATION_ERROR', context);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(
    resource: string,
    id?: string,
    context?: Record<string, unknown>
  ) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', { ...context, resource, id });
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, 409, 'CONFLICT', context);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(
    retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(
      'Too many requests, please try again later',
      429,
      'RATE_LIMIT_EXCEEDED',
      { ...context, retryAfter }
    );
  }
}

/**
 * External service error (502/503)
 */
export class ExternalServiceError extends AppError {
  constructor(
    serviceName: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(
      `External service '${serviceName}' is unavailable`,
      503,
      'EXTERNAL_SERVICE_ERROR',
      { ...context, serviceName, originalError }
    );
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(
    operation: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(
      `Database operation '${operation}' failed`,
      500,
      'DATABASE_ERROR',
      { ...context, operation, originalError }
    );
  }
}

/**
 * File system error (500)
 */
export class FileSystemError extends AppError {
  constructor(
    operation: string,
    filePath?: string,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(
      `File system operation '${operation}' failed`,
      500,
      'FILE_SYSTEM_ERROR',
      { ...context, operation, filePath, originalError }
    );
  }
}

/**
 * Error handler for API routes
 *
 * Catches all errors and converts them to appropriate responses
 */
export function handleError(error: unknown): NextResponse {
  // If it's already an AppError, use its toResponse method
  if (error instanceof AppError) {
    return error.toResponse();
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: Record<string, unknown> };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return new ConflictError(
          'A record with this value already exists',
          { prismaCode: prismaError.code, meta: prismaError.meta }
        ).toResponse();

      case 'P2025': // Record not found
        return new NotFoundError(
          'Record',
          undefined,
          { prismaCode: prismaError.code, meta: prismaError.meta }
        ).toResponse();

      case 'P2003': // Foreign key constraint violation
        return new ValidationError(
          'Invalid reference to related record',
          undefined,
          { prismaCode: prismaError.code, meta: prismaError.meta }
        ).toResponse();

      default:
        return new DatabaseError(
          'query',
          error,
          { prismaCode: prismaError.code }
        ).toResponse();
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    logger.error('Unhandled error', error);
    return NextResponse.json(
      {
        error: env.isDevelopment
          ? error.message
          : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        statusCode: 500,
        ...(env.isDevelopment && { stack: error.stack }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  logger.error('Unknown error type', error);
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 *
 * Automatically catches errors and converts them to responses
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
