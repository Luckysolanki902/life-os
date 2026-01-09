/**
 * Server-side date utilities for timezone-safe date handling using dayjs
 * 
 * IMPORTANT: All dates are stored in IST (Asia/Kolkata) timezone midnight.
 * Client sends dates as YYYY-MM-DD strings, server converts to IST midnight for storage.
 * 
 * This approach ensures that:
 * 1. Users always see their local date correctly
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
 * Parses a YYYY-MM-DD date string to IST midnight Date object
 * This ensures the date is stored consistently regardless of server timezone
 * @param dateStr - Date string in YYYY-MM-DD format from client
 * @returns Date object set to midnight IST (00:00:00 IST)
 */
export function parseToISTMidnight(dateStr: string): Date {
  // Parse the date string in IST timezone and get the start of day
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).startOf('day').toDate();
}

/**
 * Gets today's date as IST midnight.
 * @returns Date object set to midnight IST for today
 */
export function getTodayISTMidnight(): Date {
  return dayjs().tz(DEFAULT_TIMEZONE).startOf('day').toDate();
}

/**
 * Gets today's date string in YYYY-MM-DD format based on IST timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return dayjs().tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Formats a Date object to YYYY-MM-DD string in IST timezone
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatToDateString(date: Date): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Gets the date range for a day in IST timezone
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Object with startOfDay and endOfDay (exclusive, for $lt queries)
 */
export function getDateRange(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = dayjs.tz(dateStr, DEFAULT_TIMEZONE).startOf('day').toDate();
  const endOfDay = dayjs.tz(dateStr, DEFAULT_TIMEZONE).add(1, 'day').startOf('day').toDate();
  return { startOfDay, endOfDay };
}

/**
 * Gets the day of week (0-6, Sun-Sat) for a date string in IST
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).day();
}

/**
 * Gets today's day of week in IST
 * @returns Day of week (0 = Sunday, 6 = Saturday)
 */
export function getTodayDayOfWeek(): number {
  return dayjs().tz(DEFAULT_TIMEZONE).day();
}

/**
 * Adds days to a date string and returns new date string
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param days - Number of days to add (can be negative)
 * @returns New date string in YYYY-MM-DD format
 */
export function addDays(dateStr: string, days: number): string {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).add(days, 'day').format('YYYY-MM-DD');
}

/**
 * Gets the start of the week (Sunday) for a given date
 * @param dateStr - Date string in YYYY-MM-DD format (optional, defaults to today)
 * @returns Date string in YYYY-MM-DD format
 */
export function getStartOfWeek(dateStr?: string): string {
  const date = dateStr ? dayjs.tz(dateStr, DEFAULT_TIMEZONE) : dayjs().tz(DEFAULT_TIMEZONE);
  return date.startOf('week').format('YYYY-MM-DD');
}

/**
 * Gets the start of the month for a given date
 * @param dateStr - Date string in YYYY-MM-DD format (optional, defaults to today)
 * @returns Date string in YYYY-MM-DD format
 */
export function getStartOfMonth(dateStr?: string): string {
  const date = dateStr ? dayjs.tz(dateStr, DEFAULT_TIMEZONE) : dayjs().tz(DEFAULT_TIMEZONE);
  return date.startOf('month').format('YYYY-MM-DD');
}

/**
 * Formats a date for display (useful for API responses)
 * @param date - Date object or ISO string
 * @returns Formatted string in IST
 */
export function formatForDisplay(date: Date | string): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('ddd, MMM D, YYYY');
}

/**
 * Gets the IST date string from any Date object (handles MongoDB dates)
 * This is crucial for correctly displaying dates that were stored at IST midnight
 * @param date - Date object (e.g., from MongoDB)
 * @returns Date string in YYYY-MM-DD format representing the IST date
 */
export function getISTDateFromDate(date: Date): string {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
}

/**
 * Checks if two dates represent the same day in IST
 * @param date1 - First date (Date object or string)
 * @param date2 - Second date (Date object or string)
 * @returns True if same day in IST
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = dayjs(date1).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
  const d2 = dayjs(date2).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD');
  return d1 === d2;
}

/**
 * Creates a Date object for a specific time on a given date in IST
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @returns Date object representing that time in IST
 */
export function createISTDateTime(dateStr: string, hours: number, minutes: number = 0): Date {
  return dayjs.tz(dateStr, DEFAULT_TIMEZONE).hour(hours).minute(minutes).second(0).millisecond(0).toDate();
}

/**
 * Checks if a date string represents today in IST
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns True if date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

/**
 * Gets dates for the last N days
 * @param n - Number of days
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const today = dayjs().tz(DEFAULT_TIMEZONE);
  for (let i = 0; i < n; i++) {
    dates.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
  }
  return dates;
}

// Re-export dayjs for direct use when needed
export { dayjs };
