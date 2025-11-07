import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * GET /api/measurements
 * List all measurements
 */
export async function GET() {
  try {
    const measurements = await prisma.measurement.findMany({
      include: {
        testObject: true,
        sensors: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({ measurements });
  } catch (error) {
    console.error('Error fetching measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch measurements' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/measurements
 * Start a new measurement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      title,
      description,
      testObjectId,
      sensorIds,
      interval,
      duration,
    } = body;

    // Validate required fields
    if (!sessionId || !title || !sensorIds || sensorIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if session ID already exists
    const existing = await prisma.measurement.findUnique({
      where: { sessionId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Session ID already exists' },
        { status: 409 }
      );
    }

    // Get sensor names for backend
    const sensors = await prisma.sensor.findMany({
      where: {
        id: { in: sensorIds },
      },
    });

    if (sensors.length !== sensorIds.length) {
      return NextResponse.json(
        { error: 'Some sensors not found' },
        { status: 404 }
      );
    }

    // Create measurement in database
    const measurement = await prisma.measurement.create({
      data: {
        sessionId,
        title,
        description,
        testObjectId,
        status: 'STARTING',
        interval: interval || 1.0,
        duration,
        startTime: new Date(),
        sensors: {
          connect: sensorIds.map((id: string) => ({ id })),
        },
      },
      include: {
        sensors: true,
        testObject: true,
      },
    });

    // Start measurement on backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/measurements/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          sensor_ids: sensors.map((s) => s.name),
          interval: interval || 1.0,
          duration,
        }),
      });

      if (!response.ok) {
        console.error('Failed to start measurement on backend');
        // Update status to error
        await prisma.measurement.update({
          where: { id: measurement.id },
          data: { status: 'ERROR' },
        });

        return NextResponse.json(
          { error: 'Failed to start measurement on backend' },
          { status: 500 }
        );
      }

      // Update status to running
      await prisma.measurement.update({
        where: { id: measurement.id },
        data: { status: 'RUNNING' },
      });
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      await prisma.measurement.update({
        where: { id: measurement.id },
        data: { status: 'ERROR' },
      });

      return NextResponse.json(
        { error: 'Backend connection failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ measurement }, { status: 201 });
  } catch (error) {
    console.error('Error creating measurement:', error);
    return NextResponse.json(
      { error: 'Failed to create measurement' },
      { status: 500 }
    );
  }
}
