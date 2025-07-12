import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig, EntityConfig } from '@/config/entityConfig'; // Import EntityConfig
import { fromCSV } from '@/utils/csvUtils';
import { toast } from 'sonner';

export interface RestoreResult {
  success: boolean;
  message: string;
  restoredTables: { tableName: string; count: number }[];
  errors: { tableName: string; message: string }[];
}

export interface RestorePreview {
  tableName: string;
  name: string;
  recordCount: number;
  status: 'found' | 'not_found' | 'error';
  errorMessage?: string;
}

export const restoreService = {
  async restoreDataFromZip(zipFile: File, user: any): Promise<RestoreResult> {
    if (!user || user.role !== 'admin') {
      return { success: false, message: 'Unauthorized access', restoredTables: [], errors: [] };
    }

    toast.info('Đang bắt đầu quá trình khôi phục dữ liệu...');
    let processedFiles = 0;
    const restoredTables: { tableName: string; count: number }[] = [];
    const errors: { tableName: string; message: string }[] = [];

    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipFile);
      const csvFiles = Object.keys(loadedZip.files).filter(filename => filename.endsWith('.csv') && !loadedZip.files[filename].dir);
      const totalFiles = csvFiles.length;

      for (const filename of csvFiles) {
        const csvContent = await loadedZip.files[filename].async('string');
        const tableName = filename.replace('.csv', '');

        const configEntry = Object.values(entityConfig).find(config => config.entity === tableName);

        if (configEntry) {
          toast.info(`Đang xử lý bảng: ${configEntry.name} (${tableName})...`);
          try {
            const dataToInsert = fromCSV(csvContent, configEntry.fields); // Pass fields for accurate mapping

            if (dataToInsert.length > 0) {
              const mappedData = dataToInsert.map(row => {
                const newRow: { [key: string]: any } = {};
                configEntry.fields.forEach(field => {
                  const value = row[field.key]; // Use field.key as the key from fromCSV output
                  if (value !== undefined) {
                    if (field.type === 'number') {
                      newRow[field.key] = value === '' ? null : Number(value);
                    } else if (field.type === 'boolean') {
                      newRow[field.key] = value.toLowerCase() === 'true';
                    } else if (field.type === 'date') {
                      newRow[field.key] = value === '' ? null : new Date(value).toISOString();
                    } else {
                      newRow[field.key] = value;
                    }
                  }
                });
                return newRow;
              });

              const { error } = await supabase.from(tableName).insert(mappedData);

              if (error) {
                if (error.code === '23505' && configEntry.primaryKey) {
                  toast.warning(`Xung đột dữ liệu trong bảng ${configEntry.name}. Đang thử cập nhật các bản ghi hiện có...`); // Changed to toast.warning
                  const updatePromises = mappedData.map(async (item) => {
                    const { error: updateError } = await supabase
                      .from(tableName)
                      .update(item)
                      .eq(configEntry.primaryKey!, item[configEntry.primaryKey!]);
                    if (updateError) {
                      console.error(`Lỗi cập nhật bản ghi trong ${tableName}:`, updateError.message);
                      toast.error(`Lỗi cập nhật bản ghi trong ${configEntry.name}: ${updateError.message}`);
                      errors.push({ tableName, message: `Cập nhật lỗi: ${updateError.message}` });
                    }
                  });
                  await Promise.all(updatePromises);
                  restoredTables.push({ tableName, count: mappedData.length });
                } else {
                  throw error;
                }
              } else {
                restoredTables.push({ tableName, count: mappedData.length });
                toast.success(`Đã khôi phục ${mappedData.length} bản ghi vào bảng ${configEntry.name}.`);
              }
            } else {
              toast.info(`Không có dữ liệu để khôi phục cho bảng ${configEntry.name}.`);
            }
          } catch (tableError: any) {
            console.error(`Lỗi xử lý bảng ${tableName}:`, tableError);
            toast.error(`Lỗi khôi phục bảng ${configEntry.name}: ${tableError.message}`);
            errors.push({ tableName, message: tableError.message });
          }
        } else {
          toast.warning(`Không tìm thấy cấu hình cho bảng: ${tableName}. Bỏ qua.`); // Changed to toast.warning
        }
        processedFiles++;
        toast.info(`Tiến độ: ${processedFiles}/${totalFiles} tệp đã xử lý.`);
      }
      toast.success('Quá trình khôi phục dữ liệu hoàn tất!');
      return { success: true, message: 'Khôi phục dữ liệu thành công.', restoredTables, errors };
    } catch (error: any) {
      console.error('Lỗi trong quá trình khôi phục dữ liệu:', error);
      toast.error(`Khôi phục dữ liệu thất bại: ${error.message || 'Lỗi không xác định'}`);
      return { success: false, message: `Khôi phục dữ liệu thất bại: ${error.message || 'Lỗi không xác định'}`, restoredTables, errors: [{ tableName: 'Tổng quan', message: error.message || 'Lỗi không xác định' }] };
    }
  },

  async getRestorePreview(zipFile: File): Promise<RestorePreview[]> {
    const preview: RestorePreview[] = [];
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(zipFile);
      const csvFiles = Object.keys(loadedZip.files).filter(filename => filename.endsWith('.csv') && !loadedZip.files[filename].dir);

      for (const filename of csvFiles) {
        const tableName = filename.replace('.csv', '');
        const configEntry = Object.values(entityConfig).find(config => config.entity === tableName);

        if (configEntry) {
          try {
            const csvContent = await loadedZip.files[filename].async('string');
            const data = fromCSV(csvContent, configEntry.fields); // Pass fields for accurate mapping
            preview.push({
              tableName: tableName,
              name: configEntry.name,
              recordCount: data.length,
              status: 'found'
            });
          } catch (fileError: any) {
            preview.push({
              tableName: tableName,
              name: configEntry.name,
              recordCount: 0,
              status: 'error',
              errorMessage: `Lỗi đọc tệp: ${fileError.message}`
            });
          }
        } else {
          preview.push({
            tableName: tableName,
            name: tableName, // Use filename as name if config not found
            recordCount: 0,
            status: 'not_found',
            errorMessage: 'Không tìm thấy cấu hình bảng'
          });
        }
      }
    } catch (error: any) {
      console.error('Lỗi tạo bản xem trước khôi phục:', error);
      preview.push({
        tableName: 'Tổng quan',
        name: 'Lỗi',
        recordCount: 0,
        status: 'error',
        errorMessage: `Lỗi đọc tệp ZIP: ${error.message}`
      });
    }
    return preview;
  }
};