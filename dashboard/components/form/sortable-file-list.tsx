'use client';

import * as React from 'react';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from '@/components/ui/file-upload';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable';

interface SortableFileListProps {
  files: File[];
  onReorder: (files: File[]) => void;
  onRemove: (file: File) => void;
  getItemKey?: (file: File) => string;
}

/**
 * Reusable sortable file list for form file uploads
 */
export function SortableFileList({
  files,
  onReorder,
  onRemove,
  getItemKey = (file) => file.name + file.size,
}: SortableFileListProps) {
  return (
    <Sortable
      value={files}
      onValueChange={onReorder}
      getItemValue={getItemKey}
    >
      <SortableContent>
        <FileUploadList>
          {files.map((file) => (
            <SortableItem
              key={getItemKey(file)}
              value={getItemKey(file)}
              asChild
            >
              <FileUploadItem value={file}>
                <SortableItemHandle asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-6 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </SortableItemHandle>
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <FileUploadItemDelete asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemove(file)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            </SortableItem>
          ))}
        </FileUploadList>
      </SortableContent>
      <SortableOverlay>
        {({ value }) => {
          const file = files.find((f) => getItemKey(f) === value);
          return file ? (
            <FileUploadItem value={file} className="opacity-50">
              <FileUploadItemPreview />
              <FileUploadItemMetadata />
            </FileUploadItem>
          ) : null;
        }}
      </SortableOverlay>
    </Sortable>
  );
}
