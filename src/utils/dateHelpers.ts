import { Timestamp } from 'firebase/firestore';

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
      console.debug('Invalid Date object provided to toDate:', timestamp);
      return new Date();
    }
    return timestamp;
  }

  if (timestamp instanceof Timestamp) {
    try {
      const date = timestamp.toDate();
      // Check if the converted Date is valid
      if (isNaN(date.getTime())) {
        console.debug('Invalid Timestamp provided to toDate:', timestamp);
        return new Date();
      }
      return date;
    } catch (error) {
      console.debug('Error converting Timestamp to Date:', error, timestamp);
      return new Date();
    }
  }

  if (typeof timestamp === 'string') {
    try {
      const date = new Date(timestamp);
      // Check if the parsed Date is valid
      if (isNaN(date.getTime())) {
        console.debug('Invalid date string provided to toDate:', timestamp);
        return new Date();
      }
      return date;
    } catch (error) {
      console.debug('Error parsing date string:', error, timestamp);
      return new Date();
    }
  }

  // Fallback for any other type
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      console.debug('Invalid timestamp value provided to toDate:', timestamp);
      return new Date();
    }
    return date;
  } catch (error) {
    console.debug('Error creating Date from timestamp:', error, timestamp);
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
