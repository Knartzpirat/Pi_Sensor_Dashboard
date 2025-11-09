import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { z } from 'zod';

const hardwareConfigSchema = z.object({
  boardType: z.string().optional(),
  dashboardUpdateInterval: z.number().int().min(100).max(60000).optional(),
  graphDataRetentionTime: z.number().int().min(60000).max(86400000).optional(), // 1 min to 24 hours
});

export async function GET() {
  const prisma = getPrismaClient();

  try {
    // Get or create hardware config
    let config = await prisma.hardwareConfig.findFirst();

    if (!config) {
      // Create default config if none exists
      config = await prisma.hardwareConfig.create({
        data: {
          boardType: 'GPIO',
          dashboardUpdateInterval: 5000,
          graphDataRetentionTime: 3600000, // 1 hour default
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching hardware config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hardware configuration' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    const body = await request.json();
    const validatedData = hardwareConfigSchema.parse(body);

    // Get or create hardware config
    let config = await prisma.hardwareConfig.findFirst();

    if (!config) {
      // Create new config
      config = await prisma.hardwareConfig.create({
        data: {
          boardType: validatedData.boardType || 'GPIO',
          dashboardUpdateInterval: validatedData.dashboardUpdateInterval || 5000,
          graphDataRetentionTime: validatedData.graphDataRetentionTime || 3600000,
        },
      });
    } else {
      // Update existing config
      config = await prisma.hardwareConfig.update({
        where: { id: config.id },
        data: validatedData,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating hardware config:', error);
    return NextResponse.json(
      { error: 'Failed to update hardware configuration' },
      { status: 500 }
    );
  }
}
