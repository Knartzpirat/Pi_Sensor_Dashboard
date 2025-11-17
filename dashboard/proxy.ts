import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
  '/login',
  '/forget-password',
  '/setup',
  '/setup/recovery-codes',
];

// Public API endpoints that don't require authentication
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/verify-recovery-code',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/setup/status',
  '/api/auth/verify',
];

// Paths that should always be accessible (static files, Next.js internals)
const alwaysAccessiblePrefixes = [
  '/_next',
  '/favicon.ico',
  '/uploads',
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  // Check exact matches
  if (publicPaths.includes(pathname)) {
    return true;
  }

  // Check if path starts with public prefix
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return true;
  }

  // Check public API paths
  if (publicApiPaths.some(path => pathname.startsWith(path))) {
    return true;
  }

  return false;
}

/**
 * Check if a path is always accessible (static files, Next.js internals)
 */
function isAlwaysAccessible(pathname: string): boolean {
  return alwaysAccessiblePrefixes.some(prefix => pathname.startsWith(prefix));
}

/**
 * Main proxy function (Next.js 16 replaces middleware with proxy)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow Next.js internals and static files
  if (isAlwaysAccessible(pathname)) {
    return NextResponse.next();
  }

  // 2. Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // 3. For protected paths, check if refresh token exists
  const refreshToken = request.cookies.get('refreshToken')?.value;

  if (!refreshToken) {
    // No refresh token - redirect to login
    if (pathname.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else {
      // Regular pages redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Token exists - add it to headers for API routes to verify
  // The actual token verification happens in the API routes/pages using getPrismaClient
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-has-refresh-token', 'true');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * Middleware configuration
 * Specify which paths should trigger the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (.png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
