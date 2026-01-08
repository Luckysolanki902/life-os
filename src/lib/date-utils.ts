/**
 * Client-side date utilities for timezone-safe date handling
 * 
 * IMPORTANT: All dates sent to the server should be in YYYY-MM-DD format
 * The server will interpret these as UTC midnight dates for consistent storage.
 * 
 * This approach ensures that:
 * 1. A user in any timezone sees the correct date for their location
 * 2. The server stores dates consistently as UTC midnight
 * 3. Date queries work correctly regardless of server timezone
 */

/**
 * Gets today's date as YYYY-MM-DD string in user's local timezone
 * Use this when you need to send the current date to the server
 */
export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone
 * Use this when converting a Date picker value to send to server
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string to a Date object in local timezone
 * Use this when displaying a date from the server in the UI
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a date string for display (e.g., "Mon, Jan 8")
 * Shows "Today" or "Yesterday" for recent dates
 */
export function formatDateForDisplay(dateStr: string, options?: {
  showTodayYesterday?: boolean;
  format?: 'short' | 'long';
}): string {
  const { showTodayYesterday = true, format = 'short' } = options || {};
  
  const date = parseLocalDate(dateStr);
  
  if (showTodayYesterday) {
    const today = getLocalDateString();
    const yesterday = formatDateToString(new Date(Date.now() - 86400000));
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
  }
  
  if (format === 'long') {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

/**
 * Gets the day of week (0-6, Sun-Sat) from a date string
 */
export function getDayOfWeek(dateStr: string): number {
  return parseLocalDate(dateStr).getDay();
}

/**
 * Adds or subtracts days from a date string
 * Returns new date string in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToString(date);
}

/**
 * Checks if a date string is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

/**
 * Checks if a date string is in the past
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getLocalDateString();
}

/**
 * Checks if a date string is in the future
 */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getLocalDateString();
}

/**
 * Gets the start of the current week (Sunday) as YYYY-MM-DD
 */
export function getStartOfWeek(dateStr?: string): string {
  const date = dateStr ? parseLocalDate(dateStr) : new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return formatDateToString(date);
}

/**
 * Gets the start of the current month as YYYY-MM-DD
 */
export function getStartOfMonth(dateStr?: string): string {
  const date = dateStr ? parseLocalDate(dateStr) : new Date();
  date.setDate(1);
  return formatDateToString(date);
}

/**
 * Returns the user's timezone identifier (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
