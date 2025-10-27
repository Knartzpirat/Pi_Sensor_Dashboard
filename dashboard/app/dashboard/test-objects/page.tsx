import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { FeatureFlagsProvider } from '@/components/data-table/feature-flags-provider';
import { searchParamsCache } from '@/lib/validations/params';
import { getValidFilters } from '@/lib/data-table';
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
  let parsedFilters: unknown[] = [];
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
  const columnFilters: unknown[] = [];

  // Check for title filter
  if (searchParams.title) {
    columnFilters.push({
      id: 'title',
      value: searchParams.title,
    });
  }

  // Check for label filter (can be multiple values)
  if (searchParams.label) {
    const labelValues = Array.isArray(searchParams.label)
      ? searchParams.label
      : [searchParams.label];
    columnFilters.push({
      id: 'label',
      value: labelValues,
    });
  }

  // Combine both filter types
  const allFilters = [...parsedFilters, ...columnFilters];
  const validFilters = getValidFilters(Array.isArray(allFilters) ? allFilters : []);

  const promises = Promise.all([
    getTestObjects({
      ...search,
      filters: validFilters,
    }),
    getLabelCounts(),
  ]);

  return <TestObjectsTable promises={promises} />;
}
