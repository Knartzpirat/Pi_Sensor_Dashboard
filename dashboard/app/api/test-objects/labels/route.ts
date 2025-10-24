// app/api/labels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Alle Labels
export async function GET() {
  try {
    const labels = await prisma.label.findMany({
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

// POST - Neues Label erstellen
export async function POST(request: NextRequest) {
  try {
    const { name, color } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const label = await prisma.label.create({
      data: { name, color },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Error creating label:', error);
    return NextResponse.json(
      { error: 'Failed to create label' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
