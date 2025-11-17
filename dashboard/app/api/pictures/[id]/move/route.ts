// app/api/pictures/[id]/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// POST - Bild hoch oder runter verschieben
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { direction } = await request.json(); // 'up' oder 'down'

    if (direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { error: 'direction must be "up" or "down"' },
        { status: 400 }
      );
    }

    const picture = await prisma.picture.findUnique({
      where: { id: params.id },
    });

    if (!picture) {
      return NextResponse.json(
        { error: 'Picture not found' },
        { status: 404 }
      );
    }

    const currentOrder = picture.order;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    if (newOrder < 0) {
      return NextResponse.json(
        { error: 'Already at first position' },
        { status: 400 }
      );
    }

    // Finde Bild an der Zielposition
    const targetPicture = await prisma.picture.findFirst({
      where: {
        entityType: picture.entityType,
        entityId: picture.entityId,
        order: newOrder,
      },
    });

    if (!targetPicture) {
      return NextResponse.json(
        { error: 'Already at last position' },
        { status: 400 }
      );
    }

    // Tausche Positionen
    await prisma.$transaction([
      prisma.picture.update({
        where: { id: picture.id },
        data: { order: newOrder },
      }),
      prisma.picture.update({
        where: { id: targetPicture.id },
        data: { order: currentOrder },
      }),
    ]);

    // Hole aktualisierte Bilder
    const pictures = await prisma.picture.findMany({
      where: {
        entityType: picture.entityType,
        entityId: picture.entityId,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(pictures);
  } catch (error) {
    console.error('Error moving picture:', error);
    return NextResponse.json(
      { error: 'Failed to move picture' },
      { status: 500 }
    );
  }
}
