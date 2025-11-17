# Error Handling System

This document describes the structured error handling and logging system implemented in the Pi Sensor Dashboard.

## Overview

**Problem:** Inconsistent error handling with:
- Generic error messages without context
- 204+ console.log/error statements
- Silent failures without client notification
- Unstructured error responses
- No centralized error tracking

**Solution:** Comprehensive error handling system with:
- Custom error classes for different error types
- Structured logging with context
- Consistent API error responses
- Automatic error handling in HOF wrappers
- Development vs production error details

## Components

### 1. Structured Logging (`lib/logger.ts`)

Provides consistent logging across the application:

```typescript
import { logger } from '@/lib/logger';

// Log levels
logger.debug('Debug message');    // Development only
logger.info('Info message');       // General information
logger.warn('Warning message');    // Warning
logger.error('Error message', error); // Error with stack trace

// With context
logger.info('User created', {
  userId: user.id,
  username: user.username,
  timestamp: new Date().toISOString(),
});

// Performance tracking
const result = await logger.trackPerformance(
  'Database query',
  async () => {
    return await prisma.user.findMany();
  },
  { operation: 'findMany', table: 'User' }
);

// Child logger with preset context
const requestLogger = logger.child({
  requestId: 'abc-123',
  userId: 'user-456',
  path: '/api/users',
});

requestLogger.info('Processing request'); // Includes preset context
```

**Features:**
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Structured Context**: Add contextual data to logs
- **Performance Tracking**: Automatic duration measurement
- **Pretty Development Output**: Colored console output in development
- **JSON Production Output**: Structured JSON for production logging
- **Child Loggers**: Create loggers with preset context

**Output Example (Development):**
```
[INFO] 2025-01-15T10:30:45.123Z User created
  Context: { userId: 'user-123', username: 'john', timestamp: '2025-01-15T10:30:45.123Z' }
```

**Output Example (Production):**
```json
{
  "level": "info",
  "message": "User created",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "userId": "user-123",
  "username": "john"
}
```

### 2. Custom Error Classes (`lib/errors.ts`)

Structured error handling with HTTP status codes and error codes:

#### Base Error Class

```typescript
import { AppError } from '@/lib/errors';

throw new AppError(
  'Operation failed',
  500,                    // HTTP status code
  'OPERATION_FAILED',     // Error code for client
  { userId: 'user-123' }  // Additional context
);
```

#### Specialized Error Classes

**ValidationError (400)**
```typescript
import { ValidationError } from '@/lib/errors';

throw new ValidationError(
  'Invalid input data',
  [
    { field: 'email', message: 'Invalid email format' },
    { field: 'age', message: 'Must be at least 18' },
  ]
);
```

**AuthenticationError (401)**
```typescript
import { AuthenticationError } from '@/lib/errors';

throw new AuthenticationError('Invalid credentials');
```

**AuthorizationError (403)**
```typescript
import { AuthorizationError } from '@/lib/errors';

throw new AuthorizationError('Admin access required');
```

**NotFoundError (404)**
```typescript
import { NotFoundError } from '@/lib/errors';

throw new NotFoundError('User', userId);
// Error: "User with ID 'user-123' not found"
```

**ConflictError (409)**
```typescript
import { ConflictError } from '@/lib/errors';

throw new ConflictError('User with this email already exists');
```

**RateLimitError (429)**
```typescript
import { RateLimitError } from '@/lib/errors';

throw new RateLimitError(60); // Retry after 60 seconds
```

**ExternalServiceError (503)**
```typescript
import { ExternalServiceError } from '@/lib/errors';

throw new ExternalServiceError('Sensor Backend', error);
```

**DatabaseError (500)**
```typescript
import { DatabaseError } from '@/lib/errors';

throw new DatabaseError('User creation', error);
```

**FileSystemError (500)**
```typescript
import { FileSystemError } from '@/lib/errors';

throw new FileSystemError('File upload', '/uploads/image.jpg', error);
```

### 3. Error Handling in API Routes

#### Automatic Error Handling with `handleError()`

```typescript
import { handleError, NotFoundError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'user-123' },
    });

    if (!user) {
      throw new NotFoundError('User', 'user-123');
    }

    return NextResponse.json(user);
  } catch (error) {
    return handleError(error);
  }
}
```

#### Automatic Error Handling with HOF Wrappers

