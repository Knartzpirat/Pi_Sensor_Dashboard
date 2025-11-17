import { unstable_noStore as noStore } from 'next/cache';
import { SensorsPageClient } from './_components/sensors-page-client';
import { getPrismaClient } from '@/lib/prisma';

const prisma = getPrismaClient();

async function getSensors() {
  noStore();

  try {
    // Get current board type first
    const hardwareConfig = await prisma.hardwareConfig.findFirst();
    const boardType = hardwareConfig?.boardType || 'GPIO';

    // Fetch sensors directly from database (server-side)
    const sensors = await prisma.sensor.findMany({
      where: {
        boardType,
      },
      include: {
        entities: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sensors;
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return [];
  }
}

async function getHardwareConfig() {
  noStore();

  try {
    // Fetch directly from database (server-side)
    const config = await prisma.hardwareConfig.findFirst();
    return config || { boardType: 'GPIO' };
  } catch (error) {
    console.error('Error fetching hardware config:', error);
    return { boardType: 'GPIO' };
  }
}

export default async function SensorsPage() {
  const [sensors, hardwareConfig] = await Promise.all([
    getSensors(),
    getHardwareConfig(),
  ]);

  return (
    <SensorsPageClient
      initialSensors={sensors}
      boardType={hardwareConfig.boardType}
    />
  );
}
