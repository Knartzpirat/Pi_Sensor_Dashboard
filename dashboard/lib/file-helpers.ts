import { EntityType } from '@prisma/client';
import { getPrismaClient } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Reorder pictures after deletion or reordering
 * Ensures sequential ordering starting from 0
 *
 * @param entityType - Entity type (TEST_OBJECT, SENSOR, etc.)
 * @param entityId - Entity ID
 */
export async function reorderPictures(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const prisma = getPrismaClient();

  await logger.trackPerformance(
    'Reorder pictures',
    async () => {
      const pictures = await prisma.picture.findMany({
        where: { entityType, entityId },
        orderBy: { order: 'asc' },
      });

      // Update orders sequentially
      for (let i = 0; i < pictures.length; i++) {
        if (pictures[i].order !== i) {
          await prisma.picture.update({
            where: { id: pictures[i].id },
            data: { order: i },
          });
        }
      }
    },
    { entityType, entityId, operation: 'reorderPictures' }
  );

  logger.debug('Pictures reordered', {
    entityType,
    entityId,
  });
}

/**
 * Reorder documents after deletion or reordering
 * Ensures sequential ordering starting from 0
 *
 * @param entityType - Entity type (TEST_OBJECT, SENSOR, etc.)
 * @param entityId - Entity ID
 */
export async function reorderDocuments(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  const prisma = getPrismaClient();

  await logger.trackPerformance(
    'Reorder documents',
    async () => {
      const documents = await prisma.document.findMany({
        where: { entityType, entityId },
        orderBy: { order: 'asc' },
      });

      // Update orders sequentially
      for (let i = 0; i < documents.length; i++) {
        if (documents[i].order !== i) {
          await prisma.document.update({
            where: { id: documents[i].id },
            data: { order: i },
          });
        }
      }
    },
    { entityType, entityId, operation: 'reorderDocuments' }
  );

  logger.debug('Documents reordered', {
    entityType,
    entityId,
  });
}
