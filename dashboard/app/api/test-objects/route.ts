// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// GET - Alle TestObjects (mit optionalen Bildern)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId');
    const includePictures = searchParams.get('includePictures') === 'true';
    const pictureLimit = searchParams.get('pictureLimit'); // z.B. nur erstes Bild

    const testObjects = await prisma.testObject.findMany({
      where: labelId ? { labelId } : undefined,
      include: {
        label: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Wenn Bilder gewünscht sind, lade sie separat
    if (includePictures) {
      const testObjectsWithPictures = await Promise.all(
        testObjects.map(async (testObject) => {
          const pictures = await prisma.picture.findMany({
            where: {
              entityType: 'TEST_OBJECT',
              entityId: testObject.id,
            },
            orderBy: { order: 'asc' },
            ...(pictureLimit ? { take: parseInt(pictureLimit) } : {}),
          });

          return {
            ...testObject,
            pictures,
          };
        })
      );

      return NextResponse.json(testObjectsWithPictures);
    }

    return NextResponse.json(testObjects);
  } catch (error) {
    console.error('Error fetching test objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test objects' },
      { status: 500 }
    );
  }
}

// POST - Neues TestObject erstellen
export async function POST(request: NextRequest) {
  try {
    const { title, description, labelId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const testObject = await prisma.testObject.create({
      data: {
        title,
        description,
        labelId,
      },
      include: {
        label: true,
      },
    });

    return NextResponse.json(testObject, { status: 201 });
  } catch (error) {
    console.error('Error creating test object:', error);
    return NextResponse.json(
      { error: 'Failed to create test object' },
      { status: 500 }
    );
  }
}
