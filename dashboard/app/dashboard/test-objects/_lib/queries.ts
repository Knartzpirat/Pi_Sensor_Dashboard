import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import type {
  GetTestObjectsParams,
  TestObjectsTableData,
  TestObjectWithLabel,
} from '@/types/test-object';
import { env } from '@/lib/env';

export async function getTestObjects(
  params: GetTestObjectsParams
): Promise<{ data: TestObjectsTableData[]; total: number }> {
  noStore();

  const { page = 1, perPage = 10, sort, filters } = params;

  try {
    // Get cookies to pass to internal API request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${env.appUrl}/api/test-objects?includePictures=true`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch test objects');
    }

    const allData: TestObjectWithLabel[] = await response.json();

    // Transform data to table format
    let transformedData: TestObjectsTableData[] = allData.map(
      (item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      labels: item.labels || [],
      thumbnailUrl: item.pictures?.[0]?.url || null,
      images: item.pictures || [],
      })
    );

    // Apply filtering if filters are provided
    if (filters && Array.isArray(filters) && filters.length > 0) {
      transformedData = transformedData.filter((item) => {
        return filters.every((filter: { id: string; value: unknown; operator?: string; variant?: string }) => {
          const value = item[filter.id as keyof TestObjectsTableData];
          const filterValue = filter.value;
          const operator = filter.operator || 'iLike';
          const variant = filter.variant || 'text';

          // Handle isEmpty and isNotEmpty operators
          if (operator === 'isEmpty') {
            return value === null || value === undefined || value === '';
          }
          if (operator === 'isNotEmpty') {
            return value !== null && value !== undefined && value !== '';
          }

          // If value is null/undefined and not checking for empty, filter out
          if (value === null || value === undefined) return false;

          // Handle date filters
          if (variant === 'date' || variant === 'dateRange') {
            if (!(value instanceof Date)) return false;

            const itemDate = value.getTime();

            // Handle array of dates for isBetween
            if (operator === 'isBetween' && Array.isArray(filterValue) && filterValue.length === 2) {
              const fromDate = Number(filterValue[0]);
              const toDate = Number(filterValue[1]);
              return itemDate >= fromDate && itemDate <= toDate;
            }

            // Handle single date comparisons
            const filterDate = Array.isArray(filterValue) ? Number(filterValue[0]) : Number(filterValue);

            if (isNaN(filterDate)) return false;

            switch (operator) {
              case 'eq':
              case 'is':
                // Compare dates at day level (ignore time)
                const itemDay = new Date(itemDate).setHours(0, 0, 0, 0);
                const filterDay = new Date(filterDate).setHours(0, 0, 0, 0);
                return itemDay === filterDay;
              case 'ne':
              case 'isNot':
                const itemDay2 = new Date(itemDate).setHours(0, 0, 0, 0);
                const filterDay2 = new Date(filterDate).setHours(0, 0, 0, 0);
                return itemDay2 !== filterDay2;
              case 'lt':
              case 'isBefore':
                return itemDate < filterDate;
              case 'lte':
              case 'isOnOrBefore':
                return itemDate <= filterDate;
              case 'gt':
              case 'isAfter':
                return itemDate > filterDate;
              case 'gte':
              case 'isOnOrAfter':
                return itemDate >= filterDate;
              default:
                return true;
            }
          }

          // Handle number/range filters
          if (variant === 'number' || variant === 'range') {
            const numValue = typeof value === 'number' ? value : Number(value);

            if (isNaN(numValue)) return false;

            // Handle isBetween for ranges
            if (operator === 'isBetween' && Array.isArray(filterValue) && filterValue.length === 2) {
              const min = Number(filterValue[0]);
              const max = Number(filterValue[1]);
              return numValue >= min && numValue <= max;
            }

            const filterNum = Number(filterValue);

            if (isNaN(filterNum)) return false;

            switch (operator) {
              case 'eq':
              case 'is':
                return numValue === filterNum;
              case 'ne':
              case 'isNot':
                return numValue !== filterNum;
              case 'lt':
              case 'isLessThan':
                return numValue < filterNum;
              case 'lte':
              case 'isLessThanOrEqualTo':
                return numValue <= filterNum;
              case 'gt':
              case 'isGreaterThan':
                return numValue > filterNum;
              case 'gte':
              case 'isGreaterThanOrEqualTo':
                return numValue >= filterNum;
              default:
                return true;
            }
          }

          // Handle multi-select filters
          if (variant === 'multiSelect' && Array.isArray(filterValue)) {
            const strValue = String(value);

            switch (operator) {
              case 'inArray':
              case 'hasAnyOf':
                return filterValue.includes(strValue);
              case 'notInArray':
              case 'hasNoneOf':
                return !filterValue.includes(strValue);
              default:
                return filterValue.includes(strValue);
            }
          }

          // Handle text filters
          if (typeof value === 'string' && typeof filterValue === 'string') {
            const lowerValue = value.toLowerCase();
            const lowerFilter = filterValue.toLowerCase();

            switch (operator) {
              case 'iLike':
              case 'contains':
                return lowerValue.includes(lowerFilter);
              case 'notILike':
              case 'doesNotContain':
                return !lowerValue.includes(lowerFilter);
              case 'eq':
              case 'is':
                return lowerValue === lowerFilter;
              case 'ne':
              case 'isNot':
                return lowerValue !== lowerFilter;
              default:
                return lowerValue.includes(lowerFilter);
            }
          }

          // Handle select filters
          if (variant === 'select') {
            const strValue = String(value);
            const strFilter = String(filterValue);

            switch (operator) {
              case 'eq':
              case 'is':
                return strValue === strFilter;
              case 'ne':
              case 'isNot':
                return strValue !== strFilter;
              default:
                return strValue === strFilter;
            }
          }

          // Fallback: simple string comparison
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
    // Get cookies to pass to internal API request
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${env.appUrl}/api/test-objects`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch test objects');
    }

    const allData: TestObjectWithLabel[] = await response.json();

    // Count occurrences of each label
    const counts: Record<string, number> = {};

    for (const item of allData) {
      if (item.labels && item.labels.length > 0) {
        // Count each label
        for (const label of item.labels) {
          const labelName = label.name;
          counts[labelName] = (counts[labelName] || 0) + 1;
        }
      } else {
        // Count items with no labels
        counts['No Label'] = (counts['No Label'] || 0) + 1;
      }
    }

    return counts;
  } catch (error) {
    console.error('Error fetching label counts:', error);
    return {};
  }
}
