'use client';

import { useTranslations } from 'next-intl';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TestObject, Label, Picture } from '@prisma/client';
import Image from 'next/image';
import { DataTableColumnHeader } from '@/components/data-table_old/column-header';
import { DataTableRowActions } from '@/components/data-table_old/row-actions';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export type TestObjectWithRelations = TestObject & {
  label?: Label | null;
  pictures?: Picture[];
};

export function useTestObjectColumns(): ColumnDef<TestObjectWithRelations>[] {
  const t = useTranslations('table');

  return [
    {
      id: 'select',
      size: 40,
      maxSize: 40,
      enableResizing: false,
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => (
        <Checkbox
          className="flex justify-start"
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: 'thumbnail',
      header: '', //t('thumbnail'),
      size: 80,
      maxSize: 80,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const thumbnail = row.original.pictures?.[0];
        return (
          <div className="flex justify-center h-12 w-12 mx-auto overflow-hidden rounded-md border border-muted">
            {thumbnail ? (
              <Image
                src={thumbnail.url}
                alt={row.original.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                {t('noImage')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('title')} />
      ),
      cell: ({ row }) => (
        <span className="min-w-[100px ] max-w-[550px] truncate font-medium">
          {row.getValue('title')}
        </span>
      ),
    },
    {
      accessorKey: 'label',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('label')} />
      ),
      cell: ({ row }) => {
        const label = row.original.label;
        if (!label) return <span className="text-muted-foreground">—</span>;

        return (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              style={{
                backgroundColor: label.color ? `${label.color}20` : undefined,
                borderColor: label.color || undefined,
                color: label.color || undefined,
              }}
            >
              {label.name}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: t('description'),
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        if (!description)
          return <span className="text-muted-foreground">—</span>;
        return (
          <div className="truncate text-sm text-muted-foreground max-w-[250px]">
            {description}
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('createdAt')} />
      ),
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return (
          <div className="text-sm text-muted-foreground text-right">
            {formatDistanceToNow(new Date(date), {
              addSuffix: true,
              locale: de,
            })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      size: 80,
      maxSize: 80,
      enableResizing: false,
      header: '', //t('actions')
      cell: ({ row }) => (
        <div className="flex justify-end text-right pr-2">
          <DataTableRowActions row={row} />
        </div>
      ),
    },
  ];
}
