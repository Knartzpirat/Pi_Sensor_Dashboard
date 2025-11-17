// app/api/test-objects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { withAuthAndValidation } from '@/lib/validation-helpers';
import { createTestObjectSchema } from '@/lib/validations/test-objects';
import { handleError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const prisma = getPrismaClient();

// GET - All test objects (with optional pictures)
export const GET = withAuth(async (request, user) => {
  try {
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get('labelId');
    const includePictures = searchParams.get('includePictures') === 'true';
    const pictureLimit = searchParams.get('pictureLimit');

    const testObjects = await logger.trackPerformance(
      'Fetch test objects',
      async () => {
        return await prisma.testObject.findMany({
          where: labelId
            ? {
                labels: {
                  some: {
                    id: labelId,
                  },
                },
              }
            : undefined,
          include: {
            labels: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      { userId: user.userId, labelId, includePictures }
    );

    // Optimized: Load all pictures in a single query instead of N+1 queries
    if (includePictures) {
      // Extract all test object IDs
      const testObjectIds = testObjects.map((obj) => obj.id);

      // Single query to fetch all pictures for all test objects
      const allPictures = await logger.trackPerformance(
        'Fetch pictures for test objects',
        async () => {
          return await prisma.picture.findMany({
            where: {
              entityType: 'TEST_OBJECT',
              entityId: { in: testObjectIds },
            },
            orderBy: { order: 'asc' },
          });
        },
        { testObjectCount: testObjectIds.length }
      );

      // Group pictures by entityId for efficient lookup
      const picturesByEntityId = new Map<string, typeof allPictures>();
      for (const picture of allPictures) {
        const existing = picturesByEntityId.get(picture.entityId) || [];
        existing.push(picture);
        picturesByEntityId.set(picture.entityId, existing);
      }

      // Attach pictures to test objects (with optional limit)
      const testObjectsWithPictures = testObjects.map((testObject) => {
        const pictures = picturesByEntityId.get(testObject.id) || [];
        const limitedPictures = pictureLimit
          ? pictures.slice(0, parseInt(pictureLimit))
          : pictures;

        return {
          ...testObject,
          pictures: limitedPictures,
        };
      });

      logger.info('Test objects with pictures fetched successfully', {
        userId: user.userId,
        count: testObjectsWithPictures.length,
        totalPictures: allPictures.length,
      });

      return NextResponse.json(testObjectsWithPictures);
    }

    logger.info('Test objects fetched successfully', {
      userId: user.userId,
      count: testObjects.length,
    });

    return NextResponse.json(testObjects);
  } catch (error) {
    return handleError(error);
  }
});

// POST - Create new test object
export const POST = withAuthAndValidation(
  createTestObjectSchema,
  async (request, user, data) => {
    try {
      const testObject = await logger.trackPerformance(
        'Create test object',
        async () => {
          return await prisma.testObject.create({
            data: {
              title: data.title,
              description: data.description,
              labels: data.labelIds && data.labelIds.length > 0
                ? {
                    connect: data.labelIds.map((id) => ({ id })),
                  }
                : undefined,
            },
            include: {
              labels: true,
            },
          });
        },
        { userId: user.userId, labelCount: data.labelIds?.length || 0 }
      );

      logger.info('Test object created successfully', {
        userId: user.userId,
        testObjectId: testObject.id,
        title: testObject.title,
      });

      return NextResponse.json(testObject, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }
);
