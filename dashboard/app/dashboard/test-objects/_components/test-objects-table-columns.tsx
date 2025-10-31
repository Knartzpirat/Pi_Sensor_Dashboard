'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { TestObjectsTableData } from '@/types/test-object';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Tag, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';

// Thumbnail component with preview dialog
function ThumbnailPreview({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/50">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/50 cursor-pointer hover:ring-2 hover:ring-ring transition-all">
          <Image
            src={url}
            alt={title}
            width={48}
            height={48}
            className="h-full w-full rounded-md object-cover"
            unoptimized
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <div className="flex items-center justify-center">
          <Image
            src={url}
            alt={title}
            width={600}
            height={600}
            className="rounded-md object-contain max-h-[70vh]"
            unoptimized
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}



interface GetColumnsProps {
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  labelCounts: Record<string, number>;
}

export function getColumns(
  { t, labelCounts }: GetColumnsProps
): ColumnDef<TestObjectsTableData>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'thumbnail',
      accessorKey: 'thumbnailUrl',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.thumbnail')}
        />
      ),
      cell: ({ row }) => {
        const thumbnailUrl = row.getValue('thumbnail') as string | null;
        const title = row.getValue('title') as string;

        return <ThumbnailPreview url={thumbnailUrl} title={title} />;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: false,
    },
    {
      id: 'title',
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.title')}
        />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[500px] truncate font-medium">
              {row.getValue('title')}
            </span>
          </div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: t('testObjects.table.title'),
        variant: 'text',
      },
    },
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.description')}
        />
      ),
      cell: ({ row }) => {
        const description = row.getValue('description') as string | null;
        return (
          <div className="max-w-[300px] truncate">{description || '-'}</div>
        );
      },
      enableColumnFilter: false,
      enableSorting: false,
      meta: {
        label: t('testObjects.table.description'),
        variant: 'text',
      },
    },
    {
      id: 'label',
      accessorKey: 'label',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.label')}
        />
      ),
      cell: ({ row }) => {
        const label = row.getValue('label') as string;
        const labelColor = row.original.labelColor;

        if (label === 'No Label') {
          return <span className="text-muted-foreground">-</span>;
        }

        return (
          <Badge
            variant="outline"
            style={{
              borderColor: labelColor || undefined,
              color: labelColor || undefined,
            }}
          >
            {label}
          </Badge>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
      meta: {
        label: t('testObjects.table.label'),
        variant: 'multiSelect',
        options: Object.entries(labelCounts).map(([label, count]) => ({
          label,
          value: label,
          count,
          icon: Tag,
        })),
      },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.createdAt')}
        />
      ),
      cell: ({ row }) => {
        return formatDate(row.getValue('createdAt'), 'short');
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: t('testObjects.table.createdAt'),
        variant: 'date',
      },
    },
    {
      id: 'updatedAt',
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          label={t('testObjects.table.updatedAt')}
        />
      ),
      cell: ({ row }) => {
        return formatDate(row.getValue('updatedAt'), 'short');
      },
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: t('testObjects.table.updatedAt'),
        variant: 'date',
      },
    },
  ];
}
