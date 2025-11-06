import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface FileItem {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

/**
 * Custom Hook for file operations (pictures and documents)
 * Handles reordering, deletion, and renaming
 */
export function useFileOperations(
  type: 'picture' | 'document',
  onSuccess?: () => void
) {
  const t = useTranslations();

  // Reorder files
  const reorderFiles = React.useCallback(
    async (files: FileItem[]) => {
      const endpoint = type === 'picture' ? 'pictures' : 'documents';

      try {
        await Promise.all(
          files.map((file, index) =>
            fetch(`/api/${endpoint}/${file.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: index }),
            })
          )
        );
        toast.success(t('testObjects.edit.orderUpdated'));
        onSuccess?.();
      } catch (error) {
        console.error(`Error updating ${type} order:`, error);
        toast.error(t('testObjects.edit.orderUpdateError'));
        throw error;
      }
    },
    [type, onSuccess, t]
  );

  // Delete file
  const deleteFile = React.useCallback(
    async (fileId: string) => {
      const endpoint = type === 'picture' ? 'pictures' : 'documents';

      try {
        const response = await fetch(`/api/${endpoint}/${fileId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete');

        toast.success(t('testObjects.edit.deleteSuccess'));
        onSuccess?.();
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        toast.error(t('testObjects.edit.deleteError'));
        throw error;
      }
    },
    [type, onSuccess, t]
  );

  // Rename document (only for documents)
  const renameFile = React.useCallback(
    async (fileId: string, newName: string) => {
      if (!newName.trim()) return;
      if (type !== 'document') {
        console.warn('Rename is only supported for documents');
        return;
      }

      try {
        const response = await fetch(`/api/documents/${fileId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalName: newName }),
        });

        if (!response.ok) throw new Error('Failed to update document name');

        const updatedDoc = await response.json();
        toast.success(t('testObjects.edit.documentNameUpdated'));
        return updatedDoc;
      } catch (error) {
        console.error('Error updating document name:', error);
        toast.error(t('testObjects.edit.documentNameError'));
        throw error;
      }
    },
    [type, t]
  );

  return {
    reorderFiles,
    deleteFile,
    renameFile,
  };
}
