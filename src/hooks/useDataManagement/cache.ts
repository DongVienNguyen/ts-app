import { useRef, useCallback } from 'react';
import { CacheEntry } from './types'; // Import CacheEntry

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const createDataCache = () => {
  const dataCache = useRef<Map<string, CacheEntry>>(new Map());

  const getCachedData = useCallback((key: string): CacheEntry | null => {
    const cached = dataCache.current.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any[], count: number) => {
    dataCache.current.set(key, {
      data,
      count,
      timestamp: Date.now()
    });
  }, []);

  const clearCache = useCallback(() => {
    dataCache.current.clear();
  }, []);

  const clearEntityCache = useCallback((entity: string) => {
    const keysToDelete = Array.from(dataCache.current.keys()).filter(key => 
      key.startsWith(entity)
    );
    keysToDelete.forEach(key => dataCache.current.delete(key));
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    clearEntityCache
  };
};