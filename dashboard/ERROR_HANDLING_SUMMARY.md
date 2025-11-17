# Error Handling Implementation - Summary

## Completion Status: ✅ FOUNDATION READY

The structured error handling and logging system has been successfully implemented!

## What Was Created

### 1. **Structured Logger** (`lib/logger.ts`)

A comprehensive logging system with:
- ✅ Log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Structured context data
- ✅ Performance tracking
- ✅ Request correlation IDs
- ✅ Pretty development output
- ✅ JSON production output
- ✅ Child loggers with preset context

**Usage:**
```typescript
import { logger } from '@/lib/logger';

logger.info('User created', { userId: user.id });
logger.error('Operation failed', error, { context: '...' });

// Performance tracking
await logger.trackPerformance('Database query', async () => {
  return await prisma.user.findMany();
});

// Child logger
const requestLogger = logger.child({ requestId: '123', userId: 'user-456' });
requestLogger.info('Processing'); // Includes preset context
```

### 2. **Custom Error Classes** (`lib/errors.ts`)

Structured error handling with:
- ✅ `AppError` - Base error class
- ✅ `ValidationError` - Input validation (400)
- ✅ `AuthenticationError` - Auth required (401)
- ✅ `AuthorizationError` - Insufficient permissions (403)
- ✅ `NotFoundError` - Resource not found (404)
- ✅ `ConflictError` - Resource conflict (409)
- ✅ `RateLimitError` - Too many requests (429)
- ✅ `ExternalServiceError` - External service error (503)
- ✅ `DatabaseError` - Database operation failed (500)
- ✅ `FileSystemError` - File system error (500)
- ✅ `handleError()` - Centralized error handler
- ✅ Automatic Prisma error mapping

**Usage:**
```typescript
import { NotFoundError, handleError } from '@/lib/errors';

try {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new NotFoundError('User', id);
  }
  return NextResponse.json(user);
} catch (error) {
  return handleError(error);
}
```

### 3. **Updated Helper Functions**

**`lib/auth-helpers.ts`** - Now uses:
- ✅ `AuthenticationError` instead of generic error
- ✅ `AuthorizationError` instead of generic error
- ✅ `handleError()` in `withAuth()` and `withAdmin()`
- ✅ Structured logging with `logger`

**`lib/validation-helpers.ts`** - Now uses:
- ✅ `ValidationError` with detailed field errors
- ✅ `handleError()` in all HOF wrappers
- ✅ Cleaner error throwing

### 4. **Documentation**

- ✅ [ERROR_HANDLING.md](ERROR_HANDLING.md) - Complete documentation with examples
- ✅ [ERROR_HANDLING_SUMMARY.md](ERROR_HANDLING_SUMMARY.md) - This summary

## Error Response Format

All API errors now return consistent responses:

### Development Response
```json
{
  "error": "User with ID 'user-123' not found",
  "code": "NOT_FOUND",
  "statusCode": 404,
  "details": {
    "resource": "User",
    "id": "user-123"
  },
  "stack": "Error: ...\n    at ..."
}
```

### Production Response
```json
{
  "error": "User with ID 'user-123' not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

## Automatic Prisma Error Mapping

The `handleError()` function automatically handles Prisma errors:

| Prisma Code | Mapped To | Status | Example |
|-------------|-----------|--------|---------|
| P2002 | ConflictError | 409 | Unique constraint violation |
| P2025 | NotFoundError | 404 | Record not found |
| P2003 | ValidationError | 400 | Foreign key constraint |
| Others | DatabaseError | 500 | General database error |

## Benefits

### 1. **Consistent Error Responses** ✅
All errors follow the same format with proper HTTP status codes and error codes.

### 2. **Structured Logging** ✅
All logs include contextual information and proper severity levels.

### 3. **Better Debugging** ✅
- Stack traces in development
- Contextual information in logs
- Request correlation IDs
- Performance metrics

### 4. **Type Safety** ✅
Custom error classes provide type-safe error handling.

### 5. **Client-Friendly** ✅
Error codes allow clients to handle specific error cases programmatically.

### 6. **Production-Ready** ✅
JSON logging for production log aggregation systems.

## Migration Status

### ✅ Infrastructure Ready
- Logger system implemented
- Error classes created
- Helper functions updated
- Documentation complete

### 🔄 Migration Needed
The following files still use `console.log/error` and need migration:

**API Routes (20+ files):**
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/refresh/route.ts`
- `app/api/auth/reset-password/route.ts`
- `app/api/auth/verify-recovery-code/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/hardware/config/route.ts`
- `app/api/labels/route.ts`
- `app/api/labels/[id]/route.ts`
- `app/api/measurements/route.ts`
- `app/api/measurements/[id]/route.ts`
- `app/api/pictures/[id]/route.ts`
- `app/api/sensor-entities/[id]/route.ts`
- `app/api/sensors/route.ts`
- `app/api/sensors/[id]/route.ts`
- `app/api/test-objects/route.ts`
- `app/api/test-objects/[id]/route.ts`
- `app/api/uploads/route.ts`
- ... and more

