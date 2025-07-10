import { supabase } from '@/integrations/supabase/client';
import { captureError, measurePerformance } from '@/utils/errorTracking';

export interface AssetTransactionFilters {
  startDate?: string;
  endDate?: string;
  parts_day?: 'Sáng' | 'Chiều' | 'all';
  isQlnPgdNextDay?: boolean;
}

// Get asset transactions with filters
export const getAssetTransactions = measurePerformance('getAssetTransactions', async (filters?: AssetTransactionFilters) => {
  try {
    let query = supabase
      .from('asset_transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters?.parts_day && filters.parts_day !== 'all') {
      query = query.eq('parts_day', filters.parts_day);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    captureError(error as Error, {
      functionName: 'getAssetTransactions',
      severity: 'medium'
    });
    throw error;
  }
});

// Save asset transactions
export const saveAssetTransactions = measurePerformance('saveAssetTransactions', async (transactions: any[]) => {
  try {
    const { data, error } = await supabase
      .from('asset_transactions')
      .insert(transactions)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    captureError(error as Error, {
      functionName: 'saveAssetTransactions',
      severity: 'high',
      error_data: { transactions }
    });
    throw error;
  }
});

// Wrap all asset service functions with error tracking and performance monitoring
export const assetService = {
  // Get all assets with error tracking
  getAllAssets: measurePerformance('getAllAssets', async () => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getAllAssets',
        severity: 'medium'
      });
      throw error;
    }
  }),

  // Create asset transaction with error tracking
  createAssetTransaction: measurePerformance('createAssetTransaction', async (transaction: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .insert(transaction)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'createAssetTransaction',
        severity: 'high',
        error_data: { transaction }
      });
      throw error;
    }
  }),

  // Update asset transaction with error tracking
  updateAssetTransaction: measurePerformance('updateAssetTransaction', async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'updateAssetTransaction',
        severity: 'medium',
        error_data: { id, updates }
      });
      throw error;
    }
  }),

  // Delete asset transaction with error tracking
  deleteAssetTransaction: measurePerformance('deleteAssetTransaction', async (id: string) => {
    try {
      const { error } = await supabase
        .from('asset_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'deleteAssetTransaction',
        severity: 'high',
        error_data: { id }
      });
      throw error;
    }
  }),

  // Get asset reminders with error tracking
  getAssetReminders: measurePerformance('getAssetReminders', async () => {
    try {
      const { data, error } = await supabase
        .from('asset_reminders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'getAssetReminders',
        severity: 'medium'
      });
      throw error;
    }
  }),

  // Create asset reminder with error tracking
  createAssetReminder: measurePerformance('createAssetReminder', async (reminder: any) => {
    try {
      const { data, error } = await supabase
        .from('asset_reminders')
        .insert(reminder)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      captureError(error as Error, {
        functionName: 'createAssetReminder',
        severity: 'high',
        error_data: { reminder }
      });
      throw error;
    }
  })
};