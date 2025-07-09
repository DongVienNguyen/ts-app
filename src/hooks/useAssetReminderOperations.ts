import { supabase } from '@/integrations/supabase/client';
import { toCSV, FieldConfig } from '@/utils/csvUtils';

export const useAssetReminderOperations = (loadData: () => Promise<void>, showMessage: (params: { type: 'success' | 'error' | 'info'; text: string }) => void) => {
  const handleSubmit = async (
    tenTaiSan: string,
    ngayDenHan: string,
    selectedCBKH: string,
    selectedCBQLN: string,
    editingReminder: any
  ) => {
    if (!tenTaiSan || !ngayDenHan) {
      showMessage({ type: 'error', text: "Vui lòng điền đầy đủ thông tin bắt buộc" });
      return false;
    }

    try {
      const reminderData = {
        ten_ts: tenTaiSan,
        ngay_den_han: ngayDenHan,
        cbkh: selectedCBKH || null,
        cbqln: selectedCBQLN || null,
        is_sent: false
      };

      if (editingReminder) {
        const { error } = await supabase
          .from('asset_reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;
        showMessage({ type: 'success', text: "Cập nhật nhắc nhở thành công" });
      } else {
        const { error } = await supabase
          .from('asset_reminders')
          .insert([reminderData] as any); // Cast to any to resolve type mismatch

        if (error) throw error;
        showMessage({ type: 'success', text: "Thêm nhắc nhở thành công" });
      }

      await loadData();
      return true;
    } catch (error: any) {
      showMessage({ type: 'error', text: `Không thể lưu nhắc nhở: ${error.message}` });
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('asset_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage({ type: 'success', text: "Xóa nhắc nhở thành công" });
      await loadData();
    } catch (error: any) {
      showMessage({ type: 'error', text: "Không thể xóa nhắc nhở" });
    }
  };

  const handleDeleteSentReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sent_asset_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showMessage({ type: 'success', text: "Xóa nhắc nhở đã gửi thành công" });
      await loadData();
    } catch (error: any) {
      showMessage({ type: 'error', text: "Không thể xóa nhắc nhở đã gửi" });
    }
  };

  const handleDeleteAllSentReminders = async () => {
    showMessage({ type: 'info', text: '' });
    try {
      const { error } = await supabase.from('sent_asset_reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      showMessage({ type: 'success', text: "Đã xóa tất cả nhắc nhở đã gửi thành công." });
      await loadData();
    } catch (error: any) {
      showMessage({ type: 'error', text: `Không thể xóa tất cả nhắc nhở đã gửi: ${error.message}` });
    }
  };

  const assetReminderFields: FieldConfig[] = [
    { key: 'id', label: 'ID', type: 'text' },
    { key: 'ten_ts', label: 'Tên tài sản', type: 'text' },
    { key: 'ngay_den_han', label: 'Ngày đến hạn', type: 'date' },
    { key: 'cbkh', label: 'CBKH', type: 'text' },
    { key: 'cbqln', label: 'CBQLN', type: 'text' },
    { key: 'is_sent', label: 'Đã gửi', type: 'boolean' },
    { key: 'created_at', label: 'Ngày tạo', type: 'date' },
  ];

  const exportToCSV = (data: any[], filename: string = 'asset_reminders.csv') => {
    if (data.length === 0) {
      showMessage({ type: 'info', text: "Không có dữ liệu để xuất" });
      return;
    }
    const csvString = toCSV(data, assetReminderFields);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showMessage({ type: 'success', text: `Đã xuất dữ liệu ra tệp ${filename}` });
    } else {
      showMessage({ type: 'error', text: "Trình duyệt của bạn không hỗ trợ tải xuống tệp trực tiếp." });
    }
  };

  return {
    handleSubmit,
    handleDelete,
    handleDeleteSentReminder,
    handleDeleteAllSentReminders,
    exportToCSV
  };
};