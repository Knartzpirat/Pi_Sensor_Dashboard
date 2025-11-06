'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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

// Custom Hooks
import { useTestObjectData } from '@/hooks/use-test-object-data';
import { useTestObjectMutations } from '@/hooks/use-test-object-mutations';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useFileOperations } from '@/hooks/use-file-operations';

// Feature Components
import { EditableInfoSection } from '@/components/editable-info-section';
import { MediaSection } from '@/components/media-section';
import { DocumentsSection } from '@/components/documents-section';
import { FileUploadSection } from '@/components/file-upload-section';

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

  const { reorderFiles: reorderPictures } = useFileOperations(
    'picture',
    onSuccess
  );
  const { reorderFiles: reorderDocuments, renameFile: renameDocument } =
    useFileOperations('document', onSuccess);

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
        setLocalPictures((prev) => [...prev, ...(result.images || [])]);
      }
      if (result?.documents) {
        setLocalDocuments((prev) => [...prev, ...(result.documents || [])]);
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
    await reorderPictures(newPictures);
  };

  // Handle document reordering
  const handleDocumentsReorder = async (newDocuments: Document[]) => {
    setLocalDocuments(newDocuments);
    await reorderDocuments(newDocuments);
  };

  // Handle document rename
  const handleDocumentRename = async (documentId: string, newName: string) => {
    const updatedDoc = await renameDocument(documentId, newName);
    if (updatedDoc) {
      setLocalDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, originalName: updatedDoc.originalName }
            : doc
        )
      );
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
              <EditableInfoSection
                title={testObject?.title || ''}
                description={testObject?.description || null}
                labelId={testObject?.labelId || null}
                labels={labels}
                onTitleUpdate={updateTitle}
                onDescriptionUpdate={updateDescription}
                onLabelUpdate={updateLabel}
              />

              {(localPictures.length > 0 || localDocuments.length > 0) && (
                <Separator />
              )}

              {/* Images Section */}
              <MediaSection
                pictures={localPictures}
                onReorder={handlePicturesReorder}
                onDelete={(id, name) =>
                  setDeleteItem({ type: 'picture', id, name })
                }
              />

              {/* Documents Section */}
              <DocumentsSection
                documents={localDocuments}
                onReorder={handleDocumentsReorder}
                onDelete={(id, name) =>
                  setDeleteItem({ type: 'document', id, name })
                }
                onRename={handleDocumentRename}
              />

              {/* Upload Files Section */}
              <FileUploadSection
                files={allFiles}
                isUploading={isUploading}
                onFilesChange={handleFilesChange}
              />
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
