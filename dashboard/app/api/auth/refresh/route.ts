import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { verifyRefreshToken } from '@/lib/token-helper';
import { AuthenticationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      logger.warn('Refresh token request without token');
      throw new AuthenticationError('No refresh token');
    }

    // Verify and rotate the token for security
    const result = await logger.trackPerformance(
      'Verify and rotate refresh token',
      async () => {
        return await verifyRefreshToken(prisma, refreshToken, true);
      }
    );

    if (!result) {
      logger.warn('Invalid or expired refresh token', {
        tokenPreview: refreshToken.substring(0, 10) + '...',
      });
      throw new AuthenticationError('Invalid or expired refresh token');
    }

    // Calculate maxAge from expiresAt
    const maxAge = Math.floor((result.expiresAt.getTime() - Date.now()) / 1000);

    // Set new refresh token cookie
    cookieStore.set('refreshToken', result.token, {
      httpOnly: true,
      secure: env.isProduction,
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    logger.info('Refresh token rotated successfully', {
      userId: result.userId,
      expiresAt: result.expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
