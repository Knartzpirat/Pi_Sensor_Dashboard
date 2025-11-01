'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { TestObjectsTableData } from '@/types/test-object';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, ImageIcon, Pencil } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import AutoHeight from 'embla-carousel-auto-height';
import { TestObjectEditDrawer } from './test-object-edit-drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';

// TODO: Extract to separate component
// - [ ] `components/ui/image-thumbnail-preview.tsx` - Wiederverwendbare Thumbnail-Komponente mit Preview-Dialog
// - [ ] `components/ui/image-carousel-dialog.tsx` - Modal mit Carousel für Bildergalerien
// - [ ] `hooks/use-carousel-state.tsx` - Custom Hook für Carousel-Status und Navigation

// Thumbnail component with preview dialog
function ThumbnailPreview({
  images,
  title
}: {
  images: Array<{ id: string; url: string; order: number }>;
  title: string;
}) {
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);
  const [imagesLoaded, setImagesLoaded] = React.useState(0);

  React.useEffect(() => {
    if (!carouselApi) return;

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on('select', () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  // Reinit carousel when images are loaded
  React.useEffect(() => {
    if (carouselApi && imagesLoaded > 0) {
      carouselApi.reInit();
    }
  }, [carouselApi, imagesLoaded]);

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!isOpen) {
      setImagesLoaded(0);
      setCurrent(0);
    }
  }, [isOpen]);

  const handleImageLoad = React.useCallback(() => {
    setImagesLoaded((prev) => prev + 1);
  }, []);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/50">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  const thumbnailUrl = images[0].url;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted/50 cursor-pointer hover:ring-2 hover:ring-ring transition-all">
          <Image
            src={thumbnailUrl}
            alt={title}
            width={48}
            height={48}
            className="h-full w-full rounded-md object-cover"
            unoptimized
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        {images.length === 1 ? (
        <div className="flex items-center justify-center">
          <Image
              src={images[0].url}
            alt={title}
              width={800}
              height={800}
              className="rounded-md object-contain max-h-[70vh]"
              unoptimized
            />
          </div>
        ) : (
          <div className="space-y-4">
            <Carousel
              setApi={setCarouselApi}
              className="w-full"
              plugins={[AutoHeight()]}
              opts={{ watchDrag: true }}
            >
              <CarouselContent className="items-center">
                {images.map((image, index) => (
                  <CarouselItem key={image.id} className="flex items-center justify-center">
                      <Image
                        src={image.url}
                        alt={`${title} - Bild ${index + 1}`}
                        width={800}
                        height={800}
                      className="rounded-md object-contain max-h-[70vh] w-auto h-auto"
            unoptimized
                      onLoad={handleImageLoad}
                      priority={index === 0}
          />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <div className="text-center text-sm text-muted-foreground">
              Bild {current} von {count}
            </div>
          </div>
        )}
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
        const images = row.original.images;
        const title = row.getValue('title') as string;

        return <ThumbnailPreview images={images} title={title} />;
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
      // TODO: Extract to separate component
      // - [ ] `components/ui/truncated-text-popover.tsx` - Wiederverwendbare Komponente für abgeschnittenen Text mit Popover
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
      // TODO: Extract to separate component
      // - [ ] `components/ui/label-badge.tsx` - Wiederverwendbare Label-Badge mit Farb-Support
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
    // TODO: Extract to separate component
    // - [ ] `components/ui/table-row-actions.tsx` - Wiederverwendbare Row-Actions mit Edit/Delete Buttons
    // - [ ] `hooks/use-row-edit-state.tsx` - Custom Hook für Row-Edit State Management
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
