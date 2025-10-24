// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Alle TestObjects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId');

    const testObjects = await prisma.testObject.findMany({
      where: labelId ? { labelId } : undefined,
      include: {
        label: true,
        pictures: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(testObjects);
  } catch (error) {
    console.error('Error fetching test objects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test objects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
        pictures: true,
      },
    });

    return NextResponse.json(testObject, { status: 201 });
  } catch (error) {
    console.error('Error creating test object:', error);
    return NextResponse.json(
      { error: 'Failed to create test object' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
