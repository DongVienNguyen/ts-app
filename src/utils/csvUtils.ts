import { FieldConfig } from '@/config/entityConfig';

// Helper function to escape CSV fields
const escapeCSV = (field: any): string => {
  if (field === null || field === undefined) {
    return '';
  }
  const str = String(field);
  // If the string contains a comma, double quote, or newline, enclose it in double quotes.
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    // Escape existing double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const convertToCSV = (data: any[], headers: string[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  const csvHeaders = headers.map(header => escapeCSV(header)).join(',');
  const rows = data.map(row => {
    return headers.map(header => {
      // Use the header string as the key to access data from the row object
      return escapeCSV(row[header]);
    }).join(',');
  });

  return [csvHeaders, ...rows].join('\n');
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection for download attribute
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const toCSVTemplate = (fields: FieldConfig[]): string => {
  const headers = fields.map(field => field.key).join(',');
  return headers;
};

export const fromCSV = (csvText: string, fields: FieldConfig[]): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return []; // Must have at least a header and one data row
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const dataRows = lines.slice(1);

  const data = dataRows.map(row => {
    const values = row.split(','); // Simple split, may need improvement for quoted commas
    const obj: { [key: string]: any } = {};

    headers.forEach((header, index) => {
      const fieldConfig = fields.find(f => f.key === header);
      if (fieldConfig) {
        let value: any = values[index];
        // Basic type conversion
        if (fieldConfig.type === 'number') {
          value = value ? Number(value) : null;
        } else if (fieldConfig.type === 'boolean') {
          value = value.toLowerCase() === 'true';
        }
        obj[header] = value;
      }
    });
    return obj;
  });

  return data;
};