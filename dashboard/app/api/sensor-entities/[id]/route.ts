import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { z } from 'zod';

const updateEntitySchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const prisma = getPrismaClient();

  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateEntitySchema.parse(body);

    // Update the sensor entity color
    const updatedEntity = await prisma.sensorEntity.update({
      where: { id },
      data: { color: validatedData.color },
    });

    return NextResponse.json(updatedEntity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating sensor entity:', error);
    return NextResponse.json(
      { error: 'Failed to update sensor entity' },
      { status: 500 }
    );
  }
}
