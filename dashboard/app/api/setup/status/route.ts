import { NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

/**
 * GET /api/setup/status
 * Check if the application setup is completed
 */
export async function GET() {
  try {
    const prisma = getPrismaClient();
    const setupStatus = await prisma.setupStatus.findFirst();

    if (!setupStatus || !setupStatus.isCompleted) {
      return NextResponse.json({
        isCompleted: false,
        message: 'Setup not completed',
      });
    }

    return NextResponse.json({
      isCompleted: true,
      completedAt: setupStatus.completedAt,
      version: setupStatus.version,
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    // If database is not accessible, setup is likely needed
    return NextResponse.json(
      {
        isCompleted: false,
        message: 'Setup required',
      },
      { status: 503 }
    );
  }
}
