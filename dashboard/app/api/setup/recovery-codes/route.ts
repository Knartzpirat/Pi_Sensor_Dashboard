import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from '@/lib/token-helper';
import { getPrismaClient } from '@/lib/prisma';

export async function GET() {
  const prisma = getPrismaClient();

  try {
    // Hole Refresh Token aus Cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    console.log('[Recovery Codes API] Checking refresh token:', refreshToken ? 'Present' : 'Missing');

    if (!refreshToken) {
      console.log('[Recovery Codes API] No refresh token found in cookies');
      return NextResponse.json(
        { error: 'No refresh token found', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // ✅ Verwende deine bestehende verifyRefreshToken Funktion
    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      console.log('[Recovery Codes API] Token verification failed');
      return NextResponse.json(
        { error: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    console.log('[Recovery Codes API] Token verified for user:', tokenData.username);

    // Hole alle unverwendeten Recovery Codes für diesen User
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: {
        userId: tokenData.userId,
        used: false,
      },
      select: {
        id: true,
        createdAt: true,
        used: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log('[Recovery Codes API] Found', recoveryCodes.length, 'unused recovery codes');

    return NextResponse.json({
      userId: tokenData.userId,
      username: tokenData.username,
      role: tokenData.role,
      totalCodes: recoveryCodes.length,
      codesAvailable: recoveryCodes.filter((c) => !c.used).length,
      message: 'Recovery codes are only shown once during setup',
    });
  } catch (error) {
    console.error('[Recovery Codes API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'SERVER_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
