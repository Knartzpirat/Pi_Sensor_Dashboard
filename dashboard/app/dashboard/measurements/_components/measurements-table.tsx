'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { useFeatureFlags } from '@/components/data-table/feature-flags-provider';
import { useDataTable } from '@/hooks/use-data-table';
import { useTablePersistence, useColumnVisibilityPersistence } from '@/hooks/use-table-persistence';
import { useTranslations, useLocale } from 'next-intl';
import { getColumns, type MeasurementTableData } from './measurements-table-columns';

const TABLE_VIEW_KEY = 'measurements-table-view';

interface MeasurementsTableProps {
  data: {
    data: MeasurementTableData[];
    pageCount: number;
  };
}

export function MeasurementsTable({ data: { data, pageCount } }: MeasurementsTableProps) {
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const t = useTranslations();
  const locale = useLocale();

  const columns = React.useMemo(() => getColumns({ t, locale }), [t, locale]);

  const { savedState: savedColumnVisibility } = useTablePersistence(
    TABLE_VIEW_KEY,
    {}
  );

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: 'startTime', desc: true }],
      columnPinning: { right: ['actions'] },
      columnVisibility: savedColumnVisibility,
    },
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  // Automatically save column visibility to cookies
  useColumnVisibilityPersistence(
    TABLE_VIEW_KEY,
    table.getState().columnVisibility
  );

  return (
    <div className="space-y-4">
      <DataTable table={table}>
        {enableAdvancedFilter ? (
          <DataTableAdvancedToolbar table={table}>
            {filterFlag === 'advancedFilters' ? (
              <DataTableFilterList
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
                align="start"
              />
            ) : (
              <DataTableFilterMenu
                table={table}
                shallow={shallow}
                debounceMs={debounceMs}
                throttleMs={throttleMs}
              />
            )}
            <div className="flex items-center gap-2">
              <DataTableSortList table={table} align="end" />
            </div>
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
          </DataTableToolbar>
        )}
      </DataTable>
    </div>
  );
}
