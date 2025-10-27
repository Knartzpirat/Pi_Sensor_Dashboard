import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { verifyRefreshToken } from '@/lib/token-helper';

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    // Verify and rotate the token for security
    const result = await verifyRefreshToken(prisma, refreshToken, true);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Calculate maxAge from expiresAt
    const maxAge = Math.floor((result.expiresAt.getTime() - Date.now()) / 1000);

    // Set new refresh token cookie
    cookieStore.set('refreshToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
