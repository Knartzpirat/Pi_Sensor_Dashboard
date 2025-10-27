'use client';

import * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import type { TestObjectsTableData } from '@/types/test-object';
import { getColumns } from '../_lib/columns';

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
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
