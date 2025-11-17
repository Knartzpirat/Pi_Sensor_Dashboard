/**
 * Date Format Configuration
 *
 * This file contains the default date and time format settings.
 * In the future, these settings can be made user-configurable
 * through a settings page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
 */

export type DateFormatConfig = {
  /**
   * The locale to use for date formatting
   * Examples: 'en-US', 'de-DE', 'fr-FR', 'ja-JP'
   */
  locale: string;

  /**
   * Default options for date formatting
   */
  dateOptions: Intl.DateTimeFormatOptions;

  /**
   * Options for date with time formatting
   */
  dateTimeOptions: Intl.DateTimeFormatOptions;

  /**
   * Options for short date formatting (e.g., in tables)
   */
  shortDateOptions: Intl.DateTimeFormatOptions;

  /**
   * Options for long date formatting (e.g., in details)
   */
  longDateOptions: Intl.DateTimeFormatOptions;

  /**
   * Options for time only formatting
   */
  timeOptions: Intl.DateTimeFormatOptions;

  /**
   * Separator word between date and time (e.g., "at" in English, "um" in German)
   */
  dateTimeSeparator: string;
};

/**
 * Default date format configuration
 *
 * TODO: Make this configurable per user in settings
 * - Add database table for user preferences
 * - Create settings UI for date format selection
 * - Load user preference on app initialization
 */
export const defaultDateFormatConfig: DateFormatConfig = {
  locale: 'de-DE', // Default to German locale

  // Standard date format: 11.11.2025 (short format for tables and display)
  dateOptions: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },

  // Date with time: 11.11.2025, 14:30
  dateTimeOptions: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },

  // Short date for tables: 11.11.2025
  shortDateOptions: {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },

  // Long date for details: Montag, 15. Januar 2025
  longDateOptions: {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },

  // Time only: 14:30
  timeOptions: {
    hour: '2-digit',
    minute: '2-digit',
  },

  // Separator between date and time
  dateTimeSeparator: 'um',
};

/**
 * Alternative format presets that users can choose from
 */
export const dateFormatPresets: Record<string, DateFormatConfig> = {
  'de-DE': {
    locale: 'de-DE',
    dateOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    dateTimeOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    shortDateOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    longDateOptions: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    timeOptions: {
      hour: '2-digit',
      minute: '2-digit',
    },
    dateTimeSeparator: 'um',
  },

  'en-US': {
    locale: 'en-US',
    dateOptions: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    },
    dateTimeOptions: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    shortDateOptions: {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    },
    longDateOptions: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
    timeOptions: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    dateTimeSeparator: 'at',
  },

  'en-GB': {
    locale: 'en-GB',
    dateOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    dateTimeOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
    shortDateOptions: {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
    longDateOptions: {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    timeOptions: {
      hour: '2-digit',
      minute: '2-digit',
    },
    dateTimeSeparator: 'at',
  },

  'ISO-8601': {
    locale: 'en-CA', // en-CA uses ISO 8601 format
    dateOptions: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    dateTimeOptions: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
    shortDateOptions: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    longDateOptions: {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    },
    timeOptions: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    },
    dateTimeSeparator: 'at',
  },
};

// Client-side cache for user preferences
let cachedUserPreferences: DateFormatConfig | null = null;

/**
 * Set the user's date format preference (called from client components)
 *
 * @param dateFormat - User's preferred date format (e.g., "DD.MM.YYYY")
 */
export function setUserDateFormatPreference(dateFormat: string): void {
  // Map user's format string to locale preset
  const localeMap: Record<string, string> = {
    'DD.MM.YYYY': 'de-DE',
    'DD/MM/YYYY': 'en-GB',
    'MM/DD/YYYY': 'en-US',
    'YYYY-MM-DD': 'ISO-8601',
  };

  const locale = localeMap[dateFormat] || 'de-DE';
  cachedUserPreferences = dateFormatPresets[locale] || defaultDateFormatConfig;
}

/**
 * Get the current date format configuration
 *
 * @returns The active date format configuration
 */
export function getDateFormatConfig(): DateFormatConfig {
  // Return cached user preference if available
  if (cachedUserPreferences) {
    return cachedUserPreferences;
  }

  // Fall back to default
  return defaultDateFormatConfig;
}
