import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { FeatureFlagsProvider } from '@/components/data-table/feature-flags-provider';
import { searchParamsCache } from '@/lib/validations/params';
import { getMeasurements } from './_lib/queries';
import { MeasurementsTable } from './_components/measurements-table';
import type { SearchParams } from '@/types';

interface MeasurementsProps {
  searchParams: Promise<SearchParams>;
}

export default function MeasurementsPage(props: MeasurementsProps) {
  return (
    <Suspense
      fallback={
        <DataTableSkeleton
          columnCount={6}
          filterCount={2}
          cellWidths={[
            '12rem',
            '20rem',
            '10rem',
            '8rem',
            '12rem',
            '8rem',
          ]}
          shrinkZero
        />
      }
    >
      <FeatureFlagsProvider tableId="measurements">
        <MeasurementsTableWrapper {...props} />
      </FeatureFlagsProvider>
    </Suspense>
  );
}

async function MeasurementsTableWrapper(props: MeasurementsProps) {
  const searchParams = await props.searchParams;
  const search = searchParamsCache.parse(searchParams);

  // Parse filters
  let parsedFilters: { id: string; value: unknown }[] = [];
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

  // Column filters
  const columnFilters: { id: string; value: unknown }[] = [];

  if (search.title) {
    columnFilters.push({
      id: 'title',
      value: search.title,
    });
  }

  if (search.status) {
    columnFilters.push({
      id: 'status',
      value: search.status,
    });
  }

  const allFilters = [...parsedFilters, ...columnFilters];

  const validFilters = allFilters.filter((filter) => {
    if (!filter.value) return false;
    if (Array.isArray(filter.value)) return filter.value.length > 0;
    return filter.value !== '' && filter.value !== null && filter.value !== undefined;
  });

  const data = await getMeasurements({
    page: search.page,
    perPage: search.perPage,
    sort: search.sort || undefined,
    filters: validFilters,
  });

  return <MeasurementsTable data={data} />;
}
