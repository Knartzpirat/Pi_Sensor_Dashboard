import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { sensorIdSchema, updateSensorSchema } from '@/lib/validations/sensors';
import { handleError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

const prisma = getPrismaClient();

/**
 * GET /api/sensors/[id]
 * Get a single sensor
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = await validateParams(params, sensorIdSchema);
      const sensor = await logger.trackPerformance(
        'Find sensor by ID',
        async () => {
          return await prisma.sensor.findUnique({
            where: { id },
            include: {
              entities: true,
            },
          });
        },
        { userId: user.userId, sensorId: id }
      );

      if (!sensor) {
        throw new NotFoundError('Sensor', id);
      }

      logger.info('Sensor fetched successfully', {
        userId: user.userId,
        sensorId: id,
      });

      return NextResponse.json({ sensor });
    } catch (error) {
      return handleError(error);
    }
  }
);

/**
 * PATCH /api/sensors/[id]
 * Update a sensor
 */
export const PATCH = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = await validateParams(params, sensorIdSchema);
      const data = await validateBody(request, updateSensorSchema);

      const sensor = await logger.trackPerformance(
        'Update sensor',
        async () => {
          return await prisma.sensor.update({
            where: { id },
            data,
            include: {
              entities: true,
            },
          });
        },
        { userId: user.userId, sensorId: id }
      );

      logger.info('Sensor updated successfully', {
        userId: user.userId,
        sensorId: id,
      });

      return NextResponse.json({ sensor });
    } catch (error) {
      return handleError(error);
    }
  }
);

/**
 * DELETE /api/sensors/[id]
 * Delete a sensor
 */
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    context: { params: { id: string } }
  ) => {
    try {
      const { params } = context;
      const { id } = await validateParams(params, sensorIdSchema);
      const sensor = await prisma.sensor.findUnique({
        where: { id },
      });

      if (!sensor) {
        throw new NotFoundError('Sensor', id);
      }

      // Delete from backend (use sensor.id because that's what was used when creating)
      try {
        await logger.trackPerformance(
          'Delete sensor from backend',
          async () => {
            await fetch(`${env.backendUrl}/sensors/${sensor.id}`, {
              method: 'DELETE',
            });
          },
          { sensorId: id }
        );
      } catch (backendError) {
        logger.warn('Backend delete error (continuing with database delete)', backendError, {
          sensorId: id,
        });
      }

      // Delete from database
      await logger.trackPerformance(
        'Delete sensor from database',
        async () => {
          await prisma.sensor.delete({
            where: { id },
          });
        },
        { userId: user.userId, sensorId: id }
      );

      logger.info('Sensor deleted successfully', {
        userId: user.userId,
        sensorId: id,
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleError(error);
    }
  }
);
