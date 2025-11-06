'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { TestObjectsTableData } from '@/types/test-object';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Pencil } from 'lucide-react';
import { ImageThumbnailPreview } from '@/components/ui/image-thumbnail-preview';
import { TestObjectEditDrawer } from './test-object-edit-drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';



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
        const images = row.original.images;
        const title = row.getValue('title') as string;

        return <ImageThumbnailPreview images={images} title={title} />;
      },
      enableSorting: false,
      enableHiding: true,
      enableColumnFilter: false,
      meta: {
        label: t('testObjects.table.thumbnail'),
      },
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
      cell: function DescriptionCell({ row }) {
        const description = row.getValue('description') as string | null;

        if (!description) {
          return <div className="text-muted-foreground">-</div>;
        }

        const shouldTruncate = description.length > 50;

        if (!shouldTruncate) {
          return <div className="max-w-[300px]">{description}</div>;
        }

        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="max-w-[300px] truncate text-left hover:text-primary transition-colors cursor-pointer text-sm"
                type="button"
              >
                {description}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-[500px]" align="start">
              <div className="whitespace-pre-wrap wrap-break-word text-sm">
                {description}
              </div>
            </PopoverContent>
          </Popover>
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
    {
      id: 'actions',
      cell: function Cell({ row }) {
        const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false);
        const router = useRouter();
        const hasChangesRef = React.useRef(false);

        const handleSuccess = React.useCallback(() => {
          // Mark that changes were made
          hasChangesRef.current = true;
        }, []);

        const handleOpenChange = React.useCallback((open: boolean) => {
          setIsEditDrawerOpen(open);
          // When drawer closes, refresh if there were changes
          if (!open && hasChangesRef.current) {
            router.refresh();
            hasChangesRef.current = false;
          }
        }, [router]);

        return (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditDrawerOpen(true)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <TestObjectEditDrawer
              testObjectId={row.original.id}
              open={isEditDrawerOpen}
              onOpenChange={handleOpenChange}
              onSuccess={handleSuccess}
            />
          </>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];
}
