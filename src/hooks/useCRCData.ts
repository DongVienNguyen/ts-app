import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type StaffMember = Tables<'ldpcrc'>; // Use one of the staff tables as a base type
type CRCReminder = Tables<'crc_reminders'>;
type SentCRCReminder = Tables<'sent_crc_reminders'>;

interface CRCStaff {
  ldpcrc: StaffMember[];
  cbcrc: StaffMember[];
  quycrc: StaffMember[];
}

interface CRCDataState {
  staff: CRCStaff;
  reminders: CRCReminder[];
  sentReminders: SentCRCReminder[];
  isLoading: boolean;
  error: string | null;
}

export const useCRCData = () => {
  const [data, setData] = useState<CRCDataState>({
    staff: { ldpcrc: [], cbcrc: [], quycrc: [] },
    reminders: [],
    sentReminders: [],
    isLoading: false,
    error: null
  });

  const loadAllData = useCallback(async () => {
    console.log('🔄 Starting CRC data load with new open policies...');
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [ldpcrcResult, cbcrcResult, quycrcResult, remindersResult, sentRemindersResult] = await Promise.all([
        supabase.from('ldpcrc').select('*').order('ten_nv'),
        supabase.from('cbcrc').select('*').order('ten_nv'), 
        supabase.from('quycrc').select('*').order('ten_nv'),
        supabase.from('crc_reminders').select('*').order('ngay_thuc_hien'),
        supabase.from('sent_crc_reminders').select('*').order('sent_date', { ascending: false })
      ]);

      const errors = [
        ldpcrcResult.error,
        cbcrcResult.error, 
        quycrcResult.error,
        remindersResult.error,
        sentRemindersResult.error
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error('❌ Errors loading data:', errors);
        throw new Error(`Lỗi tải dữ liệu: ${errors.map(e => e!.message).join(', ')}`);
      }

      const staff: CRCStaff = {
        ldpcrc: (ldpcrcResult.data as StaffMember[]) || [],
        cbcrc: (cbcrcResult.data as StaffMember[]) || [],
        quycrc: (quycrcResult.data as StaffMember[]) || []
      };

      const reminders = (remindersResult.data as CRCReminder[]) || [];
      const sentReminders = (sentRemindersResult.data as SentCRCReminder[]) || [];

      setData({
        staff,
        reminders,
        sentReminders,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('💥 Critical error loading CRC data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
      
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));

      toast.error(`Không thể tải dữ liệu CRC: ${errorMessage}`);
    }
  }, []);

  const refreshData = useCallback(() => {
    console.log('🔄 Refreshing CRC data...');
    return loadAllData();
  }, [loadAllData]);

  return {
    ...data,
    loadAllData,
    refreshData,
  };
};