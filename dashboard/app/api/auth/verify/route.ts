import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from '@/lib/token-helper';
import { getPrismaClient } from '@/lib/prisma';

/**
 * POST /api/auth/verify
 * Verify a refresh token and return user information
 * Used internally by middleware and for client-side auth checks
 */
export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient();
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { isAuthenticated: false, error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      return NextResponse.json(
        { isAuthenticated: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      isAuthenticated: true,
      userId: tokenData.userId,
      username: tokenData.username,
      role: tokenData.role,
      expiresAt: tokenData.expiresAt,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { isAuthenticated: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
