// app/api/test-objects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Einzelnes TestObject
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testObject = await prisma.testObject.findUnique({
      where: { id: params.id },
      include: {
        label: true
      },
    });

    if (!testObject) {
      return NextResponse.json(
        { error: 'Test object not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testObject);
  } catch (error) {
    console.error('Error fetching test object:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test object' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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
        label: true
      },
    });

    return NextResponse.json(testObject);
  } catch (error) {
    console.error('Error updating test object:', error);
    return NextResponse.json(
      { error: 'Failed to update test object' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - TestObject löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
  } finally {
    await prisma.$disconnect();
  }
}
