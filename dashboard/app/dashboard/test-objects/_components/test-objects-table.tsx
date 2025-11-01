'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list';
import { DataTableSortList } from '@/components/data-table/data-table-sort-list';
import { useFeatureFlags } from '@/components/data-table/feature-flags-provider';
import { useDataTable } from '@/hooks/use-data-table';
import type { TestObjectsTableData, QueryKeys } from '@/types/test-object';
import { getColumns } from './test-objects-table-columns';
import { TestObjectsTableToolbarActions } from './test-objects-table-toolbar-actions';
import {
  loadTableViewFromCookie,
  saveTableViewToCookie,
} from '@/lib/tableView-cookies';
import { useTranslations } from 'next-intl';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu';

const TABLE_VIEW_KEY = 'test-objects-table-view';

interface TestObjectsTableProps {
  promises: Promise<
    [
      {
        data: TestObjectsTableData[];
        total: number;
      },
      Record<string, number>
    ]
  >;
  queryKeys?: Partial<QueryKeys>;
}

export function TestObjectsTable({
  promises,
  queryKeys,
}: TestObjectsTableProps) {
  const [{ data, total }, labelCounts] = React.use(promises);
  const { enableAdvancedFilter, filterFlag } = useFeatureFlags();
  const t = useTranslations();

  const columns = React.useMemo(
    () => getColumns({ t, labelCounts }),
    [t, labelCounts]
  );

  const pageCount = Math.ceil(total / 10);

  // TODO: Extract to custom hooks
  // - [ ] `hooks/use-table-persistence.tsx` - Custom Hook für Table State Persistence (Cookies)
  // - [ ] `hooks/use-table-configuration.tsx` - Table Configuration Hook für Standard-Settings
  
  // Load column visibility from cookies
  const savedColumnVisibility = React.useMemo(() => {
    if (typeof window === 'undefined') return {};
    return (
      loadTableViewFromCookie<Record<string, boolean>>(TABLE_VIEW_KEY) ?? {}
    );
  }, []);

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
      columnVisibility: savedColumnVisibility,
    },
    queryKeys,
    getRowId: (originalRow) => originalRow.id,
    shallow: false,
    clearOnDefault: true,
  });

  // Save column visibility to cookies when it changes
  const columnVisibility = table.getState().columnVisibility;
  const columnVisibilityJson = JSON.stringify(columnVisibility);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    saveTableViewToCookie(TABLE_VIEW_KEY, columnVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibilityJson]);

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
              <TestObjectsTableToolbarActions table={table} />
            </div>
          </DataTableAdvancedToolbar>
        ) : (
          <DataTableToolbar table={table}>
            <DataTableSortList table={table} align="end" />
            <TestObjectsTableToolbarActions table={table} />
          </DataTableToolbar>
        )}
      </DataTable>
    </div>
  );
}
