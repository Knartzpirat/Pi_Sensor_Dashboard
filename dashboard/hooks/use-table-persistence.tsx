import * as React from 'react';
import {
  loadTableViewFromCookie,
  saveTableViewToCookie,
} from '@/lib/tableView-cookies';

/**
 * Custom Hook for persisting table state (column visibility, etc.) to cookies
 */
export function useTablePersistence<T = Record<string, boolean>>(
  key: string,
  defaultValue: T = {} as T
) {
  // Load saved state from cookies
  const savedState = React.useMemo(() => {
    if (typeof window === 'undefined') return defaultValue;
    return loadTableViewFromCookie<T>(key) ?? defaultValue;
  }, [key, defaultValue]);

  // Save state to cookies
  const saveState = React.useCallback(
    (state: T) => {
      if (typeof window === 'undefined') return;
      saveTableViewToCookie(key, state);
    },
    [key]
  );

  return {
    savedState,
    saveState,
  };
}

/**
 * Hook to automatically persist table column visibility
 */
export function useColumnVisibilityPersistence(
  key: string,
  columnVisibility: Record<string, boolean>
) {
  const { saveState } = useTablePersistence(key);
  const columnVisibilityJson = JSON.stringify(columnVisibility);

  React.useEffect(() => {
    saveState(columnVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnVisibilityJson, saveState]);
}
