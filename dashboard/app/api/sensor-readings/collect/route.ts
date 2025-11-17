import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { env } from '@/lib/env';

const prisma = getPrismaClient();

/**
 * POST /api/sensor-readings/collect
 * Collects sensor readings from the backend and stores them in the database
 * This endpoint is called by the background polling service
 */
export async function POST(request: NextRequest) {
  try {
    // Get current board type from hardware config
    const hardwareConfig = await prisma.hardwareConfig.findFirst();
    const currentBoardType = hardwareConfig?.boardType || 'GPIO';

    // Check if there's an active measurement
    const activeMeasurement = await prisma.measurement.findFirst({
      where: {
        status: {
          in: ['STARTING', 'RUNNING']
        }
      },
      include: {
        measurementSensors: {
          include: {
            sensor: true
          }
        }
      }
    });

    // Get all enabled sensors for the CURRENT board only
    const sensors = await prisma.sensor.findMany({
      where: {
        enabled: true,
        boardType: currentBoardType,
      },
      include: { entities: true },
    });

    if (sensors.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No enabled sensors found for board type ${currentBoardType}`,
        readingsCount: 0
      });
    }

    const timestamp = new Date();
    let totalReadings = 0;

    // Track readings per measurement
    const measurementReadingCounts = new Map<string, number>();

    // Collect readings from all sensors
    for (const sensor of sensors) {
      try {
        // Read sensor data from backend
        const response = await fetch(`${env.backendUrl}/sensors/${sensor.id}/read`);

        if (!response.ok) {
          console.error(`Failed to read sensor ${sensor.name}: ${response.statusText}`);
          continue;
        }

        const data = await response.json();

        if (!data.readings || !Array.isArray(data.readings)) {
          console.error(`Invalid response format for sensor ${sensor.name}`);
          continue;
        }

        // Store each reading in the database
        for (const reading of data.readings) {
          // Backend entity_id format: "sensorId_EntityName"
          // Extract entity name from backend entity_id
          const parts = reading.entity_id.split('_');
          const entityName = parts.slice(1).join('_');

          // Find corresponding entity in our database
          const entity = sensor.entities.find((e) => e.name === entityName);

          if (!entity) {
            console.warn(`Entity ${entityName} not found for sensor ${sensor.name}`);
            continue;
          }

          // Check if this sensor is part of the active measurement
          let measurementId = null;
          if (activeMeasurement) {
            const isSensorInMeasurement = activeMeasurement.measurementSensors.some(
              (ms) => ms.sensorId === sensor.id
            );
            if (isSensorInMeasurement) {
              measurementId = activeMeasurement.id;
              // Track count for this measurement
              const currentCount = measurementReadingCounts.get(measurementId) || 0;
              measurementReadingCounts.set(measurementId, currentCount + 1);
            }
          }

          // Create sensor reading in database
          await prisma.sensorReading.create({
            data: {
              entityId: entity.id,
              value: reading.value,
              quality: reading.quality ?? 1.0,
              timestamp,
              measurementId, // Link to measurement if this sensor is part of one
            },
          });

          totalReadings++;
        }
      } catch (error) {
        console.error(`Error collecting data from sensor ${sensor.name}:`, error);
        // Continue with next sensor even if one fails
      }
    }

    // Update readingsCount for all measurements that received new readings
    for (const [measurementId, newReadings] of measurementReadingCounts.entries()) {
      await prisma.measurement.update({
        where: { id: measurementId },
        data: {
          readingsCount: {
            increment: newReadings
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Collected ${totalReadings} readings from ${sensors.length} sensors`,
      readingsCount: totalReadings,
      timestamp: timestamp.toISOString(),
    });
  } catch (error) {
    console.error('Error in sensor data collection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to collect sensor readings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
