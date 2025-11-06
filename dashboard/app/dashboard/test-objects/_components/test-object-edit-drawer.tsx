'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, FileText, Image as ImageIcon, Upload } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { InlineTextareaEditor } from '@/components/ui/inline-textarea-editor';
import { SortableImageGrid } from '@/components/ui/sortable-image-grid';
import { SortableDocumentList } from '@/components/ui/sortable-document-list';
import { toast } from 'sonner';

// Custom Hooks
import { useTestObjectData } from '@/hooks/use-test-object-data';
import { useTestObjectMutations } from '@/hooks/use-test-object-mutations';
import { useFileUpload } from '@/hooks/use-file-upload';

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

  // Use custom hooks for data and mutations
  const { testObject, pictures, documents, labels, isLoading, refetch } =
    useTestObjectData(testObjectId, open);

  const [localPictures, setLocalPictures] = React.useState<Picture[]>([]);
  const [localDocuments, setLocalDocuments] = React.useState<Document[]>([]);

  // Sync local state with loaded data
  React.useEffect(() => {
    setLocalPictures(pictures);
  }, [pictures]);

  React.useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const { updateTitle, updateDescription, updateLabel } =
    useTestObjectMutations(
      testObjectId,
      {
        title: testObject?.title,
        description: testObject?.description,
        labelId: testObject?.labelId,
      },
      { onSuccess }
    );

  const { uploadWithDebounce, isUploading } = useFileUpload();

  // Delete confirmation dialog state
  const [deleteItem, setDeleteItem] = React.useState<{
    type: 'picture' | 'document';
    id: string;
    name: string;
  } | null>(null);

  const [allFiles, setAllFiles] = React.useState<File[]>([]);

  // Handle file uploads
  const handleFilesChange = async (files: File[]) => {
    if (!testObjectId || isUploading) return;

    setAllFiles(files);

    if (files.length > 0) {
      const result = await uploadWithDebounce(
        files,
        {
          entityId: testObjectId,
          entityType: 'TEST_OBJECT',
          currentImagesCount: localPictures.length,
          currentDocumentsCount: localDocuments.length,
          onSuccess: () => {
            refetch();
            onSuccess?.();
          },
        },
        100
      );

      // Update local state with new files
      if (result?.images) {
        setLocalPictures((prev) => [...prev, ...result.images]);
      }
      if (result?.documents) {
        setLocalDocuments((prev) => [...prev, ...result.documents]);
      }

      // Clear files after upload
      setAllFiles([]);
    }
  };

  // Reset files when drawer closes
  React.useEffect(() => {
    if (!open) {
      setAllFiles([]);
    }
  }, [open]);

  // Handle picture reordering
  const handlePicturesReorder = async (newPictures: Picture[]) => {
    setLocalPictures(newPictures);

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

  // Handle document reordering
  const handleDocumentsReorder = async (newDocuments: Document[]) => {
    setLocalDocuments(newDocuments);

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

  // Handle document rename
  const handleDocumentRename = async (documentId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: newName }),
      });

      if (!response.ok) throw new Error('Failed to update document name');

      const updatedDoc = await response.json();
      setLocalDocuments((prev) =>
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

  // Handle delete confirmation
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
        setLocalPictures((prev) => prev.filter((p) => p.id !== deleteItem.id));
      } else {
        setLocalDocuments((prev) => prev.filter((d) => d.id !== deleteItem.id));
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
                  onSubmit={updateTitle}
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
                  <InlineTextareaEditor
                    value={testObject?.description || ''}
                    onSubmit={updateDescription}
                    placeholder={t('testObjects.table.description_placeholder')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t('testObjects.table.label')}
                  </label>
                  <Select
                    value={testObject?.labelId || undefined}
                    onValueChange={updateLabel}
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

              {(localPictures.length > 0 || localDocuments.length > 0) && (
                <Separator />
              )}

              {/* Images Section */}
              {localPictures.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4" />
                    {t('testObjects.form.images')} ({localPictures.length})
                  </h3>
                  <SortableImageGrid
                    images={localPictures}
                    onReorder={handlePicturesReorder}
                    onDelete={(id, name) =>
                      setDeleteItem({ type: 'picture', id, name })
                    }
                    deleteLabel={t('common.delete')}
                  />
                </div>
              )}

              {/* Documents Section */}
              {localDocuments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    {t('testObjects.form.documents')} ({localDocuments.length})
                  </h3>
                  <SortableDocumentList
                    documents={localDocuments}
                    onReorder={handleDocumentsReorder}
                    onDelete={(id, name) =>
                      setDeleteItem({ type: 'document', id, name })
                    }
                    onRename={handleDocumentRename}
                    deleteLabel={t('common.delete')}
                    allowRename={true}
                  />
                </div>
              )}

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
