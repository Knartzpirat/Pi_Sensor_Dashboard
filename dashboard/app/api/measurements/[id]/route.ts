import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams } from '@/lib/validation-helpers';
import { measurementIdSchema } from '@/lib/validations/measurements';
import { handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const prisma = getPrismaClient();

// DELETE - Delete measurement
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, measurementIdSchema);

      // Delete measurement and all related data (cascade)
      await logger.trackPerformance(
        'Delete measurement',
        async () => {
          await prisma.measurement.delete({
            where: { id },
          });
        },
        { userId: user.userId, measurementId: id }
      );

      logger.info('Measurement deleted successfully', {
        userId: user.userId,
        measurementId: id,
      });

      return NextResponse.json({ message: 'Measurement deleted' });
    } catch (error) {
      return handleError(error);
    }
  }
);
