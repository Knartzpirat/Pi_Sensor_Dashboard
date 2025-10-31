import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { EntityType } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

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

// DELETE - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete file from filesystem
    try {
      const filepath = path.join(process.cwd(), 'public', document.url);
      await unlink(filepath);
    } catch (fileError) {
      console.warn('Could not delete file:', fileError);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id },
    });

    // Reorder remaining documents
    await reorderDocuments(document.entityType, document.entityId);

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}

// Helper to reorder documents
async function reorderDocuments(entityType: EntityType, entityId: string) {
  const documents = await prisma.document.findMany({
    where: { entityType, entityId },
    orderBy: { order: 'asc' },
  });

  for (let i = 0; i < documents.length; i++) {
    await prisma.document.update({
      where: { id: documents[i].id },
      data: { order: i },
    });
  }
}
