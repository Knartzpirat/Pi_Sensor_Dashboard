import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * POST /api/sensor-readings/collect
 * Collects sensor readings from the backend and stores them in the database
 * This endpoint is called by the background polling service
 */
export async function POST(request: NextRequest) {
  try {
    // Get all enabled sensors
    const sensors = await prisma.sensor.findMany({
      where: { enabled: true },
      include: { entities: true },
    });

    if (sensors.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enabled sensors found',
        readingsCount: 0
      });
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const timestamp = new Date();
    let totalReadings = 0;

    // Collect readings from all sensors
    for (const sensor of sensors) {
      try {
        // Read sensor data from backend
        const response = await fetch(`${backendUrl}/sensors/${sensor.id}/read`);

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

          // Create sensor reading in database
          await prisma.sensorReading.create({
            data: {
              entityId: entity.id,
              value: reading.value,
              quality: reading.quality ?? 1.0,
              timestamp,
              measurementId: null, // No measurement - this is continuous background collection
            },
          });

          totalReadings++;
        }
      } catch (error) {
        console.error(`Error collecting data from sensor ${sensor.name}:`, error);
        // Continue with next sensor even if one fails
      }
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