The `withAuth`, `withValidation`, and `withAuthAndValidation` wrappers automatically handle errors:

```typescript
import { withAuth } from '@/lib/auth-helpers';
import { NotFoundError } from '@/lib/errors';

export const GET = withAuth(async (request, user) => {
  const data = await prisma.testObject.findUnique({
    where: { id: 'test-123' },
  });

  if (!data) {
    throw new NotFoundError('TestObject', 'test-123');
  }

  return NextResponse.json(data);
});
// Errors are automatically caught and converted to proper responses
```

### 4. API Error Response Format

#### Development Response (includes details)

```json
{
  "error": "User with ID 'user-123' not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "details": {
    "resource": "User",
    "id": "user-123"
  },
  "stack": "Error: User with ID 'user-123' not found\n    at ..."
}
```

#### Production Response (minimal details)

```json
{
  "error": "User with ID 'user-123' not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

#### Validation Error Response

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": {
    "errors": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "age", "message": "Required" }
    ]
  }
}
```

## Usage Examples

### Example 1: Simple API Route

**Before:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: 'user-123' },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**After:**
```typescript
import { handleError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await logger.trackPerformance(
      'Fetch user',
      async () => {
        return await prisma.user.findUnique({
          where: { id: 'user-123' },
        });
      },
      { userId: 'user-123' }
    );

    if (!user) {
      throw new NotFoundError('User', 'user-123');
    }

    logger.info('User fetched successfully', { userId: user.id });
    return NextResponse.json(user);
  } catch (error) {
    return handleError(error);
  }
}
```

### Example 2: Protected Route with Validation

