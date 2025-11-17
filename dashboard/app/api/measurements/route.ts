import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createMeasurementSchema } from '@/lib/validations/measurements';
import { handleError, NotFoundError, ExternalServiceError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';

const prisma = getPrismaClient();

/**
 * GET /api/measurements
 * List all measurements
 */
export const GET = withAuth(async (request, user) => {
  try {
    const measurements = await logger.trackPerformance(
      'Fetch all measurements',
      async () => {
        return await prisma.measurement.findMany({
          include: {
            measurementSensors: {
              include: {
                sensor: true,
                testObject: true,
              },
            },
          },
          orderBy: {
            startTime: 'desc',
          },
        });
      },
      { userId: user.userId }
    );

    logger.info('Measurements fetched successfully', {
      userId: user.userId,
      count: measurements.length,
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * POST /api/measurements
 * Start a new measurement
 */
export const POST = withAuthAndValidation(
  createMeasurementSchema,
  async (request, user, data) => {
    try {
      // Extract sensor IDs
      const sensorIds = data.sensors.map((m) => m.sensorId);

      // Generate unique session ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Get sensor data for backend
      const sensorsData = await logger.trackPerformance(
        'Find sensors for measurement',
        async () => {
          return await prisma.sensor.findMany({
            where: {
              id: { in: sensorIds },
            },
          });
        },
        { userId: user.userId, sensorCount: sensorIds.length }
      );

      if (sensorsData.length !== sensorIds.length) {
        const foundIds = sensorsData.map((s) => s.id);
        const missingIds = sensorIds.filter((id) => !foundIds.includes(id));
        logger.warn('Some sensors not found for measurement', {
          userId: user.userId,
          requestedCount: sensorIds.length,
          foundCount: sensorsData.length,
          missingIds,
        });
        throw new NotFoundError('Sensor', missingIds.join(', '));
      }

      // Create measurement in database with sensor-testObject mappings
      const measurement = await logger.trackPerformance(
        'Create measurement in database',
        async () => {
          return await prisma.measurement.create({
            data: {
              sessionId,
              title: data.title,
              description: data.description,
              status: 'STARTING',
              interval: data.interval || 1.0,
              duration: data.duration,
              startTime: new Date(),
              measurementSensors: {
                create: data.sensors.map((mapping) => ({
                  sensorId: mapping.sensorId,
                  testObjectId: mapping.testObjectId || null,
                })),
              },
            },
            include: {
              measurementSensors: {
                include: {
                  sensor: true,
                  testObject: true,
                },
              },
            },
          });
        },
        { userId: user.userId, sessionId, sensorCount: sensorIds.length }
      );

      // Start measurement on backend
      try {
        const response = await logger.trackPerformance(
          'Start measurement on backend',
          async () => {
            return await fetch(`${env.backendUrl}/measurements/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                session_id: sessionId,
                sensor_ids: sensorsData.map((s) => s.id), // Backend uses frontend IDs as sensor names
                interval: data.interval || 1.0,
                duration: data.duration,
              }),
            });
          },
          { sessionId }
        );

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn('Backend could not start measurement (sensors might not be connected)', {
            sessionId,
            measurementId: measurement.id,
            status: response.status,
            errorText,
          });

          // Still mark as RUNNING - the backend will generate simulated data
          await prisma.measurement.update({
            where: { id: measurement.id },
            data: { status: 'RUNNING' },
          });
        } else {
          // Update status to running
          await prisma.measurement.update({
            where: { id: measurement.id },
            data: { status: 'RUNNING' },
          });

          logger.info('Measurement started successfully', {
            userId: user.userId,
            measurementId: measurement.id,
            sessionId,
            sensorCount: sensorsData.length,
          });
        }
      } catch (backendError) {
        logger.warn('Backend connection error (measurement will continue with simulated data)', backendError, {
          sessionId,
          measurementId: measurement.id,
        });

        // Still mark as RUNNING - the backend might still generate simulated data
        await prisma.measurement.update({
          where: { id: measurement.id },
          data: { status: 'RUNNING' },
        });
      }

      return NextResponse.json({ measurement }, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }
);
