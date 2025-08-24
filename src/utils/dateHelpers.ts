import { Timestamp } from 'firebase/firestore';
import logger from '../lib/logger';

/**
 * Converts Firebase Timestamp, Date, or string to Date object
 */
export function toDate(
  timestamp: Timestamp | Date | string | null | undefined
): Date {
  if (!timestamp) {
    return new Date();
  }

  // Handle serverTimestamp (Firestore server timestamp)
  if (
    timestamp &&
    typeof timestamp === 'object' &&
    '_methodName' in timestamp &&
    timestamp._methodName === 'serverTimestamp'
  ) {
    // serverTimestamp is not yet resolved, return current date silently
    return new Date();
  }

  if (timestamp instanceof Date) {
    // Check if the Date is valid
    if (isNaN(timestamp.getTime())) {
      logger.debug('dateHelpers', 'invalid Date object', timestamp);
      return new Date();
    }
    return timestamp;
  }

  if (timestamp instanceof Timestamp) {
    try {
      const date = timestamp.toDate();
      // Check if the converted Date is valid
      if (isNaN(date.getTime())) {
        logger.debug('dateHelpers', 'invalid Timestamp', timestamp);
        return new Date();
      }
      return date;
    } catch (error) {
      logger.debug('dateHelpers', 'timestamp->date failed', {
        error,
        timestamp,
      });
      return new Date();
    }
  }

  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      // Check if the parsed Date is valid
      if (isNaN(date.getTime())) {
        logger.debug('dateHelpers', 'invalid date string', timestamp);
        return new Date();
      }
      return date;
    } catch (error) {
      logger.debug('dateHelpers', 'parse date string failed', {
        error,
        timestamp,
      });
      return new Date();
    }
  }

  // Fallback for any other type
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      logger.debug('dateHelpers', 'invalid timestamp value', timestamp);
      return new Date();
    }
    return date;
  } catch (error) {
    logger.debug('dateHelpers', 'create Date from timestamp failed', {
      error,
      timestamp,
    });
    return new Date();
  }
}

/**
 * Checks if a timestamp/date is today
 */
export function isToday(
  timestamp: Timestamp | Date | string | null | undefined
): boolean {
  const date = toDate(timestamp);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a timestamp/date is within the last N days
 */
export function isWithinDays(
  timestamp: Timestamp | Date | string | null | undefined,
  days: number
): boolean {
  const date = toDate(timestamp);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return date >= cutoff;
}

/**
 * Gets the start of today
 */
export function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Gets the start of current week (Sunday)
 */
export function getStartOfWeek(): Date {
  const today = getStartOfToday();
  return new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
}

/**
 * Gets the start of current month
 */
export function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Converts reminder time string to minutes
 */
export function parseReminderToMinutes(reminder: string): number {
  const timeMap: Record<string, number> = {
    '10분 전': 10,
    '30분 전': 30,
    '1시간 전': 60,
    '1일 전': 1440,
    '1주일 전': 10080,
  };

  return timeMap[reminder] || 0;
}

/**
 * Converts minutes to reminder time string
 */
export function minutesToReminderString(minutes: number): string {
  const timeMap: Record<number, string> = {
    10: '10분 전',
    30: '30분 전',
    60: '1시간 전',
    1440: '1일 전',
    10080: '1주일 전',
  };

  return timeMap[minutes] || `${minutes}분 전`;
}

/**
 * Converts Date/string/Timestamp to Firestore Timestamp (or undefined)
 */
export function toTimestamp(
  input?: Date | string | Timestamp | null
): Timestamp | undefined {
  if (!input) return undefined;
  if (input instanceof Timestamp) return input;
  try {
    const d = typeof input === 'string' ? new Date(input) : (input as Date);
    if (d instanceof Date && !isNaN(d.getTime())) {
      return Timestamp.fromDate(d);
    }
    return undefined;
  } catch (error) {
    logger.debug('dateHelpers', 'toTimestamp convert failed', { error, input });
    return undefined;
  }
}
