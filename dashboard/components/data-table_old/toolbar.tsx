// dashboard/components/data-table/toolbar.tsx 
'use client';

import { Cross2Icon } from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableViewOptions } from './view-options';
import { DataTableFacetedFilter } from './faceted-filter';
import { Label } from '@prisma/client';
import { PlusCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  tableKey?: string;
  labels: Label[];
}

export function DataTableToolbar<TData>({
  table,
  tableKey,
  labels,
}: DataTableToolbarProps<TData>) {
  const t = useTranslations();
  const isFiltered = table.getState().columnFilters.length > 0;

  // Formatiere Labels für den Filter
  const labelOptions = labels.map((label) => ({
    label: label.name,
    value: label.id,
    icon: undefined,
    color: label.color || undefined,
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder={t('table.searchPlaceholder')}
          value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('title')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('label') && (
          <DataTableFacetedFilter
            column={table.getColumn('label')}
            title={t('table.label')}
            options={labelOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            {t('common.reset')}
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} tableKey={tableKey || 'default'} />
        <Button size="sm" className="h-8">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('table.addTestObject')}
        </Button>
      </div>
    </div>
  );
}
