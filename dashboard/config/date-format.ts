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

  // Standard date format: 15. Januar 2025
  dateOptions: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  },

  // Date with time: 15. Januar 2025, 14:30
  dateTimeOptions: {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },

  // Short date for tables: 15.01.2025
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
};

/**
 * Alternative format presets that users can choose from
 */
export const dateFormatPresets: Record<string, DateFormatConfig> = {
  'de-DE': {
    locale: 'de-DE',
    dateOptions: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    dateTimeOptions: {
      day: 'numeric',
      month: 'long',
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
  },

  'en-US': {
    locale: 'en-US',
    dateOptions: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
    dateTimeOptions: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
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
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  },

  'en-GB': {
    locale: 'en-GB',
    dateOptions: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    dateTimeOptions: {
      day: 'numeric',
      month: 'long',
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
  },
};

/**
 * Get the current date format configuration
 *
 * @returns The active date format configuration
 *
 * TODO: Implement user preference loading
 * - Check for user-specific setting in database
 * - Fall back to default if not set
 */
export function getDateFormatConfig(): DateFormatConfig {
  // TODO: Load from user preferences
  // const userPreference = await getUserDateFormatPreference();
  // return dateFormatPresets[userPreference] || defaultDateFormatConfig;

  return defaultDateFormatConfig;
}
