// app/dashboard/test-objects/page.tsx
import { PrismaClient } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { DataTable } from './data-table';

const prisma = new PrismaClient();

async function getTestObjects() {
  try {
    const testObjects = await prisma.testObject.findMany({
      include: {
        label: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const testObjectsWithPictures = await Promise.all(
      testObjects.map(async (testObject) => {
        const pictures = await prisma.picture.findMany({
          where: {
            entityType: 'TEST_OBJECT',
            entityId: testObject.id,
          },
          orderBy: { order: 'asc' },
          take: 1,
        });

        return {
          ...testObject,
          pictures,
        };
      })
    );

    return testObjectsWithPictures;
  } catch (error) {
    console.error('Error fetching test objects:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

async function getLabels() {
  try {
    const labels = await prisma.label.findMany({
      where: { type: 'TEST_OBJECT' },
      orderBy: { name: 'asc' },
    });
    return labels;
  } catch (error) {
    console.error('Error fetching labels:', error);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

export default async function TestObjectsPage() {
  const t = await getTranslations();
  const [testObjects, labels] = await Promise.all([
    getTestObjects(),
    getLabels(),
  ]);
  

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-3 pb-6">
          <h2 className="text-3xl font-bold">{t('test-objects.title')}</h2>
          <p className="text-muted-foreground">
            {t('test-objects.description')}
          </p>
        </div>
      </div>
      <DataTable
        data={testObjects}
        labels={labels}
      />
    </div>
  );
}
