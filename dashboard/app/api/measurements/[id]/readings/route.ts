import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * POST /api/measurements/[id]/readings
 * Store sensor readings (called by WebSocket client)
 *
 * This endpoint receives batches of sensor readings from the WebSocket client
 * and stores them in the database.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { readings } = body;

    if (!readings || !Array.isArray(readings)) {
      return NextResponse.json(
        { error: 'Invalid readings format' },
        { status: 400 }
      );
    }

    // Get measurement
    const measurement = await prisma.measurement.findUnique({
      where: { id: params.id },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      );
    }

    // Get all entities for this measurement's sensors
    const sensors = await prisma.sensor.findMany({
      where: {
        measurements: {
          some: {
            id: params.id,
          },
        },
      },
      include: {
        entities: true,
      },
    });

    const entityMap = new Map<string, string>();
    sensors.forEach((sensor) => {
      sensor.entities.forEach((entity) => {
        // Map entity_id from backend to database entity ID
        entityMap.set(entity.id, entity.id);
      });
    });

    // Prepare readings for bulk insert
    const readingsData = readings
      .filter((r: any) => entityMap.has(r.entity_id))
      .map((r: any) => ({
        measurementId: params.id,
        entityId: r.entity_id,
        value: r.value,
        quality: r.quality || 1.0,
        timestamp: new Date(r.timestamp),
      }));

    if (readingsData.length === 0) {
      return NextResponse.json(
        { error: 'No valid readings to store' },
        { status: 400 }
      );
    }

    // Bulk insert readings
    await prisma.sensorReading.createMany({
      data: readingsData,
      skipDuplicates: true,
    });

    // Update measurement statistics
    await prisma.measurement.update({
      where: { id: params.id },
      data: {
        readingsCount: {
          increment: readingsData.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      stored: readingsData.length,
    });
  } catch (error) {
    console.error('Error storing readings:', error);
    return NextResponse.json(
      { error: 'Failed to store readings' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/measurements/[id]/readings
 * Get readings for a measurement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    const readings = await prisma.sensorReading.findMany({
      where: {
        measurementId: params.id,
      },
      include: {
        entity: {
          include: {
            sensor: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.sensorReading.count({
      where: {
        measurementId: params.id,
      },
    });

    return NextResponse.json({
      readings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching readings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch readings' },
      { status: 500 }
    );
  }
}
