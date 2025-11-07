import { unstable_noStore as noStore } from 'next/cache';
import { SensorsPageClient } from './_components/sensors-page-client';

async function getSensors() {
  noStore();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/sensors`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch sensors');
    }

    const data = await response.json();
    return data.sensors || [];
  } catch (error) {
    console.error('Error fetching sensors:', error);
    return [];
  }
}

async function getHardwareConfig() {
  noStore();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/hardware/config`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { boardType: 'GPIO' };
    }

    const data = await response.json();
    return data.config;
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
