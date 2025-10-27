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
  const { filterFlag } = useFeatureFlags();

  const columns = React.useMemo(() => getColumns({ labelCounts }), [labelCounts]);

  const pageCount = Math.ceil(total / 10);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <DataTable table={table}>
        {filterFlag === 'commandFilters' ? (
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
