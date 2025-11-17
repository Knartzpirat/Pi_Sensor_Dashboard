# Input Validation with Zod

Complete guide for implementing robust input validation in the Pi Sensor Dashboard.

## Overview

The application uses **Zod** for schema-based validation with:
- Type-safe validation schemas
- Automatic error formatting
- Higher-order functions for clean code
- Consistent error responses
- XSS protection

## Why Validation Matters

### Security Risks Without Validation

❌ **SQL Injection** - Malicious SQL in user input
❌ **XSS Attacks** - JavaScript injection in text fields
❌ **Data Corruption** - Invalid data breaking the database
❌ **DoS Attacks** - Extremely large inputs consuming resources
❌ **Type Confusion** - Unexpected data types causing crashes

### Benefits of Zod Validation

✅ **Type Safety** - TypeScript types inferred from schemas
✅ **Runtime Validation** - Catch errors before they reach the database
✅ **Automatic Parsing** - Transform and normalize data
✅ **Clear Error Messages** - User-friendly validation feedback
✅ **Reusable Schemas** - DRY principle for validation logic

## Architecture

### 1. Validation Schemas (`lib/validations/`)

Zod schemas define the shape and constraints of input data:

```typescript
// lib/validations/test-objects.ts
import { z } from 'zod';

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
  labelId: z
    .string()
    .uuid('Invalid label ID format')
    .optional()
    .nullable(),
});

export type CreateTestObjectInput = z.infer<typeof createTestObjectSchema>;
```

### 2. Validation Helpers (`lib/validation-helpers.ts`)

Helper functions for easy validation in API routes:

- `validateBody(request, schema)` - Validate request body
- `validateParams(params, schema)` - Validate URL parameters
- `validateQuery(request, schema)` - Validate query parameters
- `withValidation(schema, handler)` - HOF for validation
- `withAuthAndValidation(schema, handler)` - HOF for auth + validation

### 3. Custom Validators (`lib/validations/files.ts`)

Special validators for complex cases like file uploads:

- `validateImageFile(file)` - Validate image uploads
- `validateDocumentFile(file)` - Validate document uploads

## Available Schemas

### Authentication (`lib/validations/auth.ts`)

- `loginSchema` - Login credentials
- `verifyRecoveryCodeSchema` - Recovery code verification
- `resetPasswordSchema` - Password reset
- `setupSchema` - Initial application setup

### Test Objects (`lib/validations/test-objects.ts`)

- `createTestObjectSchema` - Create test object
- `updateTestObjectSchema` - Update test object
- `testObjectIdSchema` - URL parameter validation

### Labels (`lib/validations/labels.ts`)

- `createLabelSchema` - Create label
- `updateLabelSchema` - Update label
- `labelIdSchema` - URL parameter validation

### Sensors (`lib/validations/sensors.ts`)

- `createSensorSchema` - Create sensor
- `updateSensorSchema` - Update sensor
- `sensorIdSchema` - URL parameter validation

### Measurements (`lib/validations/measurements.ts`)

- `createMeasurementSchema` - Create measurement
- `updateMeasurementSchema` - Update measurement
- `measurementIdSchema` - URL parameter validation

### Files (`lib/validations/files.ts`)

- `uploadFileSchema` - File upload metadata
- `validateImageFile()` - Image file validation
- `validateDocumentFile()` - Document file validation
- `updatePictureOrderSchema` - Picture reordering
- `movePictureSchema` - Picture movement

## Usage Patterns

### Pattern 1: Basic Validation (Try/Catch)

```typescript
import { validateBody } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';

export async function POST(request: NextRequest) {
  try {
    const data = await validateBody(request, createTestObjectSchema);
    // data is type-safe and validated
    // ...
  } catch (error) {
    if (error instanceof NextResponse) {
      return error; // Validation error
    }
    // Handle other errors
  }
}
```

### Pattern 2: Higher-Order Function (Recommended)

