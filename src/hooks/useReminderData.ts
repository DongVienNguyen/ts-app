import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

type AssetReminder = Tables<'asset_reminders'>;
type SentAssetReminder = Tables<'sent_asset_reminders'>;

export const useReminderData = () => {
  const [reminders, setReminders] = useState<AssetReminder[]>([]);
  const [sentReminders, setSentReminders] = useState<SentAssetReminder[]>([]);

  const loadReminderData = async () => {
    try {
      console.log('Loading reminder data...');
      
      const { data: remindersData, error: remindersError } = await supabase
        .from('asset_reminders')
        .select('*')
        .order('ngay_den_han', { ascending: true });

      if (remindersError) throw new Error(`Asset Reminders load error: ${remindersError.message}`);

      const { data: sentRemindersData, error: sentRemindersError } = await supabase
        .from('sent_asset_reminders')
        .select('*')
        .order('sent_date', { ascending: false });

      if (sentRemindersError) throw new Error(`Sent asset reminders load error: ${sentRemindersError.message}`);

      setReminders((remindersData as AssetReminder[]) || []);
      setSentReminders((sentRemindersData as SentAssetReminder[]) || []);

      return { remindersData, sentRemindersData };
    } catch (error: any) {
      console.error('Error loading reminder data:', error);
      setReminders([]);
      setSentReminders([]);
      toast.error(
        "Không thể tải dữ liệu nhắc nhở",
        { description: error.message }
      );
      throw error;
    }
  };

  return {
    reminders,
    setReminders,
    sentReminders,
    setSentReminders,
    loadReminderData
  };
};