// app/dashboard/test-objects/components/data-table-view-options.tsx
'use client';

import { useTranslations } from 'next-intl';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import {
  saveTableViewToCookie,
  loadTableViewFromCookie,
} from '@/lib/tableView-cookies';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useEffect } from 'react';

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
  tableKey: string;
}

export function DataTableViewOptions<TData>({
  table,
  tableKey,
}: DataTableViewOptionsProps<TData>) {
  const t = useTranslations();
  useEffect(() => {
    const saved = loadTableViewFromCookie<{ [key: string]: boolean }>(tableKey);
    if (saved) {
      table.getAllColumns().forEach((column) => {
        if (saved[column.id] !== undefined) {
          column.toggleVisibility(saved[column.id]);
        }
      });
    }
  }, [table, tableKey]);

  // Bei Änderungen: Spaltenstatus speichern
  const columnVisibility = table.getState().columnVisibility;
  useEffect(() => {
    const visibilityMap = table.getAllColumns().reduce((acc, col) => {
      acc[col.id] = col.getIsVisible();
      return acc;
    }, {} as Record<string, boolean>);

    saveTableViewToCookie(tableKey, visibilityMap);
  }, [columnVisibility, tableKey, table]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <MixerHorizontalIcon className="mr-2 h-4 w-4" />
          {t('table.view')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>{t('table.hide')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {t(`table.${column.id}`, { default: column.id })}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
