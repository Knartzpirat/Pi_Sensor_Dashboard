// app/api/test-objects/[id]/pictures/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Reihenfolge der Bilder ändern
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { pictureIds } = await request.json();

    if (!Array.isArray(pictureIds)) {
      return NextResponse.json(
        { error: 'pictureIds must be an array' },
        { status: 400 }
      );
    }

    // Aktualisiere Order für jedes Bild
    const updates = pictureIds.map((pictureId, index) =>
      prisma.picture.update({
        where: { id: pictureId },
        data: { order: index },
      })
    );

    await Promise.all(updates);

    // Hole aktualisierte Bilder
    const pictures = await prisma.picture.findMany({
      where: { testObjectId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(pictures);
  } catch (error) {
    console.error('Error reordering pictures:', error);
    return NextResponse.json(
      { error: 'Failed to reorder pictures' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
