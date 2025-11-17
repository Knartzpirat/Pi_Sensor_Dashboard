import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import type { SensorReadingWhereInput, GraphDataPoint } from '@/types';

const prisma = getPrismaClient();

/**
 * GET /api/sensor-readings?from=<timestamp>&to=<timestamp>&entityIds=<comma-separated>
 * Get sensor readings for a time range and optional entity filter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const entityIdsParam = searchParams.get('entityIds');

    // Default to last hour if no time range specified
    const fromDate = from ? new Date(parseInt(from)) : new Date(Date.now() - 3600000);
    const toDate = to ? new Date(parseInt(to)) : new Date();

    // Parse entity IDs if provided
    const entityIds = entityIdsParam ? entityIdsParam.split(',') : undefined;

    // Build where clause
    const where: SensorReadingWhereInput = {
      timestamp: {
        gte: fromDate,
        lte: toDate,
      },
      measurementId: null, // Only get background readings, not measurement readings
    };

    if (entityIds && entityIds.length > 0) {
      where.entityId = {
        in: entityIds,
      };
    }

    // Fetch readings
    const readings = await prisma.sensorReading.findMany({
      where,
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
    });

    // Group readings by timestamp for graph data
    const dataPoints: Record<string, GraphDataPoint> = {};

    readings.forEach((reading) => {
      const timestamp = reading.timestamp.getTime();

      if (!dataPoints[timestamp]) {
        dataPoints[timestamp] = {
          timestamp,
        };
      }

      // Use entity ID as key for the value
      dataPoints[timestamp][reading.entityId] = reading.value;
    });

    // Convert to array and sort by timestamp
    const graphData: GraphDataPoint[] = Object.values(dataPoints).sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json({
      success: true,
      data: graphData,
      count: graphData.length,
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching sensor readings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sensor readings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sensor-readings?before=<timestamp>
 * Delete old sensor readings before a certain timestamp
 * Used for data cleanup
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const before = searchParams.get('before');

    if (!before) {
      return NextResponse.json(
        { error: 'Missing required parameter: before' },
        { status: 400 }
      );
    }

    const beforeDate = new Date(parseInt(before));

    const result = await prisma.sensorReading.deleteMany({
      where: {
        timestamp: {
          lt: beforeDate,
        },
        measurementId: null, // Only delete background readings, preserve measurement data
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} old readings`,
      deletedCount: result.count,
      before: beforeDate.toISOString(),
    });
  } catch (error) {
    console.error('Error deleting sensor readings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete sensor readings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
