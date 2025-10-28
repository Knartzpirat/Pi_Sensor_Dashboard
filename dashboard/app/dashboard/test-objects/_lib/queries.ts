import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import type {
  GetTestObjectsParams,
  TestObjectsTableData,
  TestObjectWithLabel,
} from '@/types/test-object';

// Type for filter objects
interface FilterItem {
  id: string;
  value: string | string[];
}

export async function getTestObjects(
  params: GetTestObjectsParams
): Promise<{ data: TestObjectsTableData[]; total: number }> {
  noStore();

  const { page = 1, perPage = 10, sort, filters } = params;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    let allData: TestObjectWithLabel[];

    try {
      const response = await fetch(`${baseUrl}/api/test-objects`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('API returned error');
      }

      allData = await response.json();
    } catch (apiError) {
      // FALLBACK: Use mock data if API fails
      console.log('API failed, using mock data for development');
      allData = [
        {
          id: '1',
          title: 'Test Object One',
          description: 'This is the first test object',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          labelId: 'label1',
          label: { id: 'label1', name: 'Important', color: '#ff0000' },
        },
        {
          id: '2',
          title: 'Another Test Item',
          description: 'Second test object for filtering',
          createdAt: new Date('2024-02-20'),
          updatedAt: new Date('2024-02-20'),
          labelId: 'label2',
          label: { id: 'label2', name: 'Normal', color: '#00ff00' },
        },
        {
          id: '3',
          title: 'Final Test Object',
          description: 'Third item to test with',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date('2024-03-10'),
          labelId: 'label1',
          label: { id: 'label1', name: 'Important', color: '#ff0000' },
        },
      ];
    }

    // Transform data to table format
    let transformedData: TestObjectsTableData[] = allData.map(
      (item) => ({
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

    // Apply filtering if filters are provided
    if (filters && Array.isArray(filters) && filters.length > 0) {
      transformedData = transformedData.filter((item) => {
        return filters.every((filter: FilterItem) => {
          const value = item[filter.id as keyof TestObjectsTableData];
          const filterValue = filter.value;

          if (value === null || value === undefined) return false;

          // Handle different filter types
          if (Array.isArray(filterValue)) {
            // Multi-select filter
            return filterValue.includes(String(value));
          } else if (typeof value === 'string' && typeof filterValue === 'string') {
            // Text filter
            return value.toLowerCase().includes(filterValue.toLowerCase());
          }

          return String(value) === String(filterValue);
        });
      });
    }

    // Apply sorting if sort parameter is provided
    if (sort) {
      try {
        const sortParams = JSON.parse(sort);
        if (Array.isArray(sortParams) && sortParams.length > 0) {
          transformedData.sort((a, b) => {
            for (const { id, desc } of sortParams) {
              const aValue = a[id as keyof TestObjectsTableData];
              const bValue = b[id as keyof TestObjectsTableData];

              if (aValue === null || aValue === undefined) return 1;
              if (bValue === null || bValue === undefined) return -1;

              let comparison = 0;
              if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
              } else {
                comparison = String(aValue).localeCompare(String(bValue));
              }

              if (comparison !== 0) {
                return desc ? -comparison : comparison;
              }
            }
            return 0;
          });
        }
      } catch (e) {
        console.error('Error parsing sort parameter:', e);
      }
    }

    const total = transformedData.length;

    // Apply pagination
    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginatedData = transformedData.slice(start, end);

    return {
      data: paginatedData,
      total,
    };
  } catch (error) {
    console.error('Error fetching test objects:', error);
    return {
      data: [],
      total: 0,
    };
  }
}

export async function getLabelCounts(): Promise<Record<string, number>> {
  noStore();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    let allData: TestObjectWithLabel[];

    try {
      const response = await fetch(`${baseUrl}/api/test-objects`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('API returned error');
      }

      allData = await response.json();
    } catch (apiError) {
      // FALLBACK: Use mock data if API fails
      console.log('API failed for label counts, using mock data');
      return {
        'Important': 2,
        'Normal': 1,
      };
    }

    // Count occurrences of each label
    const counts: Record<string, number> = {};

    for (const item of allData) {
      const labelName = item.label?.name || 'No Label';
      counts[labelName] = (counts[labelName] || 0) + 1;
    }

    return counts;
  } catch (error) {
    console.error('Error fetching label counts:', error);
    return {};
  }
}
