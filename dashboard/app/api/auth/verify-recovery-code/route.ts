// app/api/auth/verify-recovery-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/prisma';
import { withValidation } from '@/lib/validation-helpers';
import { verifyRecoveryCodeSchema } from '@/lib/validations/auth';
import { AuthenticationError, handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export const POST = withValidation(
  verifyRecoveryCodeSchema,
  async (request, data) => {
    const prisma = getPrismaClient();

    try {
      // Get all unused recovery codes
      const recoveryCodes = await logger.trackPerformance(
        'Find unused recovery codes',
        async () => {
          return await prisma.recoveryCode.findMany({
            where: {
              used: false,
            },
            include: {
              user: true,
            },
          });
        }
      );

      // Compare with all codes (hashed codes in DB)
      let foundCode = null;
      for (const code of recoveryCodes) {
        // data.recoveryCode is already normalized (uppercase, without dashes)
        // via transform() in schema
        const isValid = await bcrypt.compare(data.recoveryCode, code.code);

        if (isValid) {
          foundCode = code;
          break;
        }
      }

      if (!foundCode) {
        logger.warn('Recovery code verification failed', {
          codePreview: data.recoveryCode.substring(0, 3) + '...',
        });
        throw new AuthenticationError('Invalid or already used recovery code');
      }

      logger.info('Recovery code verified successfully', {
        userId: foundCode.userId,
        username: foundCode.user.username,
      });

      // Code is valid - return userId
      return NextResponse.json({
        success: true,
        userId: foundCode.userId,
        username: foundCode.user.username,
      });
    } catch (error) {
      return handleError(error);
    }
  }
);
