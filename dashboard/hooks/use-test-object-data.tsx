import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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

interface TestObjectData {
  testObject: TestObject | null;
  pictures: Picture[];
  documents: Document[];
  labels: Label[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Custom Hook for loading test object data with pictures, documents and available labels
 */
export function useTestObjectData(
  testObjectId: string | null,
  enabled: boolean = true
): TestObjectData {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [testObject, setTestObject] = React.useState<TestObject | null>(null);
  const [pictures, setPictures] = React.useState<Picture[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([]);

  const fetchData = React.useCallback(async () => {
    if (!testObjectId || !enabled) return;

    setIsLoading(true);
    setError(null);

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
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('Error loading test object:', error);
      toast.error(t('testObjects.edit.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [testObjectId, enabled, t]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    testObject,
    pictures,
    documents,
    labels,
    isLoading,
    error,
    refetch: fetchData,
  };
}
