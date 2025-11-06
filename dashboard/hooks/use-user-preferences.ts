'use client';

import { useEffect, useState } from 'react';

interface UserPreferences {
  dateFormat: string;
  timezone: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dateFormat: 'DD.MM.YYYY',
  timezone: 'Europe/Berlin',
};

/**
 * Hook to fetch and cache user preferences
 * @returns User preferences with date format and timezone
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch('/api/user/preferences');

        if (response.ok) {
          const data = await response.json();
          setPreferences({
            dateFormat: data.dateFormat || DEFAULT_PREFERENCES.dateFormat,
            timezone: data.timezone || DEFAULT_PREFERENCES.timezone,
          });
        }
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        // Keep default preferences on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreferences();
  }, []);

  return { preferences, isLoading };
}
