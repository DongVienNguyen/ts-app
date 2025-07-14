import { supabase } from '@/integrations/supabase/client';
import { AssetTransactionPayload, Transaction, AssetTransactionFilters } from '@/types/asset';

/**
 * Saves multiple asset transactions to the Supabase database.
 * @param transactions - An array of transaction payloads.
 * @returns The saved transaction data.
 * @throws If the database operation fails.
 */
export const saveAssetTransactions = async (
  transactions: AssetTransactionPayload[]
): Promise<Transaction[]> => {
  console.log('Saving transactions to Supabase:', transactions);
  
  const { data, error } = await supabase
    .from('asset_transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('❌ Supabase error saving asset transactions:', error);
    throw new Error(`Không thể lưu giao dịch tài sản: ${error.message}`);
  }

  console.log('✅ Transactions saved successfully to Supabase:', data);
  return data as Transaction[];
};

/**
 * Fetches asset transactions from the Supabase database based on provided filters.
 * @param filters - Optional filters to apply to the query.
 * @returns An array of Transaction objects.
 * @throws If the database operation fails.
 */
export const getAssetTransactions = async (
  filters?: AssetTransactionFilters
): Promise<Transaction[]> => {
  let query = supabase.from('asset_transactions').select('*');

  if (filters) {
    if (filters.startDate) {
      query = query.gte('transaction_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('transaction_date', filters.endDate);
    }
    if (filters.parts_day && filters.parts_day !== 'all') {
      query = query.eq('parts_day', filters.parts_day);
    }
    // isQlnPgdNextDay filter logic is handled by setting startDate/endDate in the calling hook
    // so no specific query modification is needed here for it.
  }

  query = query.order('transaction_date', { ascending: false }).order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('❌ Supabase error fetching asset transactions:', error);
    throw new Error(`Không thể tải giao dịch tài sản: ${error.message}`);
  }

  return data as Transaction[];
};

export const updateAssetTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction> => {
  const { data, error } = await supabase
    .from('asset_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('❌ Supabase error updating asset transaction:', error);
    throw new Error(`Không thể cập nhật giao dịch: ${error.message}`);
  }
  return data as Transaction;
};

export const deleteAssetTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('asset_transactions')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('❌ Supabase error deleting asset transaction:', error);
    throw new Error(`Không thể xóa giao dịch: ${error.message}`);
  }
};