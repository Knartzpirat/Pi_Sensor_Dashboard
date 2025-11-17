import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { validateSensorConfig } from '@/lib/sensor-config';
import { isConnectionTypeSupported } from '@/types/sensor';
import { withAuth } from '@/lib/auth-helpers';
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createSensorSchema } from '@/lib/validations/sensors';
import type { BackendSupportedSensorsResponse, BackendSensorMetadata } from '@/types';
import { env } from '@/lib/env';
import { Prisma } from '@prisma/client';

const prisma = getPrismaClient();

/**
 * Generate a random vibrant color for sensor entities
 */
function generateRandomColor(): string {
  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f43f5e', // rose
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * GET /api/sensors
 * List sensors for current board type
 */
export const GET = withAuth(async (request, user) => {
  try {
    // Get current board type
    const hardwareConfig = await prisma.hardwareConfig.findFirst();
    const boardType = hardwareConfig?.boardType || 'GPIO';

    // Only fetch sensors for current board
    const sensors = await prisma.sensor.findMany({
      where: {
        boardType,
      },
      include: {
        entities: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ sensors });
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensors' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/sensors
 * Create a new sensor
 */
export const POST = withAuthAndValidation(
  createSensorSchema,
  async (request, user, data) => {
    try {
      // Get hardware configuration to check board type
      const hardwareConfig = await prisma.hardwareConfig.findFirst();
      const boardType = hardwareConfig?.boardType || 'GPIO';

      // Validate connection type is supported by board
      if (!isConnectionTypeSupported(data.connectionType, boardType as 'GPIO' | 'CUSTOM')) {
        return NextResponse.json(
          { error: `Connection type '${data.connectionType}' is not supported on ${boardType} board` },
          { status: 400 }
        );
      }

      // Validate sensor configuration (pin/channel selection)
      const validation = validateSensorConfig(boardType as 'GPIO' | 'CUSTOM', data.connectionType, data.pin ?? undefined);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Check if sensor name already exists
      const existing = await prisma.sensor.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Sensor with this name already exists' },
          { status: 409 }
        );
      }

      // For I2C sensors, check if the I2C address is already in use on the same pin
      if (data.connectionType === 'i2c' && data.connectionParams?.i2c_address) {
        const i2cAddress = data.connectionParams.i2c_address as string;
        const existingI2C = await prisma.sensor.findFirst({
          where: {
            connectionType: 'i2c',
            pin: data.pin,
            boardType: data.boardType,
            connectionParams: {
              path: ['i2c_address'],
              equals: i2cAddress,
            },
          },
        });

        if (existingI2C) {
          return NextResponse.json(
            { error: `I2C address ${i2cAddress} is already in use on this bus` },
            { status: 409 }
          );
        }
      }

      // For non-I2C sensors (IO), check if pin is already in use
      if (data.connectionType === 'io' && data.pin !== null && data.pin !== undefined) {
        const existingPin = await prisma.sensor.findFirst({
          where: {
            pin: data.pin,
            boardType: data.boardType,
            connectionType: 'io',
          },
        });

        if (existingPin) {
          return NextResponse.json(
            { error: `Pin ${data.pin} is already in use by sensor "${existingPin.name}"` },
            { status: 409 }
          );
        }
      }

      // Fetch sensor metadata from backend to get entities
      let sensorMetadata: BackendSensorMetadata | null = null;
      try {
        const metadataResponse = await fetch(`${env.backendUrl}/sensors/supported?board_type=${boardType}`);
        if (metadataResponse.ok) {
          const apiData: BackendSupportedSensorsResponse = await metadataResponse.json();
          sensorMetadata = apiData.sensors.find((s) => s.driverName === data.driver) ?? null;
        }
      } catch (error) {
        console.error('Failed to fetch sensor metadata:', error);
      }

      // Create sensor with entities
      const sensor = await prisma.sensor.create({
        data: {
          name: data.name,
          driver: data.driver,
          connectionType: data.connectionType,
          boardType: data.boardType,
          pin: data.pin,
          connectionParams: (data.connectionParams || {}) as Prisma.InputJsonValue,
          pollInterval: data.pollInterval,
          enabled: data.enabled,
          calibration: (data.calibration || {}) as Prisma.InputJsonValue,
          entities: sensorMetadata?.entities
            ? {
                create: sensorMetadata.entities.map((entity) => ({
                  name: entity.name,
                  unit: entity.unit,
                  type: entity.type,
                  color: generateRandomColor(), // Assign random color to each entity
                })),
              }
            : undefined,
        },
        include: {
          entities: true,
        },
      });

      // Send configuration to Python backend
      try {
        const response = await fetch(`${env.backendUrl}/sensors/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: sensor.id, // Use sensor ID as name for backend
            driver: data.driver,
            connection_type: data.connectionType,
            connection_params: {
              ...data.connectionParams,
              pin: data.pin,
            },
            poll_interval: data.pollInterval,
            enabled: data.enabled,
            calibration: data.calibration,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to add sensor to backend:', errorText);
          // Don't fail the request, sensor is still saved in DB
        }
      } catch (backendError) {
        console.error('Backend connection error:', backendError);
        // Continue anyway, sensor is saved in DB
      }

      return NextResponse.json({ sensor }, { status: 201 });
    } catch (error) {
      console.error('Error creating sensor:', error);
      return NextResponse.json(
        { error: 'Failed to create sensor' },
        { status: 500 }
      );
    }
  }
);
