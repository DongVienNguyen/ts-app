import { format, isToday, isYesterday, differenceInDays, formatDistanceToNowStrict, addDays, startOfWeek, endOfWeek, getWeek, getYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Tables } from '@/integrations/supabase/types';

type Notification = Tables<'notifications'>;

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNowStrict(date, { addSuffix: true, locale: vi });
  } catch (error) {
    console.error("Invalid date string for formatRelativeTime:", dateString);
    return "Thời gian không hợp lệ";
  }
}

export const groupNotificationsByDate = (notifications: Notification[]): Record<string, Notification[]> => {
  const groups: Record<string, Notification[]> = {
    'Hôm nay': [],
    'Hôm qua': [],
    'Tuần này': [],
    'Tháng này': [],
    'Cũ hơn': [],
  };

  notifications.forEach(notification => {
    if (!notification.created_at) return;
    const date = new Date(notification.created_at);
    if (isToday(date)) {
      groups['Hôm nay'].push(notification);
    } else if (isYesterday(date)) {
      groups['Hôm qua'].push(notification);
    } else if (differenceInDays(new Date(), date) <= 7) {
      groups['Tuần này'].push(notification);
    } else if (differenceInDays(new Date(), date) <= 30) {
      groups['Tháng này'].push(notification);
    } else {
      groups['Cũ hơn'].push(notification);
    }
  });

  return groups;
};

export const getMorningTargetDate = (): Date => {
    const now = new Date();
    // Use GMT+7 for time check by getting the hour in that timezone
    const gmt7Hour = parseInt(format(now, 'H', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const gmt7Minute = now.getMinutes();
    const timeValue = gmt7Hour * 100 + gmt7Minute;

    // From 08:06 onwards, target is the next working day
    if (timeValue >= 806) {
        return getNextWorkingDay(now);
    }
    // Before 08:06, target is the current day
    return now;
}

export const getCurrentWeekYear = (): string => {
  const now = new Date();
  const year = getYear(now);
  const week = getWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
  return `${year}-${String(week).padStart(2, '0')}`;
};

export const getGMTPlus7Date = (): Date => {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset();
  const gmtPlus7Offset = -420; // 7 hours * 60 minutes
  return new Date(now.getTime() + (gmtPlus7Offset - utcOffset) * 60 * 1000);
};

export const getDateBasedOnTime = (time: string): Date => {
  const gmtPlus7Date = getGMTPlus7Date();
  const [hours, minutes] = time.split(':').map(Number);
  const targetDate = new Date(gmtPlus7Date);
  targetDate.setHours(hours, minutes, 0, 0);
  return targetDate;
};

export const getNextWorkingDay = (date: Date): Date => {
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);
  const dayOfWeek = nextDay.getDay();
  if (dayOfWeek === 6) { // Saturday
    nextDay.setDate(nextDay.getDate() + 2);
  } else if (dayOfWeek === 0) { // Sunday
    nextDay.setDate(nextDay.getDate() + 1);
  }
  return nextDay;
};

export const getDefaultEndDate = (): Date => {
  const date = getGMTPlus7Date();
  date.setMonth(date.getMonth() + 3);
  return date;
};

export const formatToDDMMYYYY = (date: Date | string): string => {
  if (!date) return '';
  try {
    return format(new Date(date), 'dd/MM/yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
};

export const isDayMonthDueOrOverdue = (dayMonth: string): boolean => {
  if (!/^\d{2}-\d{2}$/.test(dayMonth)) return false;
  const [day, month] = dayMonth.split('-').map(Number);
  const today = getGMTPlus7Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1;
  if (currentMonth > month) return true;
  if (currentMonth === month && currentDay >= day) return true;
  return false;
};