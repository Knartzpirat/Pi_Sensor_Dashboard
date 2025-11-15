'use client';

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { formatDate } from '@/lib/format';
import { Clock, FlaskConical, MoreHorizontal, Eye, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DeleteMeasurementsDialog } from './delete-measurements-dialog';

export interface MeasurementTableData {
  id: string;
  sessionId: string;
  title: string;
  description?: string | null;
  status: string;
  interval: number;
  duration?: number | null;
  startTime: Date;
  endTime?: Date | null;
  readingsCount: number;
  errorCount: number;
  measurementSensors?: {
    sensor: {
      id: string;
      name: string;
    };
    testObject?: {
      id: string;
      title: string;
    } | null;
  }[];
}

interface GetColumnsProps {
  t: any;
}

export function getColumns({ t }: GetColumnsProps): ColumnDef<MeasurementTableData>[] {
  return [
    {
      id: 'title',
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.title')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{row.getValue('title')}</span>
            {row.original.description && (
              <span className="text-xs text-muted-foreground line-clamp-1">
                {row.original.description}
              </span>
            )}
          </div>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      enableHiding: false,
      meta: {
        label: t('measurementsPage.table.title'),
        variant: 'text',
      },
    },
    {
      accessorKey: 'startTime',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.startTime')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(row.original.startTime, 'dateTime')}</span>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: 'duration',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.duration')} />
      ),
      cell: ({ row }) => {
        const duration = row.original.duration;
        if (!duration) return <span className="text-muted-foreground">-</span>;

        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return (
          <span>
            {minutes > 0 && `${minutes}m `}
            {seconds}s
          </span>
        );
      },
      enableSorting: true,
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

        if (status === 'COMPLETED') variant = 'default';
        else if (status === 'RUNNING') variant = 'secondary';
        else if (status === 'ERROR' || status === 'CANCELLED') variant = 'destructive';
        else if (status === 'STARTING') variant = 'outline';

        return (
          <Badge variant={variant}>
            {t(`measurementsPage.status.${status.toLowerCase()}`)}
          </Badge>
        );
      },
      enableColumnFilter: true,
      enableSorting: true,
      filterFn: (row, id, value) => {
        return Array.isArray(value) && value.includes(row.getValue(id));
      },
      meta: {
        label: t('measurementsPage.table.status'),
        variant: 'multiSelect',
        options: [
          { label: t('measurementsPage.status.starting'), value: 'STARTING' },
          { label: t('measurementsPage.status.running'), value: 'RUNNING' },
          { label: t('measurementsPage.status.completed'), value: 'COMPLETED' },
          { label: t('measurementsPage.status.error'), value: 'ERROR' },
          { label: t('measurementsPage.status.cancelled'), value: 'CANCELLED' },
        ],
      },
    },
    {
      accessorKey: 'testObject',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.testObjects')} />
      ),
      cell: ({ row }) => {
        const sensors = row.original.measurementSensors || [];
        const testObjects = sensors
          .map((ms) => ms.testObject)
          .filter((to): to is NonNullable<typeof to> => to !== null && to !== undefined);

        // Get unique test objects
        const uniqueTestObjects = Array.from(
          new Map(testObjects.map((to) => [to.id, to])).values()
        );

        if (uniqueTestObjects.length === 0) {
          return <span className="text-muted-foreground italic">{t('measurementsPage.table.noTestObject')}</span>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {uniqueTestObjects.slice(0, 2).map((to) => (
              <Badge key={to.id} variant="outline" className="gap-1">
                <FlaskConical className="h-3 w-3" />
                {to.title}
              </Badge>
            ))}
            {uniqueTestObjects.length > 2 && (
              <Badge variant="outline">+{uniqueTestObjects.length - 2}</Badge>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'readingsCount',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label={t('measurementsPage.table.readings')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <span>{row.original.readingsCount.toLocaleString()}</span>
            {row.original.errorCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {row.original.errorCount} {t('measurementsPage.table.errors')}
              </Badge>
            )}
          </div>
        );
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: function Cell({ row }) {
        const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
        const router = useRouter();

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('common.actions')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/measurements/${row.original.id}`);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {t('measurementsPage.actions.view')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t('measurementsPage.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {showDeleteDialog && (
              <DeleteMeasurementsDialog
                measurements={[row.original]}
                onSuccess={() => {
                  setShowDeleteDialog(false);
                  router.refresh();
                }}
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
              />
            )}
          </>
        );
      },
    },
  ];
}
