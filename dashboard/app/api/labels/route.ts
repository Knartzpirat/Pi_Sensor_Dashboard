// app/api/labels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EntityType } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Labels abrufen (mit optionalem Type-Filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as EntityType | null;

    const labels = await prisma.label.findMany({
      where: type ? { type } : undefined,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { testObjects: true },
        },
      },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch labels' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Label erstellen
export async function POST(request: NextRequest) {
  try {
    const { name, color, type } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validiere EntityType
    if (!Object.values(EntityType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    const label = await prisma.label.create({
      data: { name, color, type },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Label with this name and type already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
