import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// DELETE - Measurement löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete measurement and all related data (cascade)
    await prisma.measurement.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Measurement deleted' });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    return NextResponse.json(
      { error: 'Failed to delete measurement' },
      { status: 500 }
    );
  }
}
