// app/api/pictures/[pictureId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET - Einzelnes Bild
export async function GET(
  request: NextRequest,
  { params }: { params: { pictureId: string } }
) {
  try {
    const picture = await prisma.picture.findUnique({
      where: { id: params.pictureId },
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

// PATCH - Bild umbenennen
export async function PATCH(
  request: NextRequest,
  { params }: { params: { pictureId: string } }
) {
  try {
    const { originalName } = await request.json();

    if (!originalName) {
      return NextResponse.json(
        { error: 'originalName is required' },
        { status: 400 }
      );
    }

    const picture = await prisma.picture.update({
      where: { id: params.pictureId },
      data: { originalName },
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
  { params }: { params: { pictureId: string } }
) {
  try {
    // Hole Bild-Informationen
    const picture = await prisma.picture.findUnique({
      where: { id: params.pictureId },
    });

    if (!picture) {
      return NextResponse.json({ error: 'Picture not found' }, { status: 404 });
    }

    // Lösche Datei vom Server
    try {
      const filepath = path.join(process.cwd(), 'public', picture.url);
      await unlink(filepath);
    } catch (fileError) {
      console.warn('Could not delete file:', fileError);
      // Weiter machen, auch wenn Datei nicht gelöscht werden kann
    }

    // Lösche aus DB
    await prisma.picture.delete({
      where: { id: params.pictureId },
    });

    // Aktualisiere Order der verbleibenden Bilder
    await reorderPictures(picture.testObjectId);

    return NextResponse.json({
      message: 'Picture deleted successfully',
    });
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

// Helper: Bilder neu nummerieren
async function reorderPictures(testObjectId: string) {
  const pictures = await prisma.picture.findMany({
    where: { testObjectId },
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < pictures.length; i++) {
    await prisma.picture.update({
      where: { id: pictures[i].id },
      data: { order: i },
    });
  }
}
