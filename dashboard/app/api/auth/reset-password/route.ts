// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/prisma';
import { withValidation } from '@/lib/validation-helpers';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { AuthenticationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const POST = withValidation(
  resetPasswordSchema,
  async (request, data) => {
    const prisma = getPrismaClient();

    try {
      // Validate recovery code belongs to user and is not yet used
      const recoveryCodes = await logger.trackPerformance(
        'Find unused recovery codes',
        async () => {
          return await prisma.recoveryCode.findMany({
            where: {
              userId: data.userId,
              used: false,
            },
          });
        },
        { userId: data.userId }
      );

      let validCode = null;
      for (const code of recoveryCodes) {
        const isValid = await bcrypt.compare(data.recoveryCode, code.code);
        if (isValid) {
          validCode = code;
          break;
        }
      }

      if (!validCode) {
        logger.warn('Password reset attempt with invalid recovery code', {
          userId: data.userId,
        });
        throw new AuthenticationError('Invalid recovery code');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      // Update password, mark code as used, and revoke all tokens in transaction
      await logger.trackPerformance(
        'Password reset transaction',
        async () => {
          await prisma.$transaction([
            // Update password
            prisma.user.update({
              where: { id: data.userId },
              data: { password: hashedPassword },
            }),
            // Mark recovery code as used
            prisma.recoveryCode.update({
              where: { id: validCode.id },
              data: {
                used: true,
                usedAt: new Date(),
              },
            }),
            // Delete all refresh tokens (force logout)
            prisma.refreshToken.deleteMany({
              where: { userId: data.userId },
            }),
          ]);
        },
        { userId: data.userId, recoveryCodeId: validCode.id }
      );

      logger.info('Password reset successfully', {
        userId: data.userId,
        recoveryCodeId: validCode.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
