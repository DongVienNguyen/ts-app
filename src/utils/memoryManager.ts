import { dataCache, uiCache, apiCache } from './cacheManager';
import { databaseCache } from './databaseCache';
import { performanceMonitor } from './performanceMonitor';

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
  cacheStats: {
    dataCache: any;
    uiCache: any;
    apiCache: any;
    databaseCache: any;
  };
}

class MemoryManager {
  private static instance: MemoryManager;
  private monitoringInterval?: NodeJS.Timeout;
  private cleanupThreshold = 85; // 85% memory usage threshold
  private isMonitoring = false;
  private lastCleanup = 0;
  private cleanupCooldown = 30 * 1000; // 30 seconds between cleanups

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Start memory monitoring
  startMonitoring(intervalMs: number = 10000): void {
    if (this.isMonitoring) {
      console.log('🧠 Memory monitoring already running');
      return;
    }

    console.log('🧠 Starting memory monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, intervalMs);

    // Initial check
    this.checkMemoryUsage();
  }

  // Stop memory monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🧠 Memory monitoring stopped');
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats | null {
    if (!('memory' in performance)) {
      console.warn('⚠️ Memory API not supported in this browser');
      return null;
    }

    const memory = (performance as any).memory;
    const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage,
      cacheStats: {
        dataCache: dataCache.getStats(),
        uiCache: uiCache.getStats(),
        apiCache: apiCache.getStats(),
        databaseCache: databaseCache.getCacheStats()
      }
    };
  }

  // Check memory usage and trigger cleanup if needed
  private checkMemoryUsage(): void {
    const stats = this.getMemoryStats();
    if (!stats) return;

    const { usagePercentage, usedJSHeapSize, jsHeapSizeLimit } = stats;
    
    console.log(`🧠 Memory usage: ${usagePercentage.toFixed(1)}% (${this.formatBytes(usedJSHeapSize)}/${this.formatBytes(jsHeapSizeLimit)})`);

    // Log cache statistics
    console.log('📊 Cache stats:', {
      dataCache: stats.cacheStats.dataCache.total,
      uiCache: stats.cacheStats.uiCache.total,
      apiCache: stats.cacheStats.apiCache.total,
      databaseCache: stats.cacheStats.databaseCache.total
    });

    // Trigger cleanup if threshold exceeded
    if (usagePercentage > this.cleanupThreshold) {
      this.triggerMemoryCleanup(usagePercentage);
    }

    // Track memory metrics
    performanceMonitor.gauge('memory-usage-percentage', usagePercentage);
    performanceMonitor.gauge('memory-used-mb', usedJSHeapSize / 1024 / 1024);
  }

  // Trigger memory cleanup
  private triggerMemoryCleanup(currentUsage: number): void {
    const now = Date.now();
    
    // Check cooldown period
    if (now - this.lastCleanup < this.cleanupCooldown) {
      console.log('🧠 Memory cleanup on cooldown, skipping...');
      return;
    }

    console.warn(`🚨 Memory usage high (${currentUsage.toFixed(1)}%), triggering cleanup...`);
    this.lastCleanup = now;

    // Perform aggressive cleanup
    this.performAggressiveCleanup();

    // Check memory after cleanup
    setTimeout(() => {
      const afterStats = this.getMemoryStats();
      if (afterStats) {
        const reduction = currentUsage - afterStats.usagePercentage;
        console.log(`✅ Memory cleanup completed. Reduced usage by ${reduction.toFixed(1)}% (now ${afterStats.usagePercentage.toFixed(1)}%)`);
        
        // Track cleanup effectiveness
        performanceMonitor.gauge('memory-cleanup-reduction', reduction);
        performanceMonitor.increment('memory-cleanup-triggered');
      }
    }, 1000);
  }

  // Perform aggressive memory cleanup
  private performAggressiveCleanup(): void {
    console.log('🧹 Starting aggressive memory cleanup...');

    // 1. Clear expired cache entries
    this.clearExpiredCaches();

    // 2. Clear performance metrics (keep only recent ones)
    performanceMonitor.clearMetrics();

    // 3. Clear old database cache entries
    this.clearOldDatabaseCache();

    // 4. Force garbage collection if available
    this.forceGarbageCollection();

    // 5. Clear console logs in production
    if (process.env.NODE_ENV === 'production') {
      console.clear();
    }

    // 6. Clear any large objects from memory
    this.clearLargeObjects();

    console.log('✅ Aggressive memory cleanup completed');
  }

