# Example: Validating API Routes with Zod

This file shows before/after examples of API routes with proper validation.

## Example 1: Test Objects API

### ❌ Before (No Validation)

```typescript
// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { title, description, labelIds } = await request.json();

    // ❌ Manual validation - error-prone
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // ❌ No validation for:
    // - title length
    // - description length
    // - labelIds format (should be UUID array)
    // - XSS protection
    // - type safety

    const testObject = await prisma.testObject.create({
      data: {
        title,
        description,
        labels: labelIds && labelIds.length > 0
          ? { connect: labelIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: { labels: true },
    });

    return NextResponse.json(testObject, { status: 201 });
  } catch (error) {
    console.error('Error creating test object:', error);
    return NextResponse.json(
      { error: 'Failed to create test object' },
      { status: 500 }
    );
  }
}
```

### ✅ After (With Zod Validation - Method 1: Try/Catch)

```typescript
// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateBody } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';

const prisma = getPrismaClient();

export const POST = withAuth(async (request, user) => {
  try {
    // ✅ Validate and parse request body
    const data = await validateBody(request, createTestObjectSchema);

    // ✅ data is now type-safe and validated:
    // - title: string (1-200 chars, trimmed)
    // - description?: string (max 2000 chars) | null
    // - labelId?: string (valid UUID) | null

    const testObject = await prisma.testObject.create({
      data: {
        title: data.title,
        description: data.description,
        ...(data.labelId && {
          labels: { connect: { id: data.labelId } },
        }),
      },
      include: { labels: true },
    });

    return NextResponse.json(testObject, { status: 201 });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error; // Validation or auth error
    }
    console.error('Error creating test object:', error);
    return NextResponse.json(
      { error: 'Failed to create test object' },
      { status: 500 }
    );
  }
});
```

### ✅ After (With Zod Validation - Method 2: HOF)

```typescript
// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';

const prisma = getPrismaClient();

// ✅ Combines auth + validation in one HOF
export const POST = withAuthAndValidation(
  createTestObjectSchema,
  async (request, user, data) => {
    // user is authenticated
    // data is validated and type-safe

    const testObject = await prisma.testObject.create({
      data: {
        title: data.title,
        description: data.description,
        ...(data.labelId && {
          labels: { connect: { id: data.labelId } },
        }),
      },
      include: { labels: true },
    });

    return NextResponse.json(testObject, { status: 201 });
  }
);
```

## Example 2: Login API with Validation

### ❌ Before

```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    const { username, password, stayLoggedIn } = await request.json();

    // ❌ Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // ❌ No validation for:
    // - username format (could contain special chars)
    // - username/password length limits
    // - SQL injection protection
    // - stayLoggedIn type

    const user = await prisma.user.findUnique({ where: { username } });
    // ... rest of logic
  } catch (error) {
    // ...
  }
}
```

### ✅ After

```typescript
// app/api/auth/login/route.ts
import { withValidation } from '@/lib/validation-helpers';
import { loginSchema } from '@/lib/validations/auth';

export const POST = withValidation(
  loginSchema,
  async (request, data) => {
    const prisma = getPrismaClient();

    // ✅ data is validated:
    // - username: 3-50 chars, alphanumeric + underscore/hyphen only
    // - password: 8-100 chars
    // - stayLoggedIn: boolean (optional)

    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token...
    return NextResponse.json({ success: true });
  }
);
```

## Example 3: Route with URL Parameters

```typescript
// app/api/test-objects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { testObjectIdSchema, updateTestObjectSchema } from '@/lib/validations/test-objects';
import { withAuth } from '@/lib/auth-helpers';

export const PUT = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      // ✅ Validate URL parameters
      const { id } = await validateParams(params, testObjectIdSchema);

      // ✅ Validate request body
      const data = await validateBody(request, updateTestObjectSchema);

      const prisma = getPrismaClient();

      const testObject = await prisma.testObject.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.labelId !== undefined && {
            labels: data.labelId
              ? { connect: { id: data.labelId } }
              : { disconnect: true },
          }),
        },
        include: { labels: true },
      });

      return NextResponse.json(testObject);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error updating test object:', error);
      return NextResponse.json(
        { error: 'Failed to update test object' },
        { status: 500 }
      );
    }
  }
);
```

## Example 4: File Upload Validation

```typescript
// app/api/uploads/route.ts
import { validateImageFile, validateDocumentFile } from '@/lib/validations/files';
import { withAuth } from '@/lib/auth-helpers';

export const POST = withAuth(async (request, user) => {
  try {
    const formData = await request.formData();
    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;
    const images = formData.getAll('images') as File[];

    // ✅ Validate each image file
    const validationErrors = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const validation = validateImageFile(file);

      if (!validation.valid) {
        validationErrors.push({
          field: `images[${i}]`,
          message: validation.error,
        });
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // ✅ All files are validated
    // Proceed with upload...

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
});
```

## Validation Error Response Format

All validation errors return a consistent format:

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 1 character"
    },
    {
      "field": "labelId",
      "message": "Invalid label ID format"
    }
  ]
}
```

## Best Practices

1. ✅ **Always use Zod schemas** for input validation
2. ✅ **Use HOFs** (`withValidation`, `withAuthAndValidation`) for cleaner code
3. ✅ **Validate URL parameters** with `validateParams()`
4. ✅ **Validate file uploads** with dedicated validators
5. ✅ **Return consistent error formats** for better client-side handling
6. ✅ **Sanitize user input** when necessary (use `sanitizeString()`)
7. ❌ **Never trust client input** - always validate server-side
8. ❌ **Don't use manual validation** - use Zod schemas instead
9. ❌ **Don't skip validation** even for "internal" APIs

## Available Validation Schemas

- `lib/validations/auth.ts` - Login, password reset, setup
- `lib/validations/test-objects.ts` - Test object CRUD
- `lib/validations/labels.ts` - Label CRUD
- `lib/validations/sensors.ts` - Sensor CRUD
- `lib/validations/measurements.ts` - Measurement CRUD
- `lib/validations/files.ts` - File upload validation

## Available Helper Functions

- `validateBody(request, schema)` - Validate request body
- `validateParams(params, schema)` - Validate URL parameters
- `validateQuery(request, schema)` - Validate query parameters
- `withValidation(schema, handler)` - HOF for validation
- `withAuthAndValidation(schema, handler)` - HOF for auth + validation
- `sanitizeString(input)` - XSS protection
- `sanitizeObject(obj)` - Sanitize all string fields