**Before:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const testObject = await prisma.testObject.create({
      data: {
        title: body.title,
        description: body.description,
      },
    });

    return NextResponse.json(testObject, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**After:**
```typescript
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';
import { logger } from '@/lib/logger';

export const POST = withAuthAndValidation(
  createTestObjectSchema,
  async (request, user, data) => {
    const requestLogger = logger.child({
      userId: user.userId,
      operation: 'createTestObject',
    });

    const testObject = await requestLogger.trackPerformance(
      'Create test object',
      async () => {
        return await prisma.testObject.create({
          data: {
            title: data.title,
            description: data.description,
          },
        });
      }
    );

    requestLogger.info('Test object created', {
      testObjectId: testObject.id,
    });

    return NextResponse.json(testObject, { status: 201 });
  }
);
// Authentication, validation, and error handling are automatic!
```

### Example 3: Database Operations

**Before:**
```typescript
try {
  const user = await prisma.user.create({
    data: { email: 'test@example.com' },
  });
} catch (error) {
  console.error('DB Error:', error);
  return NextResponse.json(
    { error: 'Database error' },
    { status: 500 }
  );
}
```

**After:**
```typescript
import { DatabaseError, ConflictError } from '@/lib/errors';

try {
  const user = await prisma.user.create({
    data: { email: 'test@example.com' },
  });
} catch (error) {
  // Prisma unique constraint violation (P2002)
  if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
    throw new ConflictError('User with this email already exists');
  }

  throw new DatabaseError('User creation', error);
}
```

### Example 4: External Service Calls

**Before:**
```typescript
try {
  const response = await fetch('http://sensor-backend:8000/sensors');
  const data = await response.json();
} catch (error) {
  console.error('Backend error:', error);
  return NextResponse.json(
    { error: 'Service unavailable' },
    { status: 503 }
  );
}
```

**After:**
```typescript
import { ExternalServiceError } from '@/lib/errors';
import { logger } from '@/lib/logger';

try {
  const data = await logger.trackPerformance(
    'Fetch sensors from backend',
    async () => {
      const response = await fetch('http://sensor-backend:8000/sensors');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    { service: 'sensor-backend' }
  );
} catch (error) {
  throw new ExternalServiceError('Sensor Backend', error);
}
```

### Example 5: File Operations

**Before:**
```typescript
import { writeFile } from 'fs/promises';

try {
  await writeFile(filepath, buffer);
} catch (error) {
  console.error('File error:', error);
  return NextResponse.json(
    { error: 'Failed to save file' },
    { status: 500 }
  );
}
```

**After:**
```typescript
import { writeFile } from 'fs/promises';
import { FileSystemError } from '@/lib/errors';
import { logger } from '@/lib/logger';

try {
  await logger.trackPerformance(
    'Write file to disk',
    async () => {
      await writeFile(filepath, buffer);
    },
    { filepath, size: buffer.length }
  );
} catch (error) {
  throw new FileSystemError('File upload', filepath, error);
}
```

## Prisma Error Handling

The `handleError()` function automatically handles common Prisma errors:

| Prisma Code | Error Type | HTTP Status | Description |
|-------------|------------|-------------|-------------|
| P2002 | ConflictError | 409 | Unique constraint violation |
| P2025 | NotFoundError | 404 | Record not found |
| P2003 | ValidationError | 400 | Foreign key constraint |
| Others | DatabaseError | 500 | General database error |

**Example:**
```typescript
try {
  const user = await prisma.user.create({
    data: { email: 'existing@example.com' },
  });
} catch (error) {
  return handleError(error);
  // Automatically returns 409 Conflict with proper error message
}
```

## Best Practices

### 1. Always Use Structured Logging

❌ **Bad:**
```typescript
console.log('User created');
console.error('Error:', error);
```

✅ **Good:**
```typescript
logger.info('User created', { userId: user.id, email: user.email });
logger.error('User creation failed', error, { email: data.email });
```

### 2. Use Appropriate Error Classes

❌ **Bad:**
```typescript
throw new Error('Not found');
```

✅ **Good:**
```typescript
throw new NotFoundError('User', userId);
```

### 3. Add Context to Errors

❌ **Bad:**
```typescript
throw new DatabaseError('Query failed');
```

✅ **Good:**
```typescript
throw new DatabaseError('User query', error, {
  operation: 'findMany',
  filters: { role: 'admin' },
});
```

### 4. Use HOF Wrappers

❌ **Bad:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const data = await validateBody(request, schema);
    // ... implementation
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
```

✅ **Good:**
```typescript
export const POST = withAuthAndValidation(
  schema,
  async (request, user, data) => {
    // ... implementation
  }
);
```

### 5. Track Performance for Critical Operations

✅ **Good:**
```typescript
const result = await logger.trackPerformance(
  'Complex database query',
  async () => {
    return await prisma.measurement.findMany({
      include: { /* ... */ },
      where: { /* ... */ },
    });
  },
  { operation: 'getMeasurements', userId: user.id }
);
```

### 6. Use Child Loggers for Request Scope

✅ **Good:**
```typescript
export const POST = withAuth(async (request, user) => {
  const requestLogger = logger.child({
    requestId: crypto.randomUUID(),
    userId: user.userId,
    endpoint: '/api/test-objects',
  });

  requestLogger.info('Request started');

  // All subsequent logs include the preset context
  requestLogger.debug('Validating input');
  requestLogger.info('Test object created');

  return NextResponse.json({ success: true });
});
```

## Error Response Consistency

All API errors now follow this format:

```typescript
{
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  statusCode: number;      // HTTP status code
  details?: object;        // Additional context (development only)
  stack?: string;          // Stack trace (development only)
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Authentication required
- `AUTHORIZATION_ERROR` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict (e.g., unique constraint)
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_SERVICE_ERROR` - External service unavailable
- `DATABASE_ERROR` - Database operation failed
- `FILE_SYSTEM_ERROR` - File system operation failed
- `INTERNAL_ERROR` - Unexpected error

## Migration Guide

### Replacing console.log/error

**Find and replace:**
```bash
# Find console.log statements
grep -r "console.log" --include="*.ts" --include="*.tsx" app lib

# Find console.error statements
grep -r "console.error" --include="*.ts" --include="*.tsx" app lib
```

**Replace with structured logging:**
```typescript
// Before
console.log('User created:', user);

// After
logger.info('User created', { userId: user.id, email: user.email });
```

### Replacing Generic Error Responses

**Before:**
```typescript
return NextResponse.json(
  { error: 'Not found' },
  { status: 404 }
);
```

**After:**
```typescript
throw new NotFoundError('User', userId);
```

## Related Documentation

- [VALIDATION.md](VALIDATION.md) - Input validation with Zod
- [AUTHENTICATION.md](AUTHENTICATION.md) - Authentication system
- [TYPE_SAFETY.md](TYPE_SAFETY.md) - Type safety improvements

## References

- [Error Handling Best Practices](https://www.joyent.com/node-js/production/design/errors)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [Structured Logging](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/)
