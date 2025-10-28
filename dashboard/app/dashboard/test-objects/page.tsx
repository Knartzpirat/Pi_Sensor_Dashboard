import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { FeatureFlagsProvider } from '@/components/data-table/feature-flags-provider';
import { searchParamsCache } from '@/lib/validations/params';
import { getTestObjects, getLabelCounts } from './_lib/queries';
import { TestObjectsTable } from './_components/test-objects-table';
import type { SearchParams } from '@/types';

interface TestObjectsProps {
  searchParams: Promise<SearchParams>;
}

export default function IndexPage(props: TestObjectsProps) {
  return (
    <Suspense
      fallback={
        <DataTableSkeleton
          columnCount={7}
          filterCount={2}
          cellWidths={[
            '10rem',
            '30rem',
            '10rem',
            '10rem',
            '6rem',
            '6rem',
            '6rem',
          ]}
          shrinkZero
        />
      }
    >
      <FeatureFlagsProvider tableId="testObjects">
        <TestObjectsTableWrapper {...props} />
      </FeatureFlagsProvider>
    </Suspense>
  );
}

async function TestObjectsTableWrapper(props: TestObjectsProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  // Parse filters string to array if it's a string (Advanced Filter mode)
  let parsedFilters: any[] = [];
  if (search.filters) {
    try {
      parsedFilters = typeof search.filters === 'string'
        ? JSON.parse(search.filters)
        : search.filters;
    } catch (e) {
      console.error('Error parsing filters:', e);
      parsedFilters = [];
    }
  }

  // Also check for individual column filters (Normal Filter mode)
  // These come from DataTableToolbar as separate URL params
  const columnFilters: any[] = [];

  // Check for title filter
  if (search.title) {
    columnFilters.push({
      id: 'title',
      value: search.title,
    });
  }

  // Check for label filter (can be multiple values)
  if (search.label) {
    columnFilters.push({
      id: 'label',
      value: search.label, // Already parsed as array by searchParamsCache
    });
  }

  // Combine both filter types and validate
  const allFilters = [...parsedFilters, ...columnFilters];

  // Simple validation: remove filters with empty values
  const validFilters = allFilters.filter((filter) => {
    if (!filter.value) return false;
    if (Array.isArray(filter.value)) return filter.value.length > 0;
    return filter.value !== '' && filter.value !== null && filter.value !== undefined;
  });

  const promises = Promise.all([
    getTestObjects({
      ...search,
      filters: validFilters,
    }),
    getLabelCounts(),
  ]);

  return <TestObjectsTable promises={promises} />;
}
