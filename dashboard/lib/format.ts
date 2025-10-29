import { getDateFormatConfig } from '@/config/date-format';

/**
 * Format types for different date display needs
 */
export type DateFormatType = 'date' | 'dateTime' | 'short' | 'long' | 'time' | 'custom';

/**
 * Format a date according to the user's configured preferences
 *
 * @param date - The date to format (Date object, string, or timestamp)
 * @param formatType - The type of formatting to apply (default: 'date')
 * @param opts - Optional custom Intl.DateTimeFormatOptions to override defaults
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date()) // Uses default date format
 * formatDate(new Date(), 'short') // Uses short format for tables
 * formatDate(new Date(), 'dateTime') // Includes time
 * formatDate(new Date(), 'custom', { month: 'short' }) // Custom options
 */
export function formatDate(
  date: Date | string | number | undefined,
  formatType: DateFormatType = 'date',
  opts: Intl.DateTimeFormatOptions = {},
) {
  if (!date) return "";

  try {
    const config = getDateFormatConfig();
    let formatOptions: Intl.DateTimeFormatOptions;

    // Select format options based on type
    switch (formatType) {
      case 'dateTime':
        formatOptions = config.dateTimeOptions;
        break;
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

    // Merge with custom options if provided (custom options take precedence)
    const finalOptions = formatType === 'custom' ? opts : { ...formatOptions, ...opts };

    return new Intl.DateTimeFormat(config.locale, finalOptions).format(new Date(date));
  } catch (_err) {
    return "";
  }
}
