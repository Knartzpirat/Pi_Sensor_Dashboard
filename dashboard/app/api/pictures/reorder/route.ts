// app/api/test-objects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Picture } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// GET - Einzelnes TestObject (mit Bildern)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const includePictures = searchParams.get('includePictures') !== 'false'; // Standard: true

    const testObject = await prisma.testObject.findUnique({
      where: { id: params.id },
      include: {
        label: true,
      },
    });

    if (!testObject) {
      return NextResponse.json(
        { error: 'Test object not found' },
        { status: 404 }
      );
    }

    // Lade Bilder
    let result: typeof testObject & { pictures?: Picture[] } = testObject;

    if (includePictures) {
      const pictures = await prisma.picture.findMany({
        where: {
          entityType: 'TEST_OBJECT',
          entityId: params.id,
        },
        orderBy: { order: 'asc' },
      });

      result = {
        ...testObject,
        pictures,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching test object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test object' },
      { status: 500 }
    );
  }
}

// PUT - TestObject aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, labelId } = await request.json();

    const testObject = await prisma.testObject.update({
      where: { id: params.id },
      data: {
        title,
        description,
        labelId,
      },
      include: {
        label: true,
      },
    });

    // Lade auch Bilder
    const pictures = await prisma.picture.findMany({
      where: {
        entityType: 'TEST_OBJECT',
        entityId: params.id,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      ...testObject,
      pictures,
    });
  } catch (error) {
    console.error('Error updating test object:', error);
    return NextResponse.json(
      { error: 'Failed to update test object' },
      { status: 500 }
    );
  }
}

// DELETE - TestObject löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Lösche zuerst alle Bilder (Files + DB-Einträge)
    const pictures = await prisma.picture.findMany({
      where: {
        entityType: 'TEST_OBJECT',
        entityId: params.id,
      },
    });

    // Lösche Bild-Dateien
    for (const picture of pictures) {
      try {
        const { unlink } = await import('fs/promises');
        const path = await import('path');
        const filepath = path.join(process.cwd(), 'public', picture.url);
        await unlink(filepath);
      } catch (fileError) {
        console.warn('Could not delete file:', fileError);
      }
    }

    // Lösche Bilder aus DB
    await prisma.picture.deleteMany({
      where: {
        entityType: 'TEST_OBJECT',
        entityId: params.id,
      },
    });

    // Lösche TestObject
    await prisma.testObject.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test object deleted' });
  } catch (error) {
    console.error('Error deleting test object:', error);
    return NextResponse.json(
      { error: 'Failed to delete test object' },
      { status: 500 }
    );
  }
}
