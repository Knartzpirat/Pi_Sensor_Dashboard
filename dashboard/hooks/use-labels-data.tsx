import * as React from 'react';

interface Label {
  id: string;
  name: string;
  color: string | null;
}

/**
 * Custom Hook for loading and caching labels data
 */
export function useLabelsData(type: string = 'TEST_OBJECT') {
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const fetchLabels = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/labels?type=${type}`);
      if (!response.ok) throw new Error('Failed to load labels');
      const data = await response.json();
      setLabels(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Error loading labels:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  React.useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return {
    labels,
    isLoading,
    error,
    refetch: fetchLabels,
  };
}
