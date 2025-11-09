import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { validateSensorConfig } from '@/lib/sensor-config';
import { isConnectionTypeSupported } from '@/types/sensor';

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
export async function GET() {
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
}

/**
 * POST /api/sensors
 * Create a new sensor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      driver,
      connectionType,
      pin,
      connectionParams,
      pollInterval,
      enabled,
      calibration,
    } = body;

    // Validate required fields
    if (!name || !driver || !connectionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get hardware configuration to check board type
    const hardwareConfig = await prisma.hardwareConfig.findFirst();
    const boardType = hardwareConfig?.boardType || 'GPIO';

    // Validate connection type is supported by board
    if (!isConnectionTypeSupported(connectionType, boardType as 'GPIO' | 'CUSTOM')) {
      return NextResponse.json(
        { error: `Connection type '${connectionType}' is not supported on ${boardType} board` },
        { status: 400 }
      );
    }

    // Validate sensor configuration (pin/channel selection)
    const validation = validateSensorConfig(boardType as 'GPIO' | 'CUSTOM', connectionType, pin);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if sensor already exists
    const existing = await prisma.sensor.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Sensor with this name already exists' },
        { status: 409 }
      );
    }

    // Fetch sensor metadata from backend to get entities
    let sensorMetadata = null;
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const metadataResponse = await fetch(`${backendUrl}/sensors/supported?board_type=${boardType}`);
      if (metadataResponse.ok) {
        const data = await metadataResponse.json();
        sensorMetadata = data.sensors.find((s: any) => s.driverName === driver);
      }
    } catch (error) {
      console.error('Failed to fetch sensor metadata:', error);
    }

    // Create sensor with entities
    const sensor = await prisma.sensor.create({
      data: {
        name,
        driver,
        connectionType,
        boardType, // Zuordnung zum aktuellen Board
        pin,
        connectionParams,
        pollInterval: pollInterval || 1.0,
        enabled: enabled !== undefined ? enabled : true,
        calibration,
        entities: sensorMetadata?.entities
          ? {
              create: sensorMetadata.entities.map((entity: any) => ({
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
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/sensors/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sensor.id, // Use sensor ID as name for backend
          driver,
          connection_type: connectionType,
          connection_params: {
            ...connectionParams,
            pin,
          },
          poll_interval: pollInterval || 1.0,
          enabled: enabled !== undefined ? enabled : true,
          calibration,
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
