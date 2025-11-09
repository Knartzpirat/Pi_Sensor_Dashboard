import * as React from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface TestObject {
  title?: string;
  description?: string | null;
  labelIds?: string[];
}

interface UseMutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Custom Hook for test object update operations
 */
export function useTestObjectMutations(
  testObjectId: string | null,
  currentData: TestObject,
  options?: UseMutationOptions
) {
  const t = useTranslations();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const updateTestObject = React.useCallback(
    async (updates: Partial<TestObject>) => {
      if (!testObjectId) return null;

      setIsUpdating(true);
      try {
        const response = await fetch(`/api/test-objects/${testObjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...currentData,
            ...updates,
          }),
        });

        if (!response.ok) throw new Error('Failed to update test object');

        const data = await response.json();
        toast.success(t('testObjects.edit.success'));
        options?.onSuccess?.();
        return data;
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Update failed');
        console.error('Error updating test object:', err);
        toast.error(t('testObjects.edit.error'));
        options?.onError?.(err);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [testObjectId, currentData, options, t]
  );

  const updateTitle = React.useCallback(
    async (newTitle: string) => {
      if (!newTitle.trim()) return null;
      return updateTestObject({ title: newTitle });
    },
    [updateTestObject]
  );

  const updateDescription = React.useCallback(
    async (newDescription: string) => {
      return updateTestObject({ description: newDescription || null });
    },
    [updateTestObject]
  );

  const updateLabel = React.useCallback(
    async (newLabelIds: string[]) => {
      return updateTestObject({ labelIds: newLabelIds });
    },
    [updateTestObject]
  );

  return {
    updateTitle,
    updateDescription,
    updateLabel,
    isUpdating,
  };
}
