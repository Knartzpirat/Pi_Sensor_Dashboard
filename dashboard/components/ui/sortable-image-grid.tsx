'use client';

import * as React from 'react';
import Image from 'next/image';
import { GripVertical, Trash2 } from 'lucide-react';
import { DndContext } from '@dnd-kit/core';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from './sortable';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu';

interface ImageItem {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface SortableImageGridProps {
  images: ImageItem[];
  onReorder: (newImages: ImageItem[]) => void;
  onDelete?: (imageId: string, imageName: string) => void;
  deleteLabel?: string;
}

/**
 * Reusable sortable image grid with drag & drop and context menu
 */
export function SortableImageGrid({
  images,
  onReorder,
  onDelete,
  deleteLabel = 'Delete',
}: SortableImageGridProps) {
  return (
    <DndContext>
      <Sortable
        value={images}
        onValueChange={onReorder}
        getItemValue={(img) => img.id}
        orientation="mixed"
      >
        <SortableContent className="grid grid-cols-4 gap-2">
          {images.map((image) => (
            <SortableItem key={image.id} value={image.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="relative aspect-square group">
                    <SortableItemHandle asChild>
                      <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <div className="p-1 bg-black/50 rounded">
                          <GripVertical className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </SortableItemHandle>
                    <Image
                      src={image.url}
                      alt={image.originalName}
                      fill
                      className="rounded-md object-cover"
                      unoptimized
                    />
                  </div>
                </ContextMenuTrigger>
                {onDelete && (
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(image.id, image.originalName)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteLabel}
                    </ContextMenuItem>
                  </ContextMenuContent>
                )}
              </ContextMenu>
            </SortableItem>
          ))}
        </SortableContent>
        <SortableOverlay>
          {({ value }) => {
            const image = images.find((img) => img.id === value);
            return image ? (
              <div className="relative aspect-square w-24 h-24 opacity-50">
                <Image
                  src={image.url}
                  alt={image.originalName}
                  fill
                  className="rounded-md object-cover"
                  unoptimized
                />
              </div>
            ) : null;
          }}
        </SortableOverlay>
      </Sortable>
    </DndContext>
  );
}
