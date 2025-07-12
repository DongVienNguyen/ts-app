import { toCSV, toCSVTemplate } from '@/utils/csvUtils';
import { EntityConfig, TableName, entityConfig } from '@/config/entityConfig';

export const exportService = {
  exportToCSV: (data: any[], selectedEntity: TableName, page: number) => {
    if (!data || data.length === 0) {
      throw new Error('Không có dữ liệu để xuất.');
    }
    const config = entityConfig[selectedEntity];
    const csvContent = toCSV(data, config.fields);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${selectedEntity}_page_${page}_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportTemplateCSV: (config: EntityConfig) => {
    if (!config) {
      throw new Error('Không tìm thấy cấu hình cho thực thể.');
    }
    const csvContent = toCSVTemplate(config.fields);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${config.entity}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportSelectedToCSV: (selectedData: any[], config: EntityConfig) => {
    if (!selectedData || selectedData.length === 0) {
      throw new Error('Không có dữ liệu được chọn để xuất.');
    }
    if (!config) {
      throw new Error('Không tìm thấy cấu hình cho thực thể này.');
    }

    const csvContent = toCSV(selectedData, config.fields);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${config.entity}_selected_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};