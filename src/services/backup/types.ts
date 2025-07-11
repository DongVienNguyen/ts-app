export interface BackupOptions {
  includeTables?: string[];
  excludeTables?: string[];
  includeSystemData?: boolean;
  compress?: boolean;
  backupType?: 'full' | 'database' | 'config' | 'functions' | 'security';
  exportFormat?: 'json' | 'csv';
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
  timestamp: string;
  backupType?: string;
  duration?: number;
}

export interface BackupMetadata {
  timestamp: string;
  version: string;
  format: string;
  tables: string[];
  totalTables: number;
  totalRecords?: number;
}

export interface TableBackupResult {
  data: any[];
  content: string;
}

export interface BackupStats {
  totalTables: number;
  tableStats: { [key: string]: number };
  totalRecords: number;
  estimatedSize: number;
}

export interface SecurityBackupData {
  timestamp: string;
  tables: { [key: string]: any[] };
  summary: {
    totalEvents: number;
    totalSessions: number;
    totalErrors: number;
  };
}

export interface ConfigBackupData {
  timestamp: string;
  supabase: {
    url: string;
    project_id: string;
  };
  features: { [key: string]: boolean };
  settings: { [key: string]: any };
  version: string;
}

export interface FunctionsBackupData {
  functions: string[];
  timestamp: string;
  count: number;
  description: string;
}