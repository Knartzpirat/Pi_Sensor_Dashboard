# Authentication & Authorization

This document explains how authentication and authorization work in the Pi Sensor Dashboard application.

## Overview

The application uses a **centralized middleware-based authentication system** with:
- Next.js Middleware for initial auth checks
- JWT Refresh Tokens stored in httpOnly cookies
- Helper functions for protecting API routes
- Session management with database-backed tokens

## Architecture

### 1. Middleware (`middleware.ts`)

The middleware runs on **every request** and performs initial authentication checks:

- **Checks for public paths** (login, setup, etc.) and allows them through
- **Verifies refresh token cookie exists** for protected routes
- **Redirects unauthenticated users** to `/login` (pages) or returns 401 (API routes)
- **Does NOT validate tokens** (done in API routes for performance)

**Public Paths:**
- `/login`
- `/forget-password`
- `/setup`
- `/setup/recovery-codes`
- `/api/auth/*` (login, logout, verify, etc.)
- `/api/setup/status`

**Always Accessible:**
- `/_next/*` (Next.js internals)
- `/favicon.ico`
- `/uploads/*` (uploaded files)

### 2. Token System

**Refresh Tokens:**
- Stored in `httpOnly` cookies (XSS protected)
- Stored in database (`RefreshToken` table)
- Configurable expiration: 7 days (normal) or 30 days (persistent)
- Tracked with IP address and user agent

**Token Verification:**
- Happens in API routes using `verifyRefreshToken()` from `lib/token-helper.ts`
- Checks database for token existence and expiration
- Returns user information (userId, username, role)

### 3. Auth Helpers (`lib/auth-helpers.ts`)

Provides utilities for protecting API routes:

#### **getAuthUser()**
Returns authenticated user or null:
```typescript
const user = await getAuthUser();
if (user) {
  console.log(user.userId, user.username, user.role);
}
```

#### **requireAuth()**
Throws 401 error if not authenticated:
```typescript
export async function GET(request: NextRequest) {
  const user = await requireAuth(); // Throws if not authenticated
  return NextResponse.json({ data: 'protected' });
}
```

#### **requireAdmin()**
Throws 401/403 error if not authenticated or not admin:
```typescript
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin(); // Throws if not admin
  return NextResponse.json({ message: 'Deleted' });
}
```

#### **withAuth() HOF**
Higher-order function to protect routes:
```typescript
export const GET = withAuth(async (request, user) => {
  // user is guaranteed to be authenticated
  return NextResponse.json({ userId: user.userId });
});
```

#### **withAdmin() HOF**
Higher-order function for admin-only routes:
```typescript
export const POST = withAdmin(async (request, user) => {
  // user is guaranteed to be an admin
  return NextResponse.json({ message: 'Admin action completed' });
});
```

## Usage Examples

### Protecting an API Route (Method 1: try/catch)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const prisma = getPrismaClient();
    const data = await prisma.someModel.findMany({
      where: { userId: user.userId },
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error; // Auth error
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Protecting an API Route (Method 2: Higher-Order Function)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-helpers';
import { getPrismaClient } from '@/lib/prisma';

export const GET = withAuth(async (request, user) => {
  const prisma = getPrismaClient();
  const data = await prisma.someModel.findMany({
    where: { userId: user.userId },
  });

  return NextResponse.json(data);
});
```

### Admin-Only Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth-helpers';
import { getPrismaClient } from '@/lib/prisma';

export const DELETE = withAdmin(async (request, user) => {
  const prisma = getPrismaClient();
  await prisma.someModel.deleteMany();

  return NextResponse.json({ message: 'All data deleted' });
});
```

### Checking Auth in Server Components

```typescript
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-helpers';

export default async function ProtectedPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
    </div>
  );
}
```

### Role-Based Access

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check specific role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Admin-only logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Login Flow

1. User submits credentials to `/api/auth/login`
2. Server validates credentials
3. Server creates refresh token in database
4. Server sets httpOnly cookie with refresh token
5. Client redirects to dashboard
6. Middleware checks cookie on each request
7. API routes verify token when accessing protected resources

## Logout Flow

1. User clicks logout
2. Client calls `/api/auth/logout`
3. Server deletes refresh token from database
4. Server clears cookie
5. Client redirects to login

## Password Recovery Flow

1. User enters recovery code at `/forget-password`
2. Client verifies code via `/api/auth/verify-recovery-code`
3. Server finds matching code in database
4. Client shows password reset form
5. Client submits new password to `/api/auth/reset-password`
6. Server updates password and marks recovery code as used
7. Server deletes all user's refresh tokens (force logout)
8. Client redirects to login

## Security Features

✅ **httpOnly Cookies** - XSS protection
✅ **Database-backed tokens** - Revocable sessions
✅ **Token expiration** - Automatic cleanup
✅ **IP & User Agent tracking** - Session fingerprinting
✅ **Single-use recovery codes** - Password reset security
✅ **bcrypt password hashing** - Secure password storage
✅ **Centralized middleware** - Consistent auth checks

## Adding New Protected Routes

### API Route
```typescript
import { withAuth } from '@/lib/auth-helpers';

export const GET = withAuth(async (request, user) => {
  // Your logic here
  return NextResponse.json({ data: 'protected' });
});
```

### Server Component (Page)
```typescript
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth-helpers';

export default async function MyPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  // Your page here
}
```

## Making Routes Public

To make a route public (no authentication required), add it to the `publicPaths` or `publicApiPaths` arrays in `middleware.ts`:

```typescript
// For pages
const publicPaths = [
  '/login',
  '/your-public-page',
];

// For API routes
const publicApiPaths = [
  '/api/auth/login',
  '/api/your-public-api',
];
```

## Troubleshooting

**"Unauthorized" errors on protected routes:**
- Check if refresh token cookie exists in browser
- Verify token hasn't expired in database
- Ensure route is not in `publicPaths` by mistake

**Infinite redirect loops:**
- Check middleware matcher configuration
- Verify public paths are correctly configured
- Ensure login page is in `publicPaths`

**Token not persisting:**
- Check cookie settings (httpOnly, secure, sameSite)
- Verify domain configuration
- Check browser cookie storage

## Best Practices

1. ✅ **Always use `withAuth()` or `withAdmin()` HOFs** for new API routes
2. ✅ **Never store sensitive data in cookies** (only the token)
3. ✅ **Always use `requireAuth()` in try/catch** if not using HOFs
4. ✅ **Check roles explicitly** for fine-grained permissions
5. ✅ **Log security events** (failed logins, token reuse, etc.)
6. ❌ **Never bypass middleware** for protected routes
7. ❌ **Never expose refresh tokens** to client-side JavaScript
8. ❌ **Never trust client-side auth state** - always verify server-side
