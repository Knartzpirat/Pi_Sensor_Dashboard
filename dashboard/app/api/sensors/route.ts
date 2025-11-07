import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { validateSensorConfig } from '@/lib/sensor-config';
import { isConnectionTypeSupported } from '@/types/sensor';

const prisma = getPrismaClient();

/**
 * GET /api/sensors
 * List all sensors
 */
export async function GET() {
  try {
    const sensors = await prisma.sensor.findMany({
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

    // Create sensor
    const sensor = await prisma.sensor.create({
      data: {
        name,
        driver,
        connectionType,
        pin,
        connectionParams,
        pollInterval: pollInterval || 1.0,
        enabled: enabled !== undefined ? enabled : true,
        calibration,
      },
    });

    // Send configuration to Python backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/sensors/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          driver,
          connection_type: connectionType,
          pin,
          connection_params: connectionParams,
          poll_interval: pollInterval || 1.0,
          enabled: enabled !== undefined ? enabled : true,
          calibration,
        }),
      });

      if (!response.ok) {
        console.error('Failed to add sensor to backend');
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
