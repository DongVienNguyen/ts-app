import { startTiming, endTiming } from '@/utils/performanceMonitor';

export class CSVConverter {
  static convertToCSV(data: any[], tableName: string): string {
    startTiming(`csv-conversion-${tableName}`);
    
    if (!data || data.length === 0) {
      endTiming(`csv-conversion-${tableName}`);
      return `# ${tableName} - No data\n`;
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        return CSVConverter.formatCSVValue(value);
      }).join(',');
    });

    const result = [
      `# Table: ${tableName}`,
      `# Records: ${data.length}`,
      `# Exported: ${new Date().toISOString()}`,
      csvHeaders,
      ...csvRows
    ].join('\n') + '\n';
    
    endTiming(`csv-conversion-${tableName}`);
    return result;
  }

  private static formatCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    }
    
    if (typeof value === 'string' && (
      value.includes(',') || 
      value.includes('"') || 
      value.includes('\n')
    )) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value.toString();
  }
}