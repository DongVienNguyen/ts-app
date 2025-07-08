import { format, parse, isValid, addDays, subDays, startOfDay, endOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';

export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, formatStr, { locale: vi });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatToDDMMYYYY(date: Date | string | null): string {
  if (!date) return '';
  return formatDate(date, 'dd/MM/yyyy');
}

export function formatDateTime(date: Date | string, formatStr: string = 'dd/MM/yyyy HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, formatStr, { locale: vi });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
}

export function getGMTPlus7Date(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 3600000));
}

export function getNextWorkingDay(date: Date): Date {
  const nextDay = addDays(date, 1);
  const dayOfWeek = nextDay.getDay();
  
  // If it's Saturday (6) or Sunday (0), move to Monday
  if (dayOfWeek === 6) {
    return addDays(nextDay, 2);
  } else if (dayOfWeek === 0) {
    return addDays(nextDay, 1);
  }
  
  return nextDay;
}

export function getDateBasedOnTime(): Date {
  const now = getGMTPlus7Date();
  const hour = now.getHours();
  
  // If after 13:00, return next working day, otherwise return today
  if (hour >= 13) {
    return getNextWorkingDay(now);
  }
  
  return now;
}

export function getDefaultEndDate(): Date {
  return addDays(getGMTPlus7Date(), 7);
}

export function getTransactionDateRules() {
  const now = getGMTPlus7Date();
  const defaultDate = formatDateForInput(now);
  const disabledBefore = subDays(now, 30);
  
  return {
    defaultDate,
    disabledBefore
  };
}

export function isDayMonthDueOrOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Parse DD-MM format
    const [day, month] = dateStr.split('-').map(Number);
    if (!day || !month || month > 12 || day > 31) return false;
    
    // Create date for current year
    const targetDate = new Date(currentYear, month - 1, day);
    
    // If the date has passed this year, check next year
    if (targetDate < now) {
      const nextYearDate = new Date(currentYear + 1, month - 1, day);
      return nextYearDate <= addDays(now, 30); // Due within 30 days
    }
    
    return targetDate <= addDays(now, 30); // Due within 30 days
  } catch (error) {
    console.error('Error checking due date:', error);
    return false;
  }
}

export function parseDate(dateStr: string, formatStr: string = 'dd/MM/yyyy'): Date | null {
  try {
    const parsed = parse(dateStr, formatStr, new Date(), { locale: vi });
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}

export function isValidDateString(dateStr: string, formatStr: string = 'dd/MM/yyyy'): boolean {
  try {
    const parsed = parse(dateStr, formatStr, new Date(), { locale: vi });
    return isValid(parsed);
  } catch (error) {
    return false;
  }
}

export function getCurrentDate(): string {
  return formatDate(new Date());
}

export function getCurrentDateTime(): string {
  return formatDateTime(new Date());
}

export function addDaysToDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return addDays(dateObj, days);
}

export function subtractDaysFromDate(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return subDays(dateObj, days);
}

export function getStartOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return startOfDay(dateObj);
}

export function getEndOfDay(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return endOfDay(dateObj);
}

export function formatDateForInput(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}

export function formatDateTimeForInput(date: Date | string): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      return '';
    }
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Error formatting datetime for input:', error);
    return '';
  }
}

export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
}

export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
}

export function getDaysDifference(date1: Date | string, date2: Date | string): number {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const timeDiff = dateObj2.getTime() - dateObj1.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Vừa xong';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    return formatDate(dateObj);
  }
}