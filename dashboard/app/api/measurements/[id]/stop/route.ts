import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * POST /api/measurements/[id]/stop
 * Stop a measurement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const measurement = await prisma.measurement.findUnique({
      where: { id: params.id },
    });

    if (!measurement) {
      return NextResponse.json(
        { error: 'Measurement not found' },
        { status: 404 }
      );
    }

    if (measurement.status === 'COMPLETED' || measurement.status === 'ERROR') {
      return NextResponse.json(
        { error: 'Measurement already stopped' },
        { status: 400 }
      );
    }

    // Stop measurement on backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      await fetch(`${backendUrl}/measurements/${measurement.sessionId}/stop`, {
        method: 'POST',
      });
    } catch (backendError) {
      console.error('Backend stop error:', backendError);
      // Continue anyway, update database
    }

    // Update measurement status
    const updated = await prisma.measurement.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
      include: {
        sensors: true,
        testObject: true,
      },
    });

    return NextResponse.json({ measurement: updated });
  } catch (error) {
    console.error('Error stopping measurement:', error);
    return NextResponse.json(
      { error: 'Failed to stop measurement' },
      { status: 500 }
    );
  }
}
