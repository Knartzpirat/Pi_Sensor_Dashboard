// app/api/labels/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { EntityType } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createLabelSchema } from '@/lib/validations/labels';

const prisma = getPrismaClient();

// GET - Labels abrufen (mit optionalem Type-Filter)
export const GET = withAuth(async (request, user) => {
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
  }
});

// POST - Label erstellen
export const POST = withAuthAndValidation(
  createLabelSchema,
  async (request, user, data) => {
    try {
      const label = await prisma.label.create({
        data: {
          name: data.name,
          color: data.color,
          type: data.type,
        },
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
    }
  }
);
