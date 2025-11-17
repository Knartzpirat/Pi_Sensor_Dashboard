// app/api/pictures/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { fileIdSchema, updatePictureSchema } from '@/lib/validations/files';
import { handleError, NotFoundError, FileSystemError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { reorderPictures } from '@/lib/file-helpers';

const prisma = getPrismaClient();

// GET - Get single picture
export const GET = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, fileIdSchema);
      const picture = await logger.trackPerformance(
        'Find picture by ID',
        async () => {
          return await prisma.picture.findUnique({
            where: { id },
          });
        },
        { userId: user.userId, pictureId: id }
      );

      if (!picture) {
        throw new NotFoundError('Picture', id);
      }

      logger.info('Picture fetched successfully', {
        userId: user.userId,
        pictureId: id,
      });

      return NextResponse.json(picture);
    } catch (error) {
      return handleError(error);
    }
  }
);

// PATCH - Rename picture or change order
export const PATCH = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, fileIdSchema);
      const data = await validateBody(request, updatePictureSchema);

      const updateData: { originalName?: string; order?: number } = {};
      if (data.originalName) updateData.originalName = data.originalName;
      if (data.order !== undefined) updateData.order = data.order;

      const picture = await logger.trackPerformance(
        'Update picture',
        async () => {
          return await prisma.picture.update({
            where: { id },
            data: updateData,
          });
        },
        { userId: user.userId, pictureId: id, updateFields: Object.keys(updateData) }
      );

      logger.info('Picture updated successfully', {
        userId: user.userId,
        pictureId: id,
        updatedFields: Object.keys(updateData),
      });

      return NextResponse.json(picture);
    } catch (error) {
      return handleError(error);
    }
  }
);

// DELETE - Delete picture
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, fileIdSchema);
      const picture = await prisma.picture.findUnique({
        where: { id },
      });

      if (!picture) {
        throw new NotFoundError('Picture', id);
      }

      // Delete file from filesystem
      try {
        const filepath = path.join(process.cwd(), 'public', picture.url);
        await logger.trackPerformance(
          'Delete picture file from filesystem',
          async () => {
            await unlink(filepath);
          },
          { pictureId: id, filepath }
        );
      } catch (fileError) {
        logger.warn('Could not delete picture file from filesystem (continuing with database delete)', fileError, {
          pictureId: id,
          filepath: picture.url,
        });
      }

      // Delete from database
      await logger.trackPerformance(
        'Delete picture from database',
        async () => {
          await prisma.picture.delete({
            where: { id },
          });
        },
        { userId: user.userId, pictureId: id }
      );

      // Reorder remaining pictures using shared helper
      await reorderPictures(picture.entityType, picture.entityId);

      logger.info('Picture deleted successfully', {
        userId: user.userId,
        pictureId: id,
        entityType: picture.entityType,
        entityId: picture.entityId,
      });

      return NextResponse.json({ message: 'Picture deleted successfully' });
    } catch (error) {
      return handleError(error);
    }
  }
);
