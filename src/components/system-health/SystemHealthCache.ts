import { SystemHealth } from './types';

interface CacheEntry {
  data: SystemHealth;
  timestamp: number;
  ttl: number;
}

export class SystemHealthCache {
  private static instance: SystemHealthCache;
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  static getInstance(): SystemHealthCache {
    if (!SystemHealthCache.instance) {
      SystemHealthCache.instance = new SystemHealthCache();
    }
    return SystemHealthCache.instance;
  }

  set(key: string, data: SystemHealth, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(key, entry);
    console.log(`🗄️ SystemHealthCache: Cached data for key "${key}" with TTL ${ttl}ms`);
  }

  get(key: string): SystemHealth | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      console.log(`🗄️ SystemHealthCache: Cache miss for key "${key}"`);
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      console.log(`🗄️ SystemHealthCache: Cache expired for key "${key}" (age: ${age}ms, ttl: ${entry.ttl}ms)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`🗄️ SystemHealthCache: Cache hit for key "${key}" (age: ${age}ms)`);
    return entry.data;
  }

  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    console.log(`🗄️ SystemHealthCache: ${deleted ? 'Invalidated' : 'Key not found'} "${key}"`);
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗄️ SystemHealthCache: Cleared ${size} entries`);
  }

  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age <= entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
        // Clean up expired entries
        this.cache.delete(key);
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheHitRate: validEntries / (validEntries + expiredEntries) || 0
    };
  }

  // Preload cache with initial data
  preload(initialData: SystemHealth): void {
    this.set('default', initialData, this.DEFAULT_TTL);
    console.log('🗄️ SystemHealthCache: Preloaded with initial data');
  }

  // Get cache key based on user and context
  getCacheKey(userId?: string, context?: string): string {
    return `health_${userId || 'anonymous'}_${context || 'default'}`;
  }
}

// Export singleton instance
export const systemHealthCache = SystemHealthCache.getInstance();