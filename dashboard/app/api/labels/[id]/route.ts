// app/api/labels/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Einzelnes Label
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const label = await prisma.label.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { testObjects: true }
        }
      }
    });

    if (!label) {
      return NextResponse.json(
        { error: 'Label not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { error: 'Failed to fetch label' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Label bearbeiten
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, color } = await request.json();

    const label = await prisma.label.update({
      where: { id: params.id },
      data: { 
        ...(name && { name }),
        ...(color !== undefined && { color })
      },
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error('Error updating label:', error);
    return NextResponse.json(
      { error: 'Failed to update label' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Label löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.label.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Label deleted' });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { error: 'Failed to delete label' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
