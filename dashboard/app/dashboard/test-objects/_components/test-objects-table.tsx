'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar';
import { DataTableFilterMenu } from '@/components/data-table/data-table-filter-menu';
import { useFeatureFlags } from '@/components/data-table/feature-flags-provider';
import { useDataTable } from '@/hooks/use-data-table';
import type { TestObjectsTableData } from '@/types/test-object';
import { getColumns } from './test-objects-table-columns';
import { TestObjectsTableToolbarActions } from './test-objects-table-toolbar-actions';
import {
  loadTableViewFromCookie,
  saveTableViewToCookie
} from '@/lib/tableView-cookies';

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
}

export function TestObjectsTable({ promises }: TestObjectsTableProps) {
  const [{ data, total }, labelCounts] = React.use(promises);
  const { enableAdvancedFilter } = useFeatureFlags();

  const columns = React.useMemo(() => getColumns({ labelCounts }), [labelCounts]);

  const pageCount = Math.ceil(total / 10);

  // Load column visibility from cookies
  const savedColumnVisibility = React.useMemo(() => {
    if (typeof window === 'undefined') return {};
    return loadTableViewFromCookie<Record<string, boolean>>(TABLE_VIEW_KEY) ?? {};
  }, []);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    enableAdvancedFilter,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: savedColumnVisibility,
    },
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
            <DataTableFilterMenu table={table} />
            <TestObjectsTableToolbarActions table={table} />
          </DataTableAdvancedToolbar>
        ) : (
        <DataTableToolbar table={table}>
          <TestObjectsTableToolbarActions table={table} />
        </DataTableToolbar>
        )}
      </DataTable>
    </div>
  );
}
