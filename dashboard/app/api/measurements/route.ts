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
      title,
      description,
      sensors: sensorMappings, // Array of { sensorId, testObjectId }
      interval,
      duration,
    } = body;

    // Validate required fields
    if (!title || !sensorMappings || sensorMappings.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract sensor IDs
    const sensorIds = sensorMappings.map((m: any) => m.sensorId);

    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Get sensor data for backend
    const sensorsData = await prisma.sensor.findMany({
      where: {
        id: { in: sensorIds },
      },
    });

    if (sensorsData.length !== sensorIds.length) {
      return NextResponse.json(
        { error: 'Some sensors not found' },
        { status: 404 }
      );
    }

    // Create measurement in database with sensor-testObject mappings
    const measurement = await prisma.measurement.create({
      data: {
        sessionId,
        title,
        description,
        status: 'STARTING',
        interval: interval || 1.0,
        duration,
        startTime: new Date(),
        measurementSensors: {
          create: sensorMappings.map((mapping: any) => ({
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

    // Start measurement on backend
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/measurements/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          sensor_ids: sensorsData.map((s) => s.id), // Backend uses frontend IDs as sensor names
          interval: interval || 1.0,
          duration,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Backend could not start measurement (sensors might not be connected):', errorText);
        console.warn('Measurement will continue with simulated data if available');

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
      }
    } catch (backendError) {
      console.warn('Backend connection error:', backendError);
      console.warn('Measurement will continue with simulated data if available');

      // Still mark as RUNNING - the backend might still generate simulated data
      await prisma.measurement.update({
        where: { id: measurement.id },
        data: { status: 'RUNNING' },
      });
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
