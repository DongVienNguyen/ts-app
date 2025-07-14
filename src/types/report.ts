import { Tables, TablesInsert, TablesUpdate } from './supabase';

// Manually define types for new tables as they are not in the generated types yet.
export interface ProcessedNote {
  id: string;
  created_at: string;
  room: string;
  operation_type: string;
  content: string;
  staff_code: string;
  mail_to_nv: string | null;
  is_done: boolean;
  done_at: string | null;
}
export type ProcessedNoteInsert = Omit<ProcessedNote, 'id' | 'created_at' | 'is_done' | 'done_at'> & { is_done?: boolean, done_at?: string | null };
export type ProcessedNoteUpdate = Partial<Omit<ProcessedNote, 'id' | 'created_at'>>;

export interface TakenAssetStatus {
    id: string;
    created_at: string;
    transaction_id: string;
    user_username: string;
    week_year: string;
    marked_at: string;
}
export type TakenAssetStatusInsert = Omit<TakenAssetStatus, 'id' | 'created_at' | 'marked_at'> & { marked_at?: string };