import { FieldConfig } from '@/config/entityConfig'; // Import FieldConfig

export const toCSV = (data: any[], fields: Array<{ key: string; label: string }>): string => {
  if (!data || data.length === 0) {
    return fields.map(f => f.label).join(',');
  }

  const header = fields.map(f => f.label).join(',');
  const rows = data.map(row =>
    fields.map(f => {
      let value = row[f.key];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  return [header, ...rows].join('\n');
};

export const fromCSV = (csvString: string, fields?: FieldConfig[]): any[] => { // Added optional fields parameter
  const lines = csvString.split('\n').filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const dataLines = lines.slice(1);

  // Simple CSV parsing: split by comma, handle quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let inQuote = false;
    let currentField = '';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i + 1] === '"') { // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        result.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    result.push(currentField); // Add the last field
    return result.map(field => field.trim());
  };

  const csvHeaders = parseLine(headerLine);
  const result = dataLines.map(line => {
    const values = parseLine(line);
    const obj: { [key: string]: any } = {};
    csvHeaders.forEach((csvHeader, index) => {
      // If fields config is provided, try to map CSV header (label) to field key
      const fieldConfig = fields?.find(f => f.label === csvHeader);
      const key = fieldConfig ? fieldConfig.key : csvHeader; // Use key if found, otherwise use CSV header directly
      obj[key] = values[index];
    });
    return obj;
  });

  return result;
};