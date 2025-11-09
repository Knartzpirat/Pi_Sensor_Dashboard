import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

/**
 * GET /api/hardware/config
 * Get hardware configuration (or default if none exists)
 */
export async function GET() {
  try {
    // Get first (and should be only) config
    let config = await prisma.hardwareConfig.findFirst();

    // Create default if doesn't exist
    if (!config) {
      config = await prisma.hardwareConfig.create({
        data: {
          boardType: 'GPIO',
        },
      });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching hardware config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hardware config' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/hardware/config
 * Update hardware configuration
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    // Get existing config or create
    let config = await prisma.hardwareConfig.findFirst();

    if (!config) {
      config = await prisma.hardwareConfig.create({
        data: {
          boardType: body.boardType || 'GPIO',
        },
      });
    } else {
      config = await prisma.hardwareConfig.update({
        where: { id: config.id },
        data: {
          boardType: body.boardType,
        },
      });
    }

    // Send configuration to Python backend
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

      await fetch(`${backendUrl}/board/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_type: config.boardType,
        }),
      });
    } catch (backendError) {
      console.error('Backend config error:', backendError);
      // Don't fail the request, config is still saved
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error updating hardware config:', error);
    return NextResponse.json(
      { error: 'Failed to update hardware config' },
      { status: 500 }
    );
  }
}
