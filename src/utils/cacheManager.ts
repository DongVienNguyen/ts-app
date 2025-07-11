interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      cleanupInterval: 60 * 1000, // 1 minute
      ...config
    };

    this.startCleanup();
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      key
    };

    this.cache.set(key, item);
    console.log(`🗄️ Cache SET: ${key} (TTL: ${item.ttl}ms)`);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      console.log(`🗄️ Cache MISS: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      console.log(`🗄️ Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`🗄️ Cache HIT: ${key}`);
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗄️ Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    console.log('🗄️ Cache CLEARED');
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    this.cache.forEach(item => {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        active++;
      }
    });

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗄️ Cache EVICTED: ${oldestKey}`);
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`🗄️ Cache CLEANUP: Removed ${keysToDelete.length} expired items`);
    }
  }

  private calculateHitRate(): number {
    // This would need to be implemented with hit/miss counters
    return 0;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Create global cache instances
export const dataCache = new CacheManager({
  defaultTTL: 5 * 60 * 1000, // 5 minutes for data
  maxSize: 50
});

export const uiCache = new CacheManager({
  defaultTTL: 30 * 60 * 1000, // 30 minutes for UI state
  maxSize: 20
});

export const apiCache = new CacheManager({
  defaultTTL: 2 * 60 * 1000, // 2 minutes for API responses
  maxSize: 100
});

// Cache utilities
export const createCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Try to get from cache first
  const cached = apiCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetcher();
  apiCache.set(key, data, ttl);
  return data;
};