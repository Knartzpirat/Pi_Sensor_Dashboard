import { getDateFormatConfig } from '@/config/date-format';

/**
 * Format types for different date display needs
 */
export type DateFormatType = 'date' | 'dateTime' | 'short' | 'long' | 'time' | 'custom';

/**
 * Locale-specific date/time separators
 * Maps locale codes to their separator words
 */
const LOCALE_SEPARATORS: Record<string, string> = {
  'de': 'um',
  'de-DE': 'um',
  'de-AT': 'um',
  'de-CH': 'um',
  'en': 'at',
  'en-US': 'at',
  'en-GB': 'at',
  'en-CA': 'at',
  'en-AU': 'at',
};

/**
 * Get the date/time separator for a given locale
 * @param locale - Optional locale string (e.g., 'de', 'en-US')
 * @returns The separator word for the locale
 */
function getLocaleSeparator(locale?: string): string {
  // If locale is provided, use it directly
  if (locale) {
    // Check exact match first
    if (LOCALE_SEPARATORS[locale]) {
      return LOCALE_SEPARATORS[locale];
    }
    // Check language code (e.g., 'de' from 'de-DE')
    const langCode = locale.split('-')[0];
    if (LOCALE_SEPARATORS[langCode]) {
      return LOCALE_SEPARATORS[langCode];
    }
  }

  // Try to get the locale from the document's lang attribute (set by next-intl)
  if (typeof document !== 'undefined') {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      // Check exact match first
      if (LOCALE_SEPARATORS[htmlLang]) {
        return LOCALE_SEPARATORS[htmlLang];
      }
      // Check language code (e.g., 'de' from 'de-DE')
      const langCode = htmlLang.split('-')[0];
      if (LOCALE_SEPARATORS[langCode]) {
        return LOCALE_SEPARATORS[langCode];
      }
    }
  }

  // Fallback to 'at' for unknown locales
  return 'at';
}

/**
 * Format a date according to the user's configured preferences
 *
 * @param date - The date to format (Date object, string, or timestamp)
 * @param formatType - The type of formatting to apply (default: 'date')
 * @param opts - Optional custom Intl.DateTimeFormatOptions to override defaults
 * @param locale - Optional locale string (e.g., 'de', 'en') for determining separator
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // Uses default date format
 * formatDate(new Date(), 'short') // Uses short format for tables
 * formatDate(new Date(), 'dateTime') // Includes time with "at" or "um"
 * formatDate(new Date(), 'custom', { month: 'short' }) // Custom options
 * formatDate(new Date(), 'dateTime', {}, 'de') // Force German separator "um"
 */
export function formatDate(
  date: Date | string | number | undefined,
  formatType: DateFormatType = 'date',
  opts: Intl.DateTimeFormatOptions = {},
  locale?: string,
) {
  if (!date) return "";

  try {
    const config = getDateFormatConfig();
    const dateObj = new Date(date);
    let formatOptions: Intl.DateTimeFormatOptions;

    // Select format options based on type
    switch (formatType) {
      case 'dateTime':
        // Format date and time separately with custom separator
        // Use the configured date format from settings
        const dateOptionsForDateTime = config.dateOptions;

        const timeOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        } as Intl.DateTimeFormatOptions;

        const datePart = new Intl.DateTimeFormat(config.locale, dateOptionsForDateTime).format(dateObj);
        const timePart = new Intl.DateTimeFormat(config.locale, timeOptions).format(dateObj);

        // Get separator based on current locale (language), not date format
        const separator = getLocaleSeparator(locale);

        return `${datePart} ${separator} ${timePart}`;

      case 'short':
        formatOptions = config.shortDateOptions;
        break;
      case 'long':
        formatOptions = config.longDateOptions;
        break;
      case 'time':
        formatOptions = config.timeOptions;
        break;
      case 'custom':
        formatOptions = opts;
        break;
      case 'date':
      default:
        formatOptions = config.dateOptions;
        break;
    }

    // For non-dateTime formats, use standard formatting
    if (formatType !== 'dateTime') {
      const finalOptions = formatType === 'custom' ? opts : { ...formatOptions, ...opts };
      return new Intl.DateTimeFormat(config.locale, finalOptions).format(dateObj);
    }

    return "";
  } catch (_err) {
    return "";
  }
}
