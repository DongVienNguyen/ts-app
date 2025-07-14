import { format, addDays } from 'date-fns';
import { Staff } from '@/types/auth';

// Helper to get the current time value in GMT+7 as a number (e.g., 8:30 AM -> 830)
const getGmt7TimeValue = () => {
  const now = new Date();
  const gmt7Hour = (now.getUTCHours() + 7) % 24;
  const gmt7Minute = now.getUTCMinutes();
  return gmt7Hour * 100 + gmt7Minute;
};

/**
 * Gets the default "parts_day" (buổi) based on the room and current time.
 * @param room The selected room.
 * @returns "Sáng" or "Chiều".
 */
export const getDefaultPartsDay = (room: string): string => {
  const timeValue = getGmt7TimeValue();

  if (timeValue >= 800 && timeValue <= 1245) return "Chiều";
  if (timeValue >= 1300 || timeValue <= 745) {
    if (["QLN", "DVKH"].includes(room)) return "Sáng";
    if (["CMT8", "NS", "ĐS", "LĐH"].includes(room)) return "Chiều";
  }
  return "Sáng";
};

/**
 * Calculates all default values for the asset entry form based on the current user and time.
 * @param staff The current logged-in staff member.
 * @returns An object with default form values.
 */
export const calculateDefaultValues = (staff: Staff) => {
  const now = new Date();
  const gmt7Hour = (now.getUTCHours() + 7) % 24;
  const dayOfWeek = now.getDay(); // Sunday is 0
  let defaultDate = now;

  // If it's Friday after 1 PM, or Saturday, or Sunday, set to next Monday
  if ((dayOfWeek === 5 && gmt7Hour >= 13) || dayOfWeek === 6 || dayOfWeek === 0) {
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    defaultDate = addDays(now, daysUntilMonday);
  } else if (gmt7Hour >= 13 || gmt7Hour < 8) {
    // If it's after 1 PM on a weekday (but not Friday), set to the next day
    defaultDate = gmt7Hour >= 13 ? addDays(now, 1) : now;
  }

  const defaultRoom = ["CMT8", "NS", "ĐS", "LĐH", "QLN", "DVKH"].includes(staff.department || '') ? staff.department || "" : "";
  
  return {
    transaction_date: format(defaultDate, 'yyyy-MM-dd'),
    parts_day: getDefaultPartsDay(defaultRoom),
    room: defaultRoom,
    transaction_type: "",
    note: defaultRoom === 'QLN' ? '' : "Ship PGD"
  };
};