**Components (50+ files):**
- Dashboard components
- UI components
- Form components

## Migration Guide

### Step 1: Replace console.log/error

**Before:**
```typescript
console.log('User created:', user);
console.error('Error creating user:', error);
```

**After:**
```typescript
import { logger } from '@/lib/logger';

logger.info('User created', { userId: user.id, email: user.email });
logger.error('User creation failed', error, { email: data.email });
```

### Step 2: Replace Generic Error Responses

**Before:**
```typescript
return NextResponse.json(
  { error: 'Not found' },
  { status: 404 }
);
```

**After:**
```typescript
import { NotFoundError } from '@/lib/errors';

throw new NotFoundError('User', userId);
```

### Step 3: Use handleError()

**Before:**
```typescript
try {
  // ... operation
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

**After:**
```typescript
import { handleError } from '@/lib/errors';

try {
  // ... operation
} catch (error) {
  return handleError(error);
}
```

### Step 4: Add Performance Tracking

**Add for critical operations:**
```typescript
import { logger } from '@/lib/logger';

const result = await logger.trackPerformance(
  'Database query',
  async () => {
    return await prisma.measurement.findMany({
      include: { /* ... */ },
    });
  },
  { operation: 'getMeasurements', filters: { /* ... */ } }
);
```

## Quick Reference

### Import Statements

```typescript
// Logging
import { logger } from '@/lib/logger';

// Error handling
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  FileSystemError,
  handleError,
} from '@/lib/errors';
```

### Common Patterns

**1. Simple API Route:**
```typescript
import { handleError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const data = await prisma.resource.findUnique({ where: { id } });

    if (!data) {
      throw new NotFoundError('Resource', id);
    }

    logger.info('Resource fetched', { resourceId: id });
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
```

**2. Protected Route with Validation:**
```typescript
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { logger } from '@/lib/logger';

export const POST = withAuthAndValidation(
  schema,
  async (request, user, data) => {
    const requestLogger = logger.child({
      userId: user.userId,
      operation: 'createResource',
    });

    const result = await requestLogger.trackPerformance(
      'Create resource',
      async () => {
        return await prisma.resource.create({ data });
      }
    );

    requestLogger.info('Resource created', { resourceId: result.id });
    return NextResponse.json(result, { status: 201 });
  }
);
```

**3. External Service Call:**
```typescript
import { ExternalServiceError } from '@/lib/errors';
import { logger } from '@/lib/logger';

try {
  const data = await logger.trackPerformance(
    'Fetch from backend',
    async () => {
      const response = await fetch(backendUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    },
    { service: 'sensor-backend', url: backendUrl }
  );
} catch (error) {
  throw new ExternalServiceError('Sensor Backend', error);
}
```

## Next Steps

1. **Migrate API Routes**: Replace console.log/error with structured logging
2. **Add Performance Tracking**: Track critical database operations
3. **Use Custom Errors**: Replace generic error responses
4. **Add Request Context**: Use child loggers for request-scoped logging
5. **Configure Log Aggregation**: Set up production log collection (optional)

## Related Work Completed

1. ✅ Prisma Client Singleton Pattern
2. ✅ Authentication/Authorization Middleware
3. ✅ Input Validation with Zod
4. ✅ File Upload Security
5. ✅ N+1 Query Problem
6. ✅ Type Safety Problems
7. ✅ **Error Handling Infrastructure** ← Just completed!

**Next:** Migrate existing API routes to use the new error handling system.

## Example Migration

See [ERROR_HANDLING.md](ERROR_HANDLING.md) for complete migration examples.

**Quick Example:**

```typescript
// ❌ Before
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await prisma.user.create({ data: body });
    console.log('User created:', user);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ✅ After
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createUserSchema } from '@/lib/validations/users';
import { logger } from '@/lib/logger';

export const POST = withAuthAndValidation(
  createUserSchema,
  async (request, user, data) => {
    const newUser = await logger.trackPerformance(
      'Create user',
      async () => {
        return await prisma.user.create({ data });
      },
      { createdBy: user.userId }
    );

    logger.info('User created', {
      userId: newUser.id,
      email: newUser.email,
    });

    return NextResponse.json(newUser, { status: 201 });
  }
);
```

## Find Remaining Work

```bash
# Find console.log statements
grep -r "console.log" --include="*.ts" --include="*.tsx" app lib | wc -l

# Find console.error statements
grep -r "console.error" --include="*.ts" --include="*.tsx" app lib | wc -l

# Find generic error responses
grep -r "Internal server error" --include="*.ts" app/api | wc -l
```

## Summary

✅ **Infrastructure Complete**: Logger, error classes, and helper functions ready
🔄 **Migration Pending**: 20+ API routes and 50+ components need migration
📚 **Documentation**: Comprehensive guides and examples available

The error handling system is production-ready and can be adopted incrementally!
