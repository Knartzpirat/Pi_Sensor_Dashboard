'use client';

import * as React from 'react';
import { FileText, GripVertical, Trash2, Download, Eye } from 'lucide-react';
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
import {
  Editable,
  EditableArea,
  EditablePreview,
  EditableInput,
} from './editable';

interface DocumentItem {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface SortableDocumentListProps {
  documents: DocumentItem[];
  onReorder: (newDocuments: DocumentItem[]) => void;
  onDelete?: (documentId: string, documentName: string) => void;
  onRename?: (documentId: string, newName: string) => void;
  deleteLabel?: string;
  downloadLabel?: string;
  viewLabel?: string;
  allowRename?: boolean;
}

/**
 * Reusable sortable document list with drag & drop, inline rename, and context menu
 */
export function SortableDocumentList({
  documents,
  onReorder,
  onDelete,
  onRename,
  deleteLabel = 'Delete',
  downloadLabel = 'Download',
  viewLabel = 'View',
  allowRename = true,
}: SortableDocumentListProps) {
  const handleDownload = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (doc: DocumentItem) => {
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  };
  return (
    <DndContext>
      <Sortable
        value={documents}
        onValueChange={onReorder}
        getItemValue={(doc) => doc.id}
        orientation="vertical"
      >
        <SortableContent className="space-y-2">
          {documents.map((doc) => (
            <SortableItem key={doc.id} value={doc.id}>
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div className="flex items-center gap-2 rounded-md border p-2 group">
                    <SortableItemHandle asChild>
                      <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </SortableItemHandle>
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    {allowRename && onRename ? (
                      <Editable
                        value={doc.originalName}
                        onSubmit={(value) => onRename(doc.id, value)}
                        className="flex-1"
                      >
                        <EditableArea className="w-full">
                          <EditablePreview className="w-full" />
                          <EditableInput className="w-full" />
                        </EditableArea>
                      </Editable>
                    ) : (
                      <span className="flex-1 text-sm">{doc.originalName}</span>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleView(doc)}>
                    <Eye className="mr-2 h-4 w-4" />
                    {viewLabel}
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleDownload(doc)}>
                    <Download className="mr-2 h-4 w-4" />
                    {downloadLabel}
                  </ContextMenuItem>
                  {onDelete && (
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(doc.id, doc.originalName)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleteLabel}
                    </ContextMenuItem>
                  )}
                </ContextMenuContent>
              </ContextMenu>
            </SortableItem>
          ))}
        </SortableContent>
        <SortableOverlay>
          <div className="size-full rounded-md bg-primary/10" />
        </SortableOverlay>
      </Sortable>
    </DndContext>
  );
}
