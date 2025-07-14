import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendAssetNotificationEmail } from '@/services/emailService';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { isDayMonthDueOrOverdue } from '@/utils/dateUtils';

type AssetReminder = Tables<'asset_reminders'>;
type StaffMember = Tables<'cbkh'>; // cbkh and cbqln have same structure

interface StaffData {
  cbkh: StaffMember[];
  cbqln: StaffMember[];
}

export const useAssetReminderEmail = (
  staff: StaffData, // Changed type from Staff to StaffData
  loadData: () => Promise<void>,
  showMessage: (params: { type: 'success' | 'error' | 'info'; text: string }) => void
) => {

  const getEmailTemplate = (tenTs: string, ngayDenHan: string, cbqln: string, cbkh: string) => {
    const qlnPart = cbqln ? `CBQLN: ${cbqln}` : '';
    const khPart = cbkh ? `CBKH: ${cbkh}` : '';
    const separator = qlnPart && khPart ? ' - ' : '';
    const details = `${qlnPart}${separator}${khPart}`;
    return `Kính gửi,
    
    Tài sản "${tenTs}" đến hạn vào ngày ${ngayDenHan}.
    
    Thông tin chi tiết: ${details}
    
    Vui lòng kiểm tra và thực hiện các thủ tục cần thiết.
    
    Trân trọng,
    Hệ thống nhắc nhở tự động`;
  };

  const sendSingleReminder = useCallback(async (reminder: AssetReminder) => {
    try {
      if (!isDayMonthDueOrOverdue(reminder.ngay_den_han)) {
        showMessage({ type: 'info', text: `Nhắc nhở cho tài sản "${reminder.ten_ts}" chưa đến hạn.` });
        return false;
      }

      const cbkhUser = staff.cbkh.find(s => s.ten_nv === reminder.cbkh);
      const cbqlnUser = staff.cbqln.find(s => s.ten_nv === reminder.cbqln);

      const recipientEmails: string[] = [];
      if (cbkhUser?.email) recipientEmails.push(cbkhUser.email);
      if (cbqlnUser?.email) recipientEmails.push(cbqlnUser.email);

      if (recipientEmails.length === 0) {
        showMessage({ type: 'error', text: `Không tìm thấy email người nhận cho tài sản "${reminder.ten_ts}".` });
        return false;
      }

      const subject = `Nhắc nhở tài sản đến hạn: ${reminder.ten_ts}`;
      const content = getEmailTemplate(
        reminder.ten_ts,
        reminder.ngay_den_han,
        reminder.cbqln || 'N/A',
        reminder.cbkh || 'N/A'
      );

      const emailResult = await sendAssetNotificationEmail(recipientEmails, subject, content);

      if (emailResult.success) {
        const sentData: TablesInsert<'sent_asset_reminders'> = {
          ten_ts: reminder.ten_ts,
          ngay_den_han: reminder.ngay_den_han,
          cbqln: reminder.cbqln,
          cbkh: reminder.cbkh,
          is_sent: true,
          sent_date: new Date().toISOString().split('T')[0],
        };
        await supabase.from('sent_asset_reminders').insert([sentData]);
        await supabase.from('asset_reminders').delete().eq('id', reminder.id);
        showMessage({ type: 'success', text: `Đã gửi nhắc nhở cho tài sản "${reminder.ten_ts}" và chuyển sang danh sách đã gửi.` });
        loadData();
        return true;
      } else {
        throw new Error(emailResult.error || 'Lỗi không xác định khi gửi email.');
      }
    } catch (error: any) {
      showMessage({ type: 'error', text: `Không thể gửi nhắc nhở cho tài sản "${reminder.ten_ts}": ${error.message}` });
      return false;
    }
  }, [staff, loadData, showMessage]);

  const sendReminders = useCallback(async (remindersToSend: AssetReminder[]) => {
    if (remindersToSend.length === 0) {
      showMessage({ type: 'info', text: "Không có nhắc nhở nào đến hạn hoặc quá hạn để gửi." });
      return false;
    }
    let allSuccess = true;
    for (const reminder of remindersToSend) {
      const success = await sendSingleReminder(reminder);
      if (!success) {
        allSuccess = false;
      }
    }
    if (allSuccess) {
      showMessage({ type: 'success', text: "Đã gửi tất cả nhắc nhở đến hạn thành công." });
    } else {
      showMessage({ type: 'error', text: "Có lỗi xảy ra khi gửi một số nhắc nhở." });
    }
    return allSuccess;
  }, [sendSingleReminder, showMessage]);

  return {
    isDayMonthDueOrOverdue,
    sendSingleReminder,
    sendReminders
  };
};