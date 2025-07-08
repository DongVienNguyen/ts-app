import { useState, useEffect } from 'react';
import { TIME_RESTRICTIONS } from '@/config';

export function useTimeRestriction() {
  const [isRestrictedTime, setIsRestrictedTime] = useState(false);

  useEffect(() => {
    const checkTimeRestriction = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;

      const isRestricted = TIME_RESTRICTIONS.restrictedHours.some(
        restriction => currentHour >= restriction.start && currentHour <= restriction.end
      );

      setIsRestrictedTime(isRestricted);
    };

    // Check immediately
    checkTimeRestriction();

    // Check every minute
    const interval = setInterval(checkTimeRestriction, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    isRestrictedTime,
  };
}