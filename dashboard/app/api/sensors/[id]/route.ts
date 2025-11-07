import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * GET /api/sensors/[id]
 * Get a single sensor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sensor = await prisma.sensor.findUnique({
      where: { id: params.id },
      include: {
        entities: true,
      },
    });

    if (!sensor) {
      return NextResponse.json(
        { error: 'Sensor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sensor });
  } catch (error) {
    console.error('Error fetching sensor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sensor' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sensors/[id]
 * Update a sensor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const sensor = await prisma.sensor.update({
      where: { id: params.id },
      data: body,
      include: {
        entities: true,
      },
    });

    return NextResponse.json({ sensor });
  } catch (error) {
    console.error('Error updating sensor:', error);
    return NextResponse.json(
      { error: 'Failed to update sensor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sensors/[id]
 * Delete a sensor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sensor = await prisma.sensor.findUnique({
      where: { id: params.id },
    });

    if (!sensor) {
      return NextResponse.json(
        { error: 'Sensor not found' },
        { status: 404 }
      );
    }

    // Delete from backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/sensors/${sensor.name}`, {
        method: 'DELETE',
      });
    } catch (backendError) {
      console.error('Backend delete error:', backendError);
    }

    // Delete from database
    await prisma.sensor.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sensor:', error);
    return NextResponse.json(
      { error: 'Failed to delete sensor' },
      { status: 500 }
    );
  }
}
