/**
 * Format a date according to user preferences
 * @param date - Date object or ISO string
 * @param format - User's preferred date format (e.g., "DD.MM.YYYY")
 * @param timezone - User's timezone (e.g., "Europe/Berlin")
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  format: string = 'DD.MM.YYYY',
  timezone?: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  // Create formatter options based on timezone
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  // Get date parts using Intl
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(dateObj);

  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';

  // Apply format pattern
  switch (format) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    default:
      return `${day}.${month}.${year}`;
  }
}

/**
 * Format a date with time according to user preferences
 * @param date - Date object or ISO string
 * @param format - User's preferred date format
 * @param timezone - User's timezone
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string,
  format: string = 'DD.MM.YYYY',
  timezone?: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(dateObj);

  const day = parts.find((p) => p.type === 'day')?.value || '';
  const month = parts.find((p) => p.type === 'month')?.value || '';
  const year = parts.find((p) => p.type === 'year')?.value || '';
  const hour = parts.find((p) => p.type === 'hour')?.value || '';
  const minute = parts.find((p) => p.type === 'minute')?.value || '';

  let dateString = '';
  switch (format) {
    case 'DD.MM.YYYY':
      dateString = `${day}.${month}.${year}`;
      break;
    case 'MM/DD/YYYY':
      dateString = `${month}/${day}/${year}`;
      break;
    case 'YYYY-MM-DD':
      dateString = `${year}-${month}-${day}`;
      break;
    case 'DD/MM/YYYY':
      dateString = `${day}/${month}/${year}`;
      break;
    default:
      dateString = `${day}.${month}.${year}`;
  }

  return `${dateString} ${hour}:${minute}`;
}

/**
 * Format a relative date (e.g., "2 hours ago")
 * @param date - Date object or ISO string
 * @param locale - User's locale (e.g., "en", "de")
 * @returns Relative time string
 */
export function formatRelativeDate(
  date: Date | string,
  locale: string = 'en'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDay > 0) {
    return rtf.format(-diffDay, 'day');
  } else if (diffHour > 0) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffMin > 0) {
    return rtf.format(-diffMin, 'minute');
  } else {
    return rtf.format(-diffSec, 'second');
  }
}
