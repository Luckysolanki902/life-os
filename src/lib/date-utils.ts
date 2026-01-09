/**
 * Client-side date utilities for timezone-safe date handling using dayjs
 * 
 * IMPORTANT: All dates sent to the server should be in YYYY-MM-DD format
 * The server will interpret these in the user's timezone (IST) for consistent storage.
 * 
 * This approach ensures that:
 * 1. A user in any timezone sees the correct date for their location
 * 2. The server stores dates consistently at IST midnight
 * 3. Date queries work correctly regardless of server timezone
 */

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

// Default timezone - India Standard Time
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/**
 * Gets today's date as YYYY-MM-DD string in user's local timezone
 * Use this when you need to send the current date to the server
 */
export function getLocalDateString(): string {
  return dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone
 * Use this when converting a Date picker value to send to server
 */
export function formatDateToString(date: Date): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Parses a YYYY-MM-DD string to a Date object in local timezone
 * Use this when displaying a date from the server in the UI
 */
export function parseLocalDate(dateStr: string): Date {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).toDate();
}

/**
 * Parses an ISO string or Date from MongoDB and returns the local date string
 * Handles timezone conversion properly
 */
export function parseServerDate(date: string | Date): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Formats a date string or Date object for display (e.g., "Mon, Jan 8")
 * Shows "Today" or "Yesterday" for recent dates
 */
export function formatDateForDisplay(dateInput: string | Date, options?: {
  showTodayYesterday?: boolean;
  format?: 'short' | 'long';
  month?: 'short' | 'long' | 'numeric';
  day?: 'numeric' | '2-digit';
}): string {
  const { showTodayYesterday = true, format = 'short', month, day } = options || {};
  
  const date = dayjs(dateInput).tz(DEFAULT_TIMEZONE);
  const dateStr = date.format('YYYY-MM-DD');
  
  if (showTodayYesterday) {
    const today = getLocalDateString();
    const yesterday = dayjs().tz(DEFAULT_TIMEZONE).subtract(1, 'day').format('YYYY-MM-DD');
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
  }
  
  // Support custom format options
  if (month || day) {
    if (month === 'short' && day === 'numeric') {
      return date.format('MMM D');
    }
    if (month === 'long' && day === 'numeric') {
      return date.format('MMMM D');
    }
  }
  
  if (format === 'long') {
    return date.format('dddd, MMMM D, YYYY');
  }
  
  return date.format('ddd, MMM D');
}

/**
 * Gets the day of week (0-6, Sun-Sat) from a date string
 */
export function getDayOfWeek(dateStr: string): number {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).day();
}

/**
 * Adds or subtracts days from a date string
 * Returns new date string in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).add(days, 'day').format('YYYY-MM-DD');
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
  const date = dateStr ? dayjs.tz(dateStr, DEFAULT_TIMEZONE) : dayjs().tz(DEFAULT_TIMEZONE);
  return date.startOf('week').format('YYYY-MM-DD');
}

/**
 * Gets the start of the current month as YYYY-MM-DD
 */
export function getStartOfMonth(dateStr?: string): string {
  const date = dateStr ? dayjs.tz(dateStr, DEFAULT_TIMEZONE) : dayjs().tz(DEFAULT_TIMEZONE);
  return date.startOf('month').format('YYYY-MM-DD');
}

/**
 * Returns the user's timezone identifier (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  return DEFAULT_TIMEZONE;
}

/**
 * Format a server date/time for display with time
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('MMM D, YYYY h:mm A');
}

/**
 * Get the current dayjs instance in the default timezone
 */
export function now(): dayjs.Dayjs {
  return dayjs().tz(DEFAULT_TIMEZONE);
}

/**
 * Create a dayjs instance from a date string in the default timezone
 */
export function fromDateString(dateStr: string): dayjs.Dayjs {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE);
}

// Re-export dayjs for direct use when needed
export { dayjs };
