import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV, fromCSV } from '@/utils/csvUtils';

export const exportService = {
  exportToCSV(data: any[], selectedEntity: string, currentPage: number) {
    if (data.length === 0) {
      throw new Error("Không có dữ liệu để xuất.");
    }
    
    const config = entityConfig[selectedEntity];
    const csvContent = toCSV(data, config.fields);
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${selectedEntity}_page_${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    return { success: true, message: "Xuất dữ liệu thành công." };
  },

  async importFromZip(file: File, user: any) {
    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized access');
    }

    if (!file) {
      throw new Error("Vui lòng chọn tệp ZIP để import.");
    }

    const zip = await JSZip.loadAsync(file);
    
    for (const key in entityConfig) {
      const config = entityConfig[key];
      const fileName = `${key}.csv`;
      const zipFile = zip.file(fileName);
      
      if (zipFile) {
        const content = await zipFile.async("text");
        const dataToRestore = fromCSV(content, config.fields); // Pass config.fields here
        
        // Delete existing data
        const { error: deleteError } = await supabase
          .from(config.entity as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (deleteError) throw deleteError;

        // Insert new data
        if (dataToRestore.length > 0) {
          const { error: insertError } = await supabase
            .from(config.entity as any)
            .insert(dataToRestore);
          
          if (insertError) throw insertError;
        }
      }
    }
    
    return { success: true, message: "Import dữ liệu thành công." };
  }
};