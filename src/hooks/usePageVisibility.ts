import { useState, useEffect } from 'react';

function getIsVisible() {
  if (typeof document === 'undefined') return true;
  return !document.hidden;
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(getIsVisible());

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(getIsVisible());

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}