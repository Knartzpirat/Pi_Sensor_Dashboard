'use client';

import { useEffect } from 'react';
import { setUserDateFormatPreference } from '@/config/date-format';

/**
 * Provider component that loads and caches user preferences on app initialization
 * This ensures date formatting preferences are applied globally
 */
export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    async function loadUserPreferences() {
      try {
        const response = await fetch('/api/user/preferences');

        if (response.ok) {
          const data = await response.json();

          // Set the date format preference globally
          if (data.dateFormat) {
            setUserDateFormatPreference(data.dateFormat);
          }

          // Trigger a re-render to apply the new format
          // This is done by forcing a state update in components that use formatDate
          window.dispatchEvent(new Event('userPreferencesLoaded'));
        }
      } catch (error) {
        console.error('Error loading user preferences:', error);
        // Continue with default preferences
      }
    }

    loadUserPreferences();
  }, []);

  return <>{children}</>;
}
