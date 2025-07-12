import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type AssetReminder = Tables<'asset_reminders'>;
type SentAssetReminder = Tables<'sent_asset_reminders'>;
type StaffMember = Tables<'cbkh'>; // cbkh and cbqln have same structure

interface StaffData {
  cbkh: StaffMember[];
  cbqln: StaffMember[];
}

export const useAssetReminderData = () => {
  const [reminders, setReminders] = useState<AssetReminder[]>([]);
  const [sentReminders, setSentReminders] = useState<SentAssetReminder[]>([]);
  const [staff, setStaff] = useState<StaffData>({ cbkh: [], cbqln: [] });
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [remindersResult, sentRemindersResult, cbkhResult, cbqlnResult] = await Promise.all([
        supabase.from('asset_reminders').select('*').order('ngay_den_han', { ascending: true }),
        supabase.from('sent_asset_reminders').select('*').order('sent_date', { ascending: false }),
        supabase.from('cbkh').select('*'),
        supabase.from('cbqln').select('*')
      ]);

      if (remindersResult.error) throw remindersResult.error;
      if (sentRemindersResult.error) throw sentRemindersResult.error;
      if (cbkhResult.error) throw cbkhResult.error;
      if (cbqlnResult.error) throw cbqlnResult.error;

      setReminders((remindersResult.data as AssetReminder[]) || []);
      setSentReminders((sentRemindersResult.data as SentAssetReminder[]) || []);
      setStaff({
        cbkh: (cbkhResult.data as StaffMember[]) || [],
        cbqln: (cbqlnResult.data as StaffMember[]) || [],
      });

    } catch (error: any) {
      toast.error("Không thể tải dữ liệu nhắc nhở", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { reminders, sentReminders, staff, isLoading, loadData };
};