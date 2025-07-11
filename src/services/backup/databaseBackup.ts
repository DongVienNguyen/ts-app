import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { TableBackup } from './tableBackup';
import { BackupOptions, BackupMetadata, TableBackupResult } from './types';

export class DatabaseBackup {
  static async createDatabaseBackup(options: BackupOptions = {}): Promise<{
    metadata: BackupMetadata;
    data: { [tableName: string]: any[] };
    files: { [tableName: string]: string };
  }> {
    startTiming('database-backup');
    
    console.log('🗄️ Creating database backup...');
    
    const allTables = await TableBackup.getAllTables();
    const tables = options.includeTables || allTables;
    const excludeTables = options.excludeTables || [];
    const format = options.exportFormat || 'csv';
    
    const filteredTables = tables.filter(t => !excludeTables.includes(t));
    
    const backupData = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        format: format,
        tables: filteredTables,
        totalTables: filteredTables.length,
        totalRecords: 0
      } as BackupMetadata,
      data: {} as { [tableName: string]: any[] },
      files: {} as { [tableName: string]: string }
    };

    let totalRecords = 0;
    
    const tableResults = await TableBackup.backupTables(
      filteredTables, 
      format,
      (current, total, tableName) => {
        console.log(`📊 Backing up table ${current}/${total}: ${tableName}`);
      }
    );
    
    for (const [tableName, result] of Object.entries(tableResults)) {
      const typedResult = result as TableBackupResult;
      backupData.data[tableName] = typedResult.data;
      backupData.files[tableName] = typedResult.content;
      totalRecords += typedResult.data.length;
    }

    backupData.metadata.totalRecords = totalRecords;
    
    console.log(`✅ Database backup completed: ${totalRecords} total records from ${backupData.metadata.totalTables} tables (${format})`);
    
    endTiming('database-backup');
    return backupData;
  }

  static validateBackupData(backupData: any): boolean {
    try {
      if (!backupData.metadata || !backupData.data || !backupData.files) {
        return false;
      }
      
      const { metadata, data, files } = backupData;
      
      if (!metadata.timestamp || !metadata.tables || !Array.isArray(metadata.tables)) {
        return false;
      }
      
      for (const tableName of metadata.tables) {
        if (!(tableName in data) || !(tableName in files)) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Backup validation failed:', error);
      return false;
    }
  }

  static getBackupSummary(backupData: any): {
    totalTables: number;
    totalRecords: number;
    format: string;
    timestamp: string;
    tables: string[];
  } {
    if (!DatabaseBackup.validateBackupData(backupData)) {
      throw new Error('Invalid backup data');
    }
    
    const { metadata, data } = backupData;
    const totalRecords = Object.values(data).reduce((sum: number, tableData: any) => {
      return sum + (Array.isArray(tableData) ? tableData.length : 0);
    }, 0);
    
    return {
      totalTables: metadata.totalTables,
      totalRecords,
      format: metadata.format,
      timestamp: metadata.timestamp,
      tables: metadata.tables
    };
  }
}