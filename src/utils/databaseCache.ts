import { supabase } from '@/integrations/supabase/client';
import { dataCache } from './cacheManager';

interface QueryCacheConfig {
  ttl: number;
  maxSize: number;
  staleWhileRevalidate: boolean;
}

class DatabaseCache {
  private static instance: DatabaseCache;
  private pendingQueries = new Map<string, Promise<any>>();

  static getInstance(): DatabaseCache {
    if (!DatabaseCache.instance) {
      DatabaseCache.instance = new DatabaseCache();
    }
    return DatabaseCache.instance;
  }

  // Default cache configurations for different query types
  private getDefaultConfig(queryType: string): QueryCacheConfig {
    const configs: Record<string, QueryCacheConfig> = {
      'staff': { ttl: 10 * 60 * 1000, maxSize: 50, staleWhileRevalidate: true }, // 10 minutes
      'asset_transactions': { ttl: 2 * 60 * 1000, maxSize: 100, staleWhileRevalidate: true }, // 2 minutes
      'notifications': { ttl: 30 * 1000, maxSize: 20, staleWhileRevalidate: true }, // 30 seconds
      'system_metrics': { ttl: 5 * 60 * 1000, maxSize: 30, staleWhileRevalidate: false }, // 5 minutes
      'security_events': { ttl: 1 * 60 * 1000, maxSize: 50, staleWhileRevalidate: true }, // 1 minute
      'asset_reminders': { ttl: 5 * 60 * 1000, maxSize: 40, staleWhileRevalidate: true }, // 5 minutes
      'other_assets': { ttl: 10 * 60 * 1000, maxSize: 30, staleWhileRevalidate: true }, // 10 minutes
      'default': { ttl: 5 * 60 * 1000, maxSize: 50, staleWhileRevalidate: true } // 5 minutes
    };

    return configs[queryType] || configs.default;
  }

  // Create cache key from query parameters
  private createCacheKey(table: string, params: any = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as any);

    return `db:${table}:${JSON.stringify(sortedParams)}`;
  }

  // Generic cached query method
  async cachedQuery<T>(
    table: string,
    queryFn: () => Promise<T>,
    params: any = {},
    customConfig?: Partial<QueryCacheConfig>
  ): Promise<T> {
    const cacheKey = this.createCacheKey(table, params);
    const config = { ...this.getDefaultConfig(table), ...customConfig };
    
    console.log(`🗄️ Database cache query: ${cacheKey}`);

    // Check if query is already pending
    if (this.pendingQueries.has(cacheKey)) {
      console.log(`⏳ Query pending, waiting: ${cacheKey}`);
      return this.pendingQueries.get(cacheKey);
    }

    // Try to get from cache
    const cached = dataCache.get<T>(cacheKey);
    if (cached !== null) {
      console.log(`✅ Cache hit: ${cacheKey}`);
      
      // Stale-while-revalidate: return cached data and refresh in background
      if (config.staleWhileRevalidate) {
        this.refreshInBackground(cacheKey, queryFn, config.ttl);
      }
      
      return cached;
    }

    console.log(`🌐 Cache miss, fetching: ${cacheKey}`);

    // Execute query and cache result
    const queryPromise = this.executeAndCache(cacheKey, queryFn, config.ttl);
    this.pendingQueries.set(cacheKey, queryPromise);

    try {
      const result = await queryPromise;
      return result;
    } finally {
      this.pendingQueries.delete(cacheKey);
    }
  }

  // Execute query and cache the result
  private async executeAndCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    try {
      const result = await queryFn();
      dataCache.set(cacheKey, result, ttl);
      console.log(`💾 Cached result: ${cacheKey}`);
      return result;
    } catch (error) {
      console.error(`❌ Query failed: ${cacheKey}`, error);
      throw error;
    }
  }

  // Refresh data in background for stale-while-revalidate
  private refreshInBackground<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number
  ): void {
    setTimeout(async () => {
      try {
        console.log(`🔄 Background refresh: ${cacheKey}`);
        await this.executeAndCache(cacheKey, queryFn, ttl);
      } catch (error) {
        console.warn(`⚠️ Background refresh failed: ${cacheKey}`, error);
      }
    }, 0);
  }

  // Invalidate cache for specific table
  invalidateTable(table: string): void {
    const keysToDelete: string[] = [];
    
    // Find all cache keys for this table
    for (const key of dataCache['cache'].keys()) {
      if (key.startsWith(`db:${table}:`)) {
        keysToDelete.push(key);
      }
    }

    // Delete all matching keys
    keysToDelete.forEach(key => {
      dataCache.delete(key);
      console.log(`🗑️ Invalidated cache: ${key}`);
    });

    console.log(`✅ Invalidated ${keysToDelete.length} cache entries for table: ${table}`);
  }

  // Invalidate specific cache entry
  invalidateQuery(table: string, params: any = {}): void {
    const cacheKey = this.createCacheKey(table, params);
    dataCache.delete(cacheKey);
    console.log(`🗑️ Invalidated specific cache: ${cacheKey}`);
  }

  // Get cache statistics
  getCacheStats() {
    return {
      ...dataCache.getStats(),
      pendingQueries: this.pendingQueries.size
    };
  }

  // Clear all database cache
  clearAll(): void {
    // Clear only database-related cache entries
    const keysToDelete: string[] = [];
    
    for (const key of dataCache['cache'].keys()) {
      if (key.startsWith('db:')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => dataCache.delete(key));
    this.pendingQueries.clear();
    
    console.log(`🗑️ Cleared ${keysToDelete.length} database cache entries`);
  }
}

