import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateRefreshToken } from '@/lib/token-helper';
import { getClientInfo } from '@/lib/request-utils';
import { getPrismaClient } from '@/lib/prisma';
import { withValidation } from '@/lib/validation-helpers';
import { loginSchema } from '@/lib/validations/auth';
import { AuthenticationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

export const POST = withValidation(
  loginSchema,
  async (request, data) => {
    const prisma = getPrismaClient();

    try {
      const { ipAddress, userAgent } = getClientInfo(request);

      // Find user
      const user = await logger.trackPerformance(
        'Find user by username',
        async () => {
          return await prisma.user.findUnique({
            where: { username: data.username },
          });
        },
        { username: data.username }
      );

      if (!user) {
        logger.warn('Login attempt with invalid username', {
          username: data.username,
          ipAddress,
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);

      if (!isValidPassword) {
        logger.warn('Login attempt with invalid password', {
          userId: user.id,
          username: user.username,
          ipAddress,
        });
        throw new AuthenticationError('Invalid credentials');
      }

      // Generate refresh token with expiry
      const { token: refreshToken, expiresAt } = await logger.trackPerformance(
        'Generate refresh token',
        async () => {
          return await generateRefreshToken(
            prisma,
            user.id,
            data.stayLoggedIn || false,
            ipAddress,
            userAgent
          );
        },
        { userId: user.id, stayLoggedIn: data.stayLoggedIn }
      );

      // Set cookies
      const cookieStore = await cookies();

      // Set refresh token cookie with maxAge from DB
      const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'strict',
        maxAge,
        path: '/',
      });

      logger.info('User logged in successfully', {
        userId: user.id,
        username: user.username,
        ipAddress,
        stayLoggedIn: data.stayLoggedIn || false,
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
