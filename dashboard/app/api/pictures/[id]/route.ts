// app/api/pictures/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EntityType } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET - Einzelnes Bild
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const picture = await prisma.picture.findUnique({
      where: { id },
    });

    if (!picture) {
      return NextResponse.json({ error: 'Picture not found' }, { status: 404 });
    }

    return NextResponse.json(picture);
  } catch (error) {
    console.error('Error fetching picture:', error);
    return NextResponse.json(
      { error: 'Failed to fetch picture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Bild umbenennen oder Order ändern
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { originalName, order } = body;

    if (!originalName && order === undefined) {
      return NextResponse.json(
        { error: 'originalName or order is required' },
        { status: 400 }
      );
    }

    const updateData: { originalName?: string; order?: number } = {};
    if (originalName) updateData.originalName = originalName;
    if (order !== undefined) updateData.order = order;

    const picture = await prisma.picture.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(picture);
  } catch (error) {
    console.error('Error updating picture:', error);
    return NextResponse.json(
      { error: 'Failed to update picture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Bild löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const picture = await prisma.picture.findUnique({
      where: { id },
    });

    if (!picture) {
      return NextResponse.json({ error: 'Picture not found' }, { status: 404 });
    }

    // Lösche Datei
    try {
      const filepath = path.join(process.cwd(), 'public', picture.url);
      await unlink(filepath);
    } catch (fileError) {
      console.warn('Could not delete file:', fileError);
    }

    // Lösche aus DB
    await prisma.picture.delete({
      where: { id },
    });

    // Reorder mit richtigem Typ
    await reorderPictures(picture.entityType, picture.entityId);

    return NextResponse.json({ message: 'Picture deleted successfully' });
  } catch (error) {
    console.error('Error deleting picture:', error);
    return NextResponse.json(
      { error: 'Failed to delete picture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ✅ Helper mit richtigem Typ
async function reorderPictures(entityType: EntityType, entityId: string) {
  const pictures = await prisma.picture.findMany({
    where: { entityType, entityId }, // ← Kein Cast mehr nötig!
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < pictures.length; i++) {
    await prisma.picture.update({
      where: { id: pictures[i].id },
      data: { order: i },
    });
  }
}
