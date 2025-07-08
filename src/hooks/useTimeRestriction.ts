import { useState, useEffect } from 'react';

export function useTimeRestriction() {
  const [isRestrictedTime, setIsRestrictedTime] = useState(false);

  useEffect(() => {
    const checkTimeRestriction = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = hours * 60 + minutes; // Convert to minutes since midnight

      // Restricted times: 7:45-8:05 and 12:45-13:05
      const morningStart = 7 * 60 + 45; // 7:45
      const morningEnd = 8 * 60 + 5;    // 8:05
      const noonStart = 12 * 60 + 45;   // 12:45
      const noonEnd = 13 * 60 + 5;      // 13:05

      const isRestricted = 
        (currentTime >= morningStart && currentTime <= morningEnd) ||
        (currentTime >= noonStart && currentTime <= noonEnd);

      setIsRestrictedTime(isRestricted);
    };

    // Check immediately
    checkTimeRestriction();

    // Check every minute
    const interval = setInterval(checkTimeRestriction, 60000);

    return () => clearInterval(interval);
  }, []);

  return { isRestrictedTime };
}