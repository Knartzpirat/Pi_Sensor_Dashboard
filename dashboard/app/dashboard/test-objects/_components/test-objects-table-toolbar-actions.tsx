'use client';

import { Download } from 'lucide-react';
import type { Table } from '@tanstack/react-table';

import { exportTableToCSV } from '@/lib/export';
import { Button } from '@/components/ui/button';
import type { TestObjectsTableData } from '@/types/test-object';
import { CreateTestObjectSheet } from './create-test-object-sheet';
import { DeleteTestObjectsDialog } from './delete-test-objects-dialog';

interface TestObjectsTableToolbarActionsProps {
  table: Table<TestObjectsTableData>;
}

export function TestObjectsTableToolbarActions({
  table,
}: TestObjectsTableToolbarActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {table.getFilteredSelectedRowModel().rows.length > 0 ? (
        <DeleteTestObjectsDialog
          testObjects={table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)}
          onSuccess={() => table.toggleAllRowsSelected(false)}
        />
      ) : null}
      <CreateTestObjectSheet />
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          exportTableToCSV(table, {
            filename: 'test-objects',
            excludeColumns: ['select', 'actions'],
          })
        }
      >
        <Download className="mr-2 size-4" aria-hidden="true" />
        Export
      </Button>
    </div>
  );
}
