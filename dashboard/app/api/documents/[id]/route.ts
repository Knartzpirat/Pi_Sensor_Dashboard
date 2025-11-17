import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { fileIdSchema, updateDocumentSchema } from '@/lib/validations/files';
import { handleError, NotFoundError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { reorderDocuments } from '@/lib/file-helpers';

const prisma = getPrismaClient();

// PATCH - Update document name or order
export const PATCH = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, fileIdSchema);
      const data = await validateBody(request, updateDocumentSchema);

      const updateData: { originalName?: string; order?: number } = {};
      if (data.originalName) updateData.originalName = data.originalName;
      if (data.order !== undefined) updateData.order = data.order;

      const document = await logger.trackPerformance(
        'Update document',
        async () => {
          return await prisma.document.update({
            where: { id },
            data: updateData,
          });
        },
        { userId: user.userId, documentId: id, updateFields: Object.keys(updateData) }
      );

      logger.info('Document updated successfully', {
        userId: user.userId,
        documentId: id,
        updatedFields: Object.keys(updateData),
      });

      return NextResponse.json(document);
    } catch (error) {
      return handleError(error);
    }
  }
);

// DELETE - Delete document
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, fileIdSchema);
      const document = await prisma.document.findUnique({
        where: { id },
      });

      if (!document) {
        throw new NotFoundError('Document', id);
      }

      // Delete file from filesystem
      try {
        const filepath = path.join(process.cwd(), 'public', document.url);
        await logger.trackPerformance(
          'Delete document file from filesystem',
          async () => {
            await unlink(filepath);
          },
          { documentId: id, filepath }
        );
      } catch (fileError) {
        logger.warn('Could not delete document file from filesystem (continuing with database delete)', fileError, {
          documentId: id,
          filepath: document.url,
        });
      }

      // Delete from database
      await logger.trackPerformance(
        'Delete document from database',
        async () => {
          await prisma.document.delete({
            where: { id },
          });
        },
        { userId: user.userId, documentId: id }
      );

      // Reorder remaining documents using shared helper
      await reorderDocuments(document.entityType, document.entityId);

      logger.info('Document deleted successfully', {
        userId: user.userId,
        documentId: id,
        entityType: document.entityType,
        entityId: document.entityId,
      });

      return NextResponse.json({ message: 'Document deleted successfully' });
    } catch (error) {
      return handleError(error);
    }
  }
);
