// app/api/test-objects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// GET - Einzelnes TestObject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const testObject = await prisma.testObject.findUnique({
      where: { id },
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
    }
}

// PUT - TestObject aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, description, labelId } = await request.json();

    const testObject = await prisma.testObject.update({
      where: { id },
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
  }
}

// DELETE - TestObject löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.testObject.delete({
      where: { id },
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
