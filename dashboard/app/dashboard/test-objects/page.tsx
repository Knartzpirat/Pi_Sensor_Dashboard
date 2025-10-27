import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { FeatureFlagsProvider } from '@/components/data-table/feature-flags-provider';
import { searchParamsCache } from '@/lib/validations/params';
import { getValidFilters } from '@/lib/parsers';
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
          cellWidths={['10rem', '30rem', '10rem', '10rem', '6rem', '6rem', '6rem']}
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

  const validFilters = getValidFilters(search.filters);

  const promises = Promise.all([
    getTestObjects({
      ...search,
      filters: validFilters,
    }),
    getLabelCounts(),
  ]);

  return <TestObjectsTable promises={promises} />;
}