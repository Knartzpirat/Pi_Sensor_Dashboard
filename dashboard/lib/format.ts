export function formatDate(
  date: Date | string | number,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opts,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'gerade eben';
  if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min.`;
  if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std.`;
  if (diffInSeconds < 604800) return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`;

  return formatDate(date);
}
