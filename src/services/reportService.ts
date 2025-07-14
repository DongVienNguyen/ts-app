import { supabase } from '@/integrations/supabase/client';
import { ProcessedNote, ProcessedNoteInsert, ProcessedNoteUpdate, TakenAssetStatus, TakenAssetStatusInsert } from '@/types/report';

// --- Processed Notes Service ---

export const getProcessedNotes = async (): Promise<ProcessedNote[]> => {
  const { data, error } = await supabase.from('processed_notes').select('*').eq('is_done', false).order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to fetch processed notes: ${error.message}`);
  return data || [];
};

export const addProcessedNote = async (note: ProcessedNoteInsert): Promise<ProcessedNote> => {
  const { data, error } = await supabase.from('processed_notes').insert(note).select().single();
  if (error) throw new Error(`Failed to add processed note: ${error.message}`);
  return data;
};

export const updateProcessedNote = async (id: string, updates: ProcessedNoteUpdate): Promise<ProcessedNote> => {
  const { data, error } = await supabase.from('processed_notes').update(updates).eq('id', id).select().single();
  if (error) throw new Error(`Failed to update processed note: ${error.message}`);
  return data;
};

export const deleteProcessedNote = async (id: string): Promise<void> => {
  const { error } = await supabase.from('processed_notes').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete processed note: ${error.message}`);
};

// --- Taken Asset Status Service ---

export const getTakenAssetStatus = async (username: string, weekYear: string): Promise<string[]> => {
  const { data, error } = await supabase.from('taken_asset_status').select('transaction_id').eq('user_username', username).eq('week_year', weekYear);
  if (error) throw new Error(`Failed to fetch taken status: ${error.message}`);
  return (data || []).map(item => item.transaction_id);
};

export const addTakenAssetStatus = async (status: TakenAssetStatusInsert): Promise<void> => {
  const { error } = await supabase.from('taken_asset_status').insert(status);
  if (error) throw new Error(`Failed to add taken status: ${error.message}`);
};

export const deleteTakenAssetStatus = async (transaction_id: string, user_username: string, week_year: string): Promise<void> => {
  const { error } = await supabase.from('taken_asset_status').delete()
    .eq('transaction_id', transaction_id)
    .eq('user_username', user_username)
    .eq('week_year', week_year);
  if (error) throw new Error(`Failed to delete taken status: ${error.message}`);
};