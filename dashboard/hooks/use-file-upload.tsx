import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface UploadOptions {
  entityId: string;
  entityType: string;
  currentImagesCount?: number;
  currentDocumentsCount?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  images?: Array<{
    id: string;
    url: string;
    originalName: string;
    order: number;
  }>;
  documents?: Array<{
    id: string;
    url: string;
    originalName: string;
    order: number;
  }>;
}

/**
 * Custom Hook for file upload with progress tracking and error handling
 */
export function useFileUpload() {
  const t = useTranslations();
  const [isUploading, setIsUploading] = React.useState(false);
  const uploadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastUploadHashRef = React.useRef<string>('');

  const uploadFiles = React.useCallback(
    async (
      files: File[],
      options: UploadOptions
    ): Promise<UploadResult | null> => {
      if (files.length === 0 || isUploading) return null;

      // Create a hash of files to prevent duplicate uploads
      const fileHash = files
        .map((f) => `${f.name}-${f.size}-${f.lastModified}`)
        .join('|');
      if (fileHash === lastUploadHashRef.current) {
        console.log('Duplicate upload prevented');
        return null;
      }
      lastUploadHashRef.current = fileHash;

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('entityId', options.entityId);
        formData.append('entityType', options.entityType);

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
            ((options.currentImagesCount || 0) + index).toString()
          );
        });

        // Add documents with order
        docs.forEach((file, index) => {
          formData.append('documents', file);
          formData.append(
            `documentOrder_${index}`,
            ((options.currentDocumentsCount || 0) + index).toString()
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
        toast.success(t('testObjects.edit.uploadSuccess'));
        options.onSuccess?.();

        return result.data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Upload failed');
        console.error('Error uploading files:', err);
        toast.error(t('testObjects.edit.uploadError'));
        options.onError?.(err);
        throw err;
      } finally {
        setIsUploading(false);
        // Clear hash after a delay to allow new uploads of same files
        setTimeout(() => {
          lastUploadHashRef.current = '';
        }, 5000);
      }
    },
    [isUploading, t]
  );

  const uploadWithDebounce = React.useCallback(
    (files: File[], options: UploadOptions, delay: number = 100) => {
      // Clear any existing timeout
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }

      return new Promise<UploadResult | null>((resolve) => {
        uploadTimeoutRef.current = setTimeout(async () => {
          const result = await uploadFiles(files, options);
          resolve(result);
        }, delay);
      });
    },
    [uploadFiles]
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  return {
    uploadFiles,
    uploadWithDebounce,
    isUploading,
  };
}
