import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import type {
  GetTestObjectsParams,
  TestObjectsTableData,
} from '@/types/test-object';

export async function getTestObjects(
  params: GetTestObjectsParams
): Promise<{ data: TestObjectsTableData[]; total: number }> {
  noStore();

  const { page = 1, perPage = 10 } = params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/test-objects`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch test objects');
    }

    const allData = await response.json();

    // Transform data to table format
    const transformedData: TestObjectsTableData[] = allData.map(
      (item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        labelId: item.labelId,
        label: item.label?.name || null,
        labelColor: item.label?.color || null,
      })
    );

    // Apply pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedData = transformedData.slice(start, end);

    return {
      data: paginatedData,
      total: transformedData.length,
    };
  } catch (error) {
    console.error('Error fetching test objects:', error);
    return {
      data: [],
      total: 0,
    };
  }
}
