import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revokeRefreshToken } from '@/lib/token-helper';
import { getPrismaClient } from '@/lib/prisma';
import { handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

const prisma = getPrismaClient();

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Get refresh token from cookie
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (refreshToken) {
      // Revoke refresh token from database
      await logger.trackPerformance(
        'Revoke refresh token',
        async () => {
          await revokeRefreshToken(prisma, refreshToken);
        }
      );

      logger.info('User logged out successfully', {
        hasRefreshToken: !!refreshToken,
      });
    } else {
      logger.info('Logout attempt without refresh token');
    }

    // Create response with cleared cookies
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Logout failed', error);

    // Even on error, clear the cookies
    const response = NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  }
}