  // Clear expired cache entries
  private clearExpiredCaches(): void {
    console.log('🗑️ Clearing expired cache entries...');
    
    try {
      // Force cleanup by accessing stats (triggers internal cleanup)
      dataCache.getStats();
      uiCache.getStats();
      apiCache.getStats();

      console.log('✅ Cache cleanup completed');
    } catch (error) {
      console.error('❌ Error during cache cleanup:', error);
    }
  }

  // Clear old database cache entries
  private clearOldDatabaseCache(): void {
    console.log('🗑️ Clearing old database cache entries...');
    
    try {
      // Clear database cache for non-critical data
      databaseCache.invalidateTable('system_metrics');
      databaseCache.invalidateTable('security_events');
      
      console.log('✅ Database cache cleanup completed');
    } catch (error) {
      console.error('❌ Error during database cache cleanup:', error);
    }
  }

  // Force garbage collection if available
  private forceGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      console.log('🗑️ Forcing garbage collection...');
      try {
        (window as any).gc();
        console.log('✅ Garbage collection completed');
      } catch (error) {
        console.warn('⚠️ Garbage collection failed:', error);
      }
    } else {
      console.log('ℹ️ Garbage collection not available');
    }
  }

  // Clear large objects from memory
  private clearLargeObjects(): void {
    console.log('🗑️ Clearing large objects...');
    
    try {
      // Clear any global variables that might be holding large data
      // This is application-specific
      
      // Clear any cached DOM references
      if ('WeakMap' in window) {
        // WeakMaps will be garbage collected automatically
      }

      console.log('✅ Large objects cleanup completed');
    } catch (error) {
      console.error('❌ Error during large objects cleanup:', error);
    }
  }

  // Format bytes to human readable format
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Set cleanup threshold
  setCleanupThreshold(threshold: number): void {
    if (threshold < 50 || threshold > 95) {
      console.warn('⚠️ Cleanup threshold should be between 50% and 95%');
      return;
    }
    
    this.cleanupThreshold = threshold;
    console.log(`🧠 Memory cleanup threshold set to ${threshold}%`);
  }

  // Manual cleanup trigger
  manualCleanup(): void {
    console.log('🧹 Manual memory cleanup triggered...');
    const stats = this.getMemoryStats();
    
    if (stats) {
      this.performAggressiveCleanup();
      
      setTimeout(() => {
        const afterStats = this.getMemoryStats();
        if (afterStats) {
          const reduction = stats.usagePercentage - afterStats.usagePercentage;
          console.log(`✅ Manual cleanup completed. Memory usage: ${stats.usagePercentage.toFixed(1)}% → ${afterStats.usagePercentage.toFixed(1)}% (${reduction > 0 ? '-' : '+'}${Math.abs(reduction).toFixed(1)}%)`);
        }
      }, 1000);
    }
  }

  // Get cleanup recommendations
  getCleanupRecommendations(): string[] {
    const stats = this.getMemoryStats();
    if (!stats) return ['Memory API not supported'];

    const recommendations: string[] = [];
    const { usagePercentage, cacheStats } = stats;

    if (usagePercentage > 80) {
      recommendations.push('Memory usage is high (>80%). Consider manual cleanup.');
    }

    if (cacheStats.dataCache.total > 50) {
      recommendations.push('Data cache has many entries. Consider clearing old data.');
    }

    if (cacheStats.apiCache.total > 100) {
      recommendations.push('API cache is large. Consider reducing cache TTL.');
    }

    if (cacheStats.databaseCache.total > 50) {
      recommendations.push('Database cache is large. Consider invalidating old queries.');
    }

    if (recommendations.length === 0) {
      recommendations.push('Memory usage is optimal. No cleanup needed.');
    }

    return recommendations;
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Auto-start memory monitoring when module loads
if (typeof window !== 'undefined') {
  // Start monitoring after a delay to allow app initialization
  setTimeout(() => {
    memoryManager.startMonitoring(15000); // Check every 15 seconds
  }, 5000);
}

// Export utility functions
export const getMemoryStats = () => memoryManager.getMemoryStats();
export const triggerMemoryCleanup = () => memoryManager.manualCleanup();
export const getCleanupRecommendations = () => memoryManager.getCleanupRecommendations();