```typescript
import { withValidation } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';

export const POST = withValidation(
  createTestObjectSchema,
  async (request, data) => {
    // data is type-safe and validated
    // ...
    return NextResponse.json({ success: true });
  }
);
```

### Pattern 3: Auth + Validation Combined

```typescript
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';

export const POST = withAuthAndValidation(
  createTestObjectSchema,
  async (request, user, data) => {
    // user is authenticated
    // data is type-safe and validated
    // ...
    return NextResponse.json({ success: true });
  }
);
```

### Pattern 4: URL Parameter Validation

```typescript
import { validateParams } from '@/lib/validation-helpers';
import { testObjectIdSchema } from '@/lib/validations/test-objects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await validateParams(params, testObjectIdSchema);
    // id is validated as UUID
    // ...
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    // Handle other errors
  }
}
```

### Pattern 5: File Upload Validation

```typescript
import { validateImageFile } from '@/lib/validations/files';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const images = formData.getAll('images') as File[];

  const errors = [];

  for (let i = 0; i < images.length; i++) {
    const validation = validateImageFile(images[i]);
    if (!validation.valid) {
      errors.push({ field: `images[${i}]`, message: validation.error });
    }
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { error: 'Validation failed', errors },
      { status: 400 }
    );
  }

  // All files are valid
  // ...
}
```

## Creating New Schemas

### Basic Schema

```typescript
import { z } from 'zod';

export const mySchema = z.object({
  field1: z.string().min(1, 'Field1 is required'),
  field2: z.number().int().positive(),
  field3: z.boolean().optional(),
});

export type MyInput = z.infer<typeof mySchema>;
```

### Advanced Schema with Transformations

```typescript
export const userSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase() // Transform to lowercase
    .trim(),
  age: z
    .string()
    .regex(/^\d+$/, 'Age must be a number')
    .transform(Number) // Transform string to number
    .refine((age) => age >= 18, 'Must be at least 18 years old'),
  tags: z
    .array(z.string())
    .min(1, 'At least one tag required')
    .max(10, 'Maximum 10 tags allowed'),
});
```

### Schema with Custom Validation

```typescript
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Error attached to this field
  }
);
```

### Schema with Enum Validation

```typescript
import { EntityType } from '@prisma/client';

export const labelSchema = z.object({
  type: z.nativeEnum(EntityType, {
    errorMap: () => ({ message: 'Invalid entity type' }),
  }),
  status: z.enum(['active', 'inactive', 'archived']),
});
```

## Validation Error Format

All validation errors return a consistent JSON format:

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title must be at least 1 character"
    },
    {
      "field": "description",
      "message": "Description must not exceed 2000 characters"
    }
  ]
}
```

## Security Best Practices

### 1. Always Validate on the Server

```typescript
// ❌ BAD: Only client-side validation
function handleSubmit(data) {
  // Client validates, then sends to API
  fetch('/api/data', { body: JSON.stringify(data) });
}

// ✅ GOOD: Server-side validation
export const POST = withValidation(schema, async (request, data) => {
  // Server validates regardless of client
  return NextResponse.json({ success: true });
});
```

### 2. Sanitize String Inputs

```typescript
import { sanitizeString, sanitizeObject } from '@/lib/validation-helpers';

const cleaned = sanitizeString(userInput); // Removes script tags
const cleanedObj = sanitizeObject(data); // Sanitizes all string fields
```

### 3. Validate File Types and Sizes

```typescript
import { validateImageFile, MAX_IMAGE_SIZE } from '@/lib/validations/files';

const validation = validateImageFile(file);
if (!validation.valid) {
  return NextResponse.json({ error: validation.error }, { status: 400 });
}
```

### 4. Use Strong Password Requirements

```typescript
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    'Password must contain uppercase, lowercase, number, and special character'
  );
```

### 5. Validate UUIDs and IDs

```typescript
const idSchema = z.string().uuid('Invalid ID format');

