import {
  isValid,
  formatDistanceToNow,
  format,
  addDays,
  isWeekend,
  startOfDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isPast,
  isSameDay,
  isBefore,
} from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(dateObj)) {
      return 'Thời gian không hợp lệ';
    }
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: vi });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return 'Không rõ';
  }
};

export const formatToDDMMYYYY = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(dateObj)) {
    return 'Ngày không hợp lệ';
  }
  return format(dateObj, 'dd/MM/yyyy', { locale: vi });
};

export const getGMTPlus7Date = (): Date => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60 * 1000; // offset in milliseconds
  const utc = now.getTime() + offset;
  const gmt7 = new Date(utc + (7 * 60 * 60 * 1000)); // Add 7 hours for GMT+7
  return gmt7;
};

export const getDateBasedOnTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  let date = new Date();
  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  date = setSeconds(date, 0);
  date = setMilliseconds(date, 0);
  return date;
};

export const getNextWorkingDay = (date: Date): Date => {
  let nextDay = addDays(date, 1);
  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

export const getDefaultEndDate = (): Date => {
  return startOfDay(new Date());
};

export const isDayMonthDueOrOverdue = (dayMonth: string, referenceDate: Date = new Date()): boolean => {
  const [day, month] = dayMonth.split('/').map(Number);
  if (isNaN(day) || isNaN(month)) {
    return false;
  }

  const currentYear = referenceDate.getFullYear();
  let targetDate = new Date(currentYear, month - 1, day);

  if (isBefore(targetDate, startOfDay(referenceDate)) && !isSameDay(targetDate, startOfDay(referenceDate))) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }

  return isPast(targetDate) || isSameDay(targetDate, startOfDay(referenceDate));
};