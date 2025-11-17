import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from '@/lib/token-helper';
import { getPrismaClient } from '@/lib/prisma';
import { AuthenticationError, AuthorizationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * User information extracted from token
 */
export interface AuthUser {
  userId: string;
  username: string;
  role: string;
  token: string;
  expiresAt: Date;
}

/**
 * Get authenticated user from refresh token
 * This verifies the token and returns user information
 *
 * @returns User information or null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return null;
    }

    const prisma = getPrismaClient();
    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      return null;
    }

    return {
      userId: tokenData.userId,
      username: tokenData.username,
      role: tokenData.role,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
    };
  } catch (error) {
    logger.error('Failed to get authenticated user', error);
    return null;
  }
}

/**
 * Check if the authenticated user has a specific role
 *
 * @param requiredRole - The role required to access the resource
 * @returns true if user has the required role, false otherwise
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === requiredRole;
}

/**
 * Check if the authenticated user is an admin
 *
 * @returns true if user is an admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin');
}

/**
 * Require authentication in an API route
 * Returns user information or throws an error response
 *
 * @returns Authenticated user information
 * @throws NextResponse with 401 status if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

/**
 * Require admin role in an API route
 * Returns admin user information or throws an error response
 *
 * @returns Authenticated admin user information
 * @throws NextResponse with 401 status if not authenticated or 403 if not admin
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();

  if (user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }

  return user;
}

/**
 * Higher-order function to protect API routes with authentication
 * Usage:
 * ```typescript
 * export const GET = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ data: 'protected' });
 * });
 * ```
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireAuth();
      return handler(request, user, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Higher-order function to protect API routes with admin role
 * Usage:
 * ```typescript
 * export const DELETE = withAdmin(async (request, user) => {
 *   // user is guaranteed to be an admin
 *   return NextResponse.json({ data: 'admin only' });
 * });
 * ```
 */
export function withAdmin<T extends unknown[]>(
  handler: (request: NextRequest, user: AuthUser, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = await requireAdmin();
      return handler(request, user, ...args);
    } catch (error) {
      return handleError(error);
    }
  };
}
