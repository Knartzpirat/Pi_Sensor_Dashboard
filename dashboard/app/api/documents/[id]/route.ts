import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

// PATCH - Update document name or order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { originalName, order } = body;

    if (!originalName && order === undefined) {
      return NextResponse.json(
        { error: 'originalName or order is required' },
        { status: 400 }
      );
    }

    const updateData: { originalName?: string; order?: number } = {};
    if (originalName) updateData.originalName = originalName;
    if (order !== undefined) updateData.order = order;

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
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
