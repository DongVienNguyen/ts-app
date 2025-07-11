import { supabase } from '@/integrations/supabase/client';
import { captureError, measurePerformance } from '@/utils/errorTracking';
import { 
  getCachedAssetTransactions, 
  invalidateAssetTransactions,
  databaseCache 
} from '@/utils/databaseCache';

export interface AssetTransactionFilters {
  startDate?: string;
  endDate?: string;
  parts_day?: 'Sáng' | 'Chiều' | 'all';
  isQlnPgdNextDay?: boolean;
  staff_code?: string;
  transaction_type?: string;
}

// Get asset transactions with caching
export const getAssetTransactions = measurePerformance('getAssetTransactions', async (filters?: AssetTransactionFilters) => {
  try {
    console.log('📊 Getting asset transactions with filters:', filters);
    
    // Use cached query for better performance
    const data = await getCachedAssetTransactions(filters || {});
    
    console.log(`✅ Retrieved ${data?.length || 0} asset transactions from cache`);
    return data;
  } catch (error) {
    captureError(error as Error, {
      functionName: 'getAssetTransactions',
      severity: 'medium',
      additionalData: { filters }
    });
    throw error;
  }
});

// Save asset transactions and invalidate cache
export const saveAssetTransactions = measurePerformance('saveAssetTransactions', async (transactions: any[]) => {
  try {
    console.log('💾 Saving asset transactions:', transactions.length);
    
    const { data, error } = await supabase
      .from('asset_transactions')
      .insert(transactions)
      .select();

    if (error) throw error;
    
    // Invalidate cache after successful save
    invalidateAssetTransactions();
    console.log('🗑️ Asset transactions cache invalidated');
    
    console.log(`✅ Saved ${data?.length || 0} asset transactions`);
    return data;
  } catch (error) {
    captureError(error as Error, {
      functionName: 'saveAssetTransactions',
      severity: 'high',
      additionalData: { transactions }
    });
    throw error;
  }
});

// Enhanced asset service with caching
export const assetService = {
  // Get all assets with caching
  getAllAssets: measurePerformance('getAllAssets', async () => {
    try {
      return await databaseCache.cachedQuery(
        'asset_transactions',
        async () => {
          const { data, error } = await supabase
            .from('asset_transactions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        }
      );
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getAllAssets',
        severity: 'medium'
      });
      throw error;
    }
  }),

  // Create asset transaction with cache invalidation
  createAssetTransaction: measurePerformance('createAssetTransaction', async (transaction: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate cache
      invalidateAssetTransactions();
      
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'createAssetTransaction',
        severity: 'high',
        additionalData: { transaction }
      });
      throw error;
    }
  }),

  // Update asset transaction with cache invalidation
  updateAssetTransaction: measurePerformance('updateAssetTransaction', async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate cache
      invalidateAssetTransactions();
      
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'updateAssetTransaction',
        severity: 'medium',
        additionalData: { id, updates }
      });
      throw error;
    }
  }),

  // Delete asset transaction with cache invalidation
  deleteAssetTransaction: measurePerformance('deleteAssetTransaction', async (id: string) => {
    try {
      const { error } = await supabase
        .from('asset_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalidate cache
      invalidateAssetTransactions();
      
      return true;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'deleteAssetTransaction',
        severity: 'high',
        additionalData: { id }
      });
      throw error;
    }
  }),

  // Get asset reminders with caching
  getAssetReminders: measurePerformance('getAssetReminders', async () => {
    try {
      return await databaseCache.cachedQuery(
        'asset_reminders',
        async () => {
          const { data, error } = await supabase
            .from('asset_reminders')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data;
        }
      );
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getAssetReminders',
        severity: 'medium'
      });
      throw error;
    }
  }),

  // Create asset reminder with cache invalidation
  createAssetReminder: measurePerformance('createAssetReminder', async (reminder: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_reminders')
        .insert(reminder)
        .select()
        .single();

      if (error) throw error;
      
      // Invalidate cache
      databaseCache.invalidateTable('asset_reminders');
      
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'createAssetReminder',
        severity: 'high',
        additionalData: { reminder }
      });
      throw error;
    }
  }),

  // Get cached statistics
  getAssetStatistics: measurePerformance('getAssetStatistics', async () => {
    try {
      return await databaseCache.cachedQuery(
        'asset_statistics',
        async () => {
          // Get various statistics
          const [transactionsResult, remindersResult] = await Promise.all([
            supabase.from('asset_transactions').select('*', { count: 'exact', head: true }),
            supabase.from('asset_reminders').select('*', { count: 'exact', head: true })
          ]);

          return {
            totalTransactions: transactionsResult.count || 0,
            totalReminders: remindersResult.count || 0,
            lastUpdated: new Date().toISOString()
          };
        },
        {},
        { ttl: 10 * 60 * 1000 } // Cache for 10 minutes
      );
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getAssetStatistics',
        severity: 'low'
      });
      throw error;
    }
  })
};