// Or use prepared schemas
import { testObjectIdSchema } from '@/lib/validations/test-objects';
```

### 6. Limit Input Sizes

```typescript
const textSchema = z
  .string()
  .max(2000, 'Text must not exceed 2000 characters');

const arraySchema = z
  .array(z.string())
  .max(100, 'Maximum 100 items allowed');
```

## Common Validation Patterns

### Optional Fields

```typescript
z.string().optional(); // Field can be undefined
z.string().nullable(); // Field can be null
z.string().optional().nullable(); // Field can be undefined or null
```

### Default Values

```typescript
z.boolean().default(true); // Defaults to true if not provided
z.number().default(0);
z.string().default('');
```

### Enums

```typescript
// Native TypeScript enum
z.nativeEnum(MyEnum);

// Zod enum
z.enum(['option1', 'option2', 'option3']);
```

### Arrays

```typescript
z.array(z.string()); // Array of strings
z.array(z.number()).min(1); // At least one number
z.array(z.object({ id: z.string() })); // Array of objects
```

### Nested Objects

```typescript
z.object({
  user: z.object({
    name: z.string(),
    age: z.number(),
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
  }),
});
```

### Union Types

```typescript
z.union([z.string(), z.number()]); // String OR number
z.string().or(z.number()); // Same as above
```

## Testing Validation

```typescript
import { createTestObjectSchema } from '@/lib/validations/test-objects';

describe('createTestObjectSchema', () => {
  it('should validate valid input', () => {
    const result = createTestObjectSchema.safeParse({
      title: 'Test Object',
      description: 'A test object',
    });

    expect(result.success).toBe(true);
  });

  it('should reject empty title', () => {
    const result = createTestObjectSchema.safeParse({
      title: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe('Title is required');
    }
  });
});
```

## Migration Guide

### Step 1: Create Schema

```typescript
// lib/validations/my-resource.ts
import { z } from 'zod';

export const createMyResourceSchema = z.object({
  name: z.string().min(1),
  value: z.number().positive(),
});
```

### Step 2: Update API Route

```typescript
// Before
export async function POST(request: NextRequest) {
  const { name, value } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  // ...
}

// After
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createMyResourceSchema } from '@/lib/validations/my-resource';

export const POST = withAuthAndValidation(
  createMyResourceSchema,
  async (request, user, data) => {
    // data is validated
    // ...
  }
);
```

### Step 3: Update Client

```typescript
// Client automatically gets better error messages
try {
  const response = await fetch('/api/my-resource', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    // error.errors contains field-specific errors
    console.error(error.errors);
  }
} catch (error) {
  console.error('Request failed', error);
}
```

## Troubleshooting

**Issue: "Validation failed" but no specific errors**
- Check if schema is correctly defined
- Ensure you're using `safeParse` or catching validation errors
- Check console for detailed Zod errors

**Issue: Type errors with inferred types**
- Make sure to use `z.infer<typeof schema>` for types
- Ensure TypeScript is up to date

**Issue: File validation not working**
- Check MIME type of uploaded file
- Verify file size limits
- Ensure file is instanceof File

**Issue: Performance with large arrays**
- Consider pagination instead of validating large arrays
- Use `.max()` to limit array sizes
- Stream validation for very large inputs

## Resources

- [Zod Documentation](https://zod.dev)
- [Example Validated Routes](./EXAMPLE_VALIDATED_ROUTE.md)
- [Authentication Guide](./AUTHENTICATION.md)

## Quick Reference

```typescript
// Import schemas
import { createTestObjectSchema } from '@/lib/validations/test-objects';

// Import helpers
import {
  validateBody,
  validateParams,
  validateQuery,
  withValidation,
  withAuthAndValidation,
  sanitizeString,
} from '@/lib/validation-helpers';

// Import file validators
import { validateImageFile, validateDocumentFile } from '@/lib/validations/files';

// Use in API routes
export const POST = withAuthAndValidation(
  createTestObjectSchema,
  async (request, user, data) => {
    // Your logic here
    return NextResponse.json({ success: true });
  }
);
```