// Export singleton instance
export const databaseCache = DatabaseCache.getInstance();

// Utility functions for common queries
export const cachedSupabaseQuery = async <T>(
  table: string,
  queryBuilder: any,
  params: any = {},
  customConfig?: Partial<QueryCacheConfig>
): Promise<T> => {
  return databaseCache.cachedQuery(
    table,
    async () => {
      const { data, error } = await queryBuilder;
      if (error) throw error;
      return data;
    },
    params,
    customConfig
  );
};

// Specific cached query functions
export const getCachedStaff = (filters: any = {}) => {
  return databaseCache.cachedQuery(
    'staff',
    async () => {
      let query = supabase.from('staff').select('*');
      
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.department) {
        query = query.eq('department', filters.department);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    filters
  );
};

export const getCachedAssetTransactions = (filters: any = {}) => {
  return databaseCache.cachedQuery(
    'asset_transactions',
    async () => {
      let query = supabase.from('asset_transactions').select('*').order('created_at', { ascending: false });
      
      if (filters.startDate) {
        query = query.gte('transaction_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('transaction_date', filters.endDate);
      }
      if (filters.staff_code) {
        query = query.eq('staff_code', filters.staff_code);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    filters,
    { ttl: 2 * 60 * 1000 } // 2 minutes for frequently changing data
  );
};

export const getCachedNotifications = (username: string) => {
  return databaseCache.cachedQuery(
    'notifications',
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_username', username)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    { username },
    { ttl: 30 * 1000 } // 30 seconds for real-time data
  );
};

export const getCachedAssetReminders = () => {
  return databaseCache.cachedQuery(
    'asset_reminders',
    async () => {
      const { data, error } = await supabase
        .from('asset_reminders')
        .select('*')
        .order('ngay_den_han', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  );
};

export const getCachedOtherAssets = () => {
  return databaseCache.cachedQuery(
    'other_assets',
    async () => {
      const { data, error } = await supabase
        .from('other_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );
};

// Cache invalidation helpers
export const invalidateAssetTransactions = () => {
  databaseCache.invalidateTable('asset_transactions');
};

export const invalidateNotifications = (username?: string) => {
  if (username) {
    databaseCache.invalidateQuery('notifications', { username });
  } else {
    databaseCache.invalidateTable('notifications');
  }
};

export const invalidateAssetReminders = () => {
  databaseCache.invalidateTable('asset_reminders');
};

export const invalidateOtherAssets = () => {
  databaseCache.invalidateTable('other_assets');
};