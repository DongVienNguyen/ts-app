import { supabase } from '@/integrations/supabase/client';
import { fromCSV } from '@/utils/csvUtils';
import { EntityConfig, TableName } from '@/config/entityConfig';
import { AuthenticatedStaff } from '@/contexts/AuthContext';

interface ImportResult {
  success: boolean;
  message: string;
  insertedCount?: number;
}

const BATCH_SIZE = 500; // Number of records to insert at once

export const importService = {
  importFromCSV: async (
    file: File,
    selectedEntity: TableName,
    config: EntityConfig,
    user: AuthenticatedStaff | null | undefined
  ): Promise<ImportResult> => {
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này.' };
    }

    if (!file.name.endsWith('.csv')) {
        return { success: false, message: 'Tệp không hợp lệ. Vui lòng chọn một tệp .csv.' };
    }

    try {
      const fileContent = await file.text();
      const data = fromCSV(fileContent, config.fields);

      if (data.length === 0) {
        return { success: false, message: 'Tệp CSV trống hoặc không có dữ liệu.' };
      }

      let insertedCount = 0;
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const { error, count } = await supabase
          .from(selectedEntity)
          .insert(batch, { count: 'exact' });

        if (error) {
          console.error('Error importing CSV data batch:', error);
          const detail = error.details || error.message;
          return {
            success: false,
            message: `Lỗi khi nhập dữ liệu (bắt đầu từ hàng ${i + 1}): ${detail}`,
            insertedCount,
          };
        }
        insertedCount += count || 0;
      }

      return {
        success: true,
        message: `Đã nhập thành công ${insertedCount} bản ghi từ ${file.name}.`,
        insertedCount,
      };
    } catch (error: any) {
      console.error('Error processing CSV file:', error);
      return { success: false, message: `Không thể xử lý tệp CSV: ${error.message}` };
    }
  },
};