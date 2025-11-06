'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { DndContext } from '@dnd-kit/core';
import {
  Loader2,
  FileText,
  Image as ImageIcon,
  GripVertical,
  Upload,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableLabel,
} from '@/components/ui/editable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from '@/components/ui/file-upload';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

// TODO: Extract to separate component
// - [ ] `components/ui/inline-textarea-editor.tsx` - Wiederverwendbare inline-editable Textarea mit Auto-Save
// - [ ] `hooks/use-inline-edit.tsx` - Custom Hook für Inline-Edit State und Auto-Save Logic

// Textarea component that looks like text until clicked
function DescriptionTextarea({
  value,
  onSubmit,
  placeholder,
}: {
  value: string;
  onSubmit: (value: string) => void;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(value);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Set cursor to end
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = React.useCallback(() => {
    if (localValue !== value) {
      onSubmit(localValue);
    }
    setIsEditing(false);
  }, [localValue, value, onSubmit]);

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 1 second of no typing
    saveTimeoutRef.current = setTimeout(() => {
      if (newValue !== value) {
        onSubmit(newValue);
      }
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    // Don't submit on Enter, allow newlines
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text hover:border-ring transition-colors whitespace-pre-wrap"
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-20 resize-y"
      />
    </div>
  );
}

interface Picture {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface Document {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface TestObject {
  id: string;
  title: string;
  description: string | null;
  labelId: string | null;
  label: Label | null;
}

interface TestObjectEditDrawerProps {
  testObjectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TestObjectEditDrawer({
  testObjectId,
  open,
  onOpenChange,
  onSuccess,
}: TestObjectEditDrawerProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const [testObject, setTestObject] = React.useState<TestObject | null>(null);
  const [pictures, setPictures] = React.useState<Picture[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deleteItem, setDeleteItem] = React.useState<{
    type: 'picture' | 'document';
    id: string;
    name: string;
  } | null>(null);
  const [allFiles, setAllFiles] = React.useState<File[]>([]);
  const uploadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastUploadHashRef = React.useRef<string>('');

  // TODO: Extract to custom hooks
  // - [ ] `hooks/use-test-object-data.tsx` - Custom Hook für Test-Object Data Loading
  // - [ ] `hooks/use-labels-data.tsx` - Custom Hook für Labels Loading und Caching

  // Load test object data
  React.useEffect(() => {
    if (!open || !testObjectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load test object with pictures and documents
        const testObjectRes = await fetch(
          `/api/test-objects/${testObjectId}?includePictures=true&includeDocuments=true`
        );
        if (!testObjectRes.ok) throw new Error('Failed to load test object');
        const testObjectData = await testObjectRes.json();
        setTestObject(testObjectData);
        setPictures(testObjectData.pictures || []);
        setDocuments(testObjectData.documents || []);

        // Load labels
        const labelsRes = await fetch('/api/labels?type=TEST_OBJECT');
        if (labelsRes.ok) {
          const labelsData = await labelsRes.json();
          setLabels(labelsData);
        }
      } catch (error) {
        console.error('Error loading test object:', error);
        toast.error(t('testObjects.edit.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, testObjectId, t]);

  // TODO: Extract to custom hooks
  // - [ ] `hooks/use-test-object-mutations.tsx` - Custom Hook für Test-Object Update Operations
  // - [ ] `services/test-object-api.ts` - API Service für Test-Object CRUD Operations

  const handleTitleChange = async (newTitle: string) => {
    if (!testObjectId || !newTitle.trim()) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: testObject?.description,
          labelId: testObject?.labelId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update title');

      setTestObject((prev) => (prev ? { ...prev, title: newTitle } : null));
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleDescriptionChange = async (newDescription: string) => {
    if (!testObjectId) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testObject?.title,
          description: newDescription || null,
          labelId: testObject?.labelId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update description');

      setTestObject((prev) =>
        prev ? { ...prev, description: newDescription || null } : null
      );
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleLabelChange = async (newLabelId: string) => {
    if (!testObjectId) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testObject?.title,
          description: testObject?.description,
          labelId: newLabelId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update label');

      const selectedLabel = labels.find((l) => l.id === newLabelId) || null;
      setTestObject((prev) =>
        prev ? { ...prev, labelId: newLabelId, label: selectedLabel } : null
      );
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleDocumentNameChange = async (
    documentId: string,
    newName: string
  ) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: newName }),
      });

      if (!response.ok) throw new Error('Failed to update document name');

      const updatedDoc = await response.json();
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, originalName: updatedDoc.originalName }
            : doc
        )
      );
      toast.success(t('testObjects.edit.documentNameUpdated'));
    } catch (error) {
      console.error('Error updating document name:', error);
      toast.error(t('testObjects.edit.documentNameError'));
    }
  };

  const handlePicturesReorder = async (newPictures: Picture[]) => {
    setPictures(newPictures);

    // Update order in database
    try {
      await Promise.all(
        newPictures.map((pic, index) =>
          fetch(`/api/pictures/${pic.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      toast.success(t('testObjects.edit.orderUpdated'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating picture order:', error);
      toast.error(t('testObjects.edit.orderUpdateError'));
    }
  };

  const handleDocumentsReorder = async (newDocuments: Document[]) => {
    setDocuments(newDocuments);

    // Update order in database
    try {
      await Promise.all(
        newDocuments.map((doc, index) =>
          fetch(`/api/documents/${doc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      toast.success(t('testObjects.edit.orderUpdated'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating document order:', error);
      toast.error(t('testObjects.edit.orderUpdateError'));
    }
  };

  // TODO: Extract to custom hook
  // - [ ] `hooks/use-file-upload.tsx` - Custom Hook für File-Upload mit Progress und Error Handling
  // - [ ] `services/upload-api.ts` - API Service für File-Upload Operations

  const uploadFiles = async (files: File[]) => {
    if (!testObjectId || files.length === 0 || isUploading) return;

    // Create a hash of files to prevent duplicate uploads
    const fileHash = files
      .map((f) => `${f.name}-${f.size}-${f.lastModified}`)
      .join('|');
    if (fileHash === lastUploadHashRef.current) {
      console.log('Duplicate upload prevented');
      return;
    }
    lastUploadHashRef.current = fileHash;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('entityId', testObjectId);
      formData.append('entityType', 'TEST_OBJECT');

      // Separate images and documents
      const images = files.filter((file) => file.type.startsWith('image/'));
      const docs = files.filter((file) => file.type === 'application/pdf');

      console.log('Uploading files:', {
        images: images.length,
        documents: docs.length,
      });

      // Add images with order
      images.forEach((file, index) => {
        formData.append('images', file);
        formData.append(
          `imageOrder_${index}`,
          (pictures.length + index).toString()
        );
      });

      // Add documents with order
      docs.forEach((file, index) => {
        formData.append('documents', file);
        formData.append(
          `documentOrder_${index}`,
          (documents.length + index).toString()
        );
      });

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      // Update local state with new files
      if (result.data?.images && Array.isArray(result.data.images)) {
        setPictures((prev) => [...prev, ...result.data.images]);
      }
      if (result.data?.documents && Array.isArray(result.data.documents)) {
        setDocuments((prev) => [...prev, ...result.data.documents]);
      }

      toast.success(t('testObjects.edit.uploadSuccess'));
      onSuccess?.();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(t('testObjects.edit.uploadError'));
    } finally {
      setIsUploading(false);
      // Clear hash after a delay to allow new uploads of same files
      setTimeout(() => {
        lastUploadHashRef.current = '';
      }, 5000);
    }
  };

  const handleFilesChange = async (files: File[]) => {
    if (isUploading) {
      toast.error('Upload already in progress');
      return;
    }

    // Clear any existing timeout
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }

    setAllFiles(files);

    if (files.length > 0) {
      // Debounce the upload to prevent rapid successive calls
      uploadTimeoutRef.current = setTimeout(async () => {
        await uploadFiles(files);
        // Clear files after upload
        setAllFiles([]);
      }, 100);
    }
  };

  // Reset files when drawer closes
  React.useEffect(() => {
    if (!open) {
      setAllFiles([]);
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
      lastUploadHashRef.current = '';
    }
  }, [open]);

  // Clean up timeout on unmount
  React.useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  // TODO: Extract to custom hook
  // - [ ] `hooks/use-delete-confirmation.tsx` - Custom Hook für Delete-Dialoge mit Confirmation
  // - [ ] `services/file-api.ts` - API Service für File Delete Operations

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      const endpoint =
        deleteItem.type === 'picture'
          ? `/api/pictures/${deleteItem.id}`
          : `/api/documents/${deleteItem.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Update local state
      if (deleteItem.type === 'picture') {
        setPictures((prev) => prev.filter((p) => p.id !== deleteItem.id));
      } else {
        setDocuments((prev) => prev.filter((d) => d.id !== deleteItem.id));
      }

      toast.success(t('testObjects.edit.deleteSuccess'));
      setDeleteItem(null);
      onSuccess?.();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('testObjects.edit.deleteError'));
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('testObjects.edit.title')}</SheetTitle>
            <SheetDescription>
              {t('testObjects.edit.description')}
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 py-2 px-4">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <Editable
                  value={testObject?.title || ''}
                  onSubmit={handleTitleChange}
                  required
                >
                  <EditableLabel>{t('testObjects.table.title')}</EditableLabel>
                  <EditableArea>
                    <EditablePreview />
                    <EditableInput />
                  </EditableArea>
                </Editable>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('testObjects.table.description')}
                  </label>
                  <DescriptionTextarea
                    value={testObject?.description || ''}
                    onSubmit={handleDescriptionChange}
                    placeholder={t('testObjects.table.description_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('testObjects.table.label')}
                  </label>
                  <Select
                    value={testObject?.labelId || undefined}
                    onValueChange={handleLabelChange}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('testObjects.table.label_placeholder')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {labels.map((label) => (
                        <SelectItem key={label.id} value={label.id}>
                          <div className="flex items-center gap-2">
                            {label.color && (
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                              />
                            )}
                            {label.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(pictures.length > 0 || documents.length > 0) && <Separator />}

              {/* TODO: Extract to separate component
               * - [ ] `components/ui/sortable-image-grid.tsx` - Wiederverwendbare sortierbare Bildergalerie
               * - [ ] `components/ui/image-item.tsx` - Einzelne Bildkarte mit Context Menu und Drag Handle
               */}
              {/* Images Section */}
              {pictures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4" />
                    {t('testObjects.form.images')} ({pictures.length})
                  </h3>
                  <DndContext>
                    <Sortable
                      value={pictures}
                      onValueChange={handlePicturesReorder}
                      getItemValue={(pic) => pic.id}
                      orientation="mixed"
                    >
                      <SortableContent className="grid grid-cols-4 gap-2">
                        {pictures.map((picture) => (
                          <SortableItem key={picture.id} value={picture.id}>
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
                                    src={picture.url}
                                    alt={picture.originalName}
                                    fill
                                    className="rounded-md object-cover"
                                    unoptimized
                                  />
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteItem({
                                      type: 'picture',
                                      id: picture.id,
                                      name: picture.originalName,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </SortableItem>
                        ))}
                      </SortableContent>
                      <SortableOverlay>
                        {({ value }) => {
                          const picture = pictures.find((p) => p.id === value);
                          return picture ? (
                            <div className="relative aspect-square w-24 h-24 opacity-50">
                              <Image
                                src={picture.url}
                                alt={picture.originalName}
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
                </div>
              )}

              {/* TODO: Extract to separate component
               * - [ ] `components/ui/sortable-document-list.tsx` - Wiederverwendbare sortierbare Dokumentenliste
               * - [ ] `components/ui/document-item.tsx` - Einzelnes Dokument mit inline-edit Name und Context Menu
               */}
              {/* Documents Section */}
              {documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    {t('testObjects.form.documents')} ({documents.length})
                  </h3>
                  <DndContext>
                    <Sortable
                      value={documents}
                      onValueChange={handleDocumentsReorder}
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
                                  <Editable
                                    value={doc.originalName}
                                    onSubmit={(value) =>
                                      handleDocumentNameChange(doc.id, value)
                                    }
                                    className="flex-1"
                                  >
                                    <EditableArea className="w-full">
                                      <EditablePreview className="w-full" />
                                      <EditableInput className="w-full" />
                                    </EditableArea>
                                  </Editable>
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() =>
                                    setDeleteItem({
                                      type: 'document',
                                      id: doc.id,
                                      name: doc.originalName,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t('common.delete')}
                                </ContextMenuItem>
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
                </div>
              )}

              {/* TODO: Extract to separate component
               * - [ ] `components/form/file-upload-section.tsx` - Wiederverwendbare File-Upload Sektion mit Preview
               * - [ ] `components/ui/upload-progress-bar.tsx` - Upload-Progress Indikator
               */}
              {/* Upload Files Section */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  {t('testObjects.edit.uploadNewFiles')}
                </h3>
                <FileUpload
                  value={allFiles}
                  onValueChange={handleFilesChange}
                  accept="image/*,application/pdf"
                  multiple
                  maxFiles={30}
                  maxSize={10 * 1024 * 1024} // 10MB
                  disabled={isUploading}
                >
                  <FileUploadDropzone>
                    <div className="flex flex-col items-center gap-2 py-6">
                      {isUploading ? (
                      <div className="flex items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-sm font-medium">
                            {t('testObjects.edit.uploading')}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">
                          {t('testObjects.form.dropzone_combined_title')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                              {t(
                                'testObjects.form.dropzone_combined_description'
                              )}
                        </p>
                      </div>
                      <FileUploadTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          {t('testObjects.form.select_files')}
                        </Button>
                      </FileUploadTrigger>
                        </>
                      )}
                    </div>
                  </FileUploadDropzone>
                </FileUpload>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('testObjects.edit.deleteTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('testObjects.edit.deleteDescription', {
                name: deleteItem?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
