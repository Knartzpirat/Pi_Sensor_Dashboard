import * as React from 'react';

/**
 * Custom Hook for filtering and managing files by type (images and PDFs)
 */
export function useFileTypeFilter(allFiles: File[]) {
  // Filter images
  const images = React.useMemo(
    () => allFiles.filter((file) => file.type.startsWith('image/')),
    [allFiles]
  );

  // Filter PDFs/documents
  const documents = React.useMemo(
    () => allFiles.filter((file) => file.type === 'application/pdf'),
    [allFiles]
  );

  return {
    images,
    documents,
  };
}

/**
 * Hook for managing separate file lists while maintaining a single source of truth
 */
export function useSeparateFileLists(
  allFiles: File[],
  setAllFiles: React.Dispatch<React.SetStateAction<File[]>>
) {
  const { images, documents } = useFileTypeFilter(allFiles);

  // Setter for images that preserves documents
  const setImages = React.useCallback(
    (newImages: File[]) => {
      setAllFiles((current) => [
        ...newImages,
        ...current.filter((f) => f.type === 'application/pdf'),
      ]);
    },
    [setAllFiles]
  );

  // Setter for documents that preserves images
  const setDocuments = React.useCallback(
    (newDocuments: File[]) => {
      setAllFiles((current) => [
        ...current.filter((f) => f.type.startsWith('image/')),
        ...newDocuments,
      ]);
    },
    [setAllFiles]
  );

  return {
    images,
    documents,
    setImages,
    setDocuments,
  };
}
