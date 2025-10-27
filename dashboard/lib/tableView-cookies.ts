// lib/tableViewCookies.ts
export function saveTableViewToCookie(key: string, data: unknown) {
  try {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(
      JSON.stringify(data)
    )}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 Tage
  } catch (err) {
    console.error('Failed to save table view to cookie', err);
  }
}

export function loadTableViewFromCookie<T>(key: string): T | null {
  try {
    const match = document.cookie.match(
      new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]+)')
    );
    if (!match) return null;
    return JSON.parse(decodeURIComponent(match[2]));
  } catch (err) {
    console.error('Failed to load table view from cookie', err);
    return null;
  }
}
