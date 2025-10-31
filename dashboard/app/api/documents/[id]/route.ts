import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// PATCH - Update document name
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { originalName } = await request.json();

    if (!originalName || typeof originalName !== 'string') {
      return NextResponse.json(
        { error: 'originalName is required and must be a string' },
        { status: 400 }
      );
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        originalName,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
