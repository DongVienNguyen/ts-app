import { supabase } from '@/integrations/supabase/client';
import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { CSVConverter } from './csvConverter';
import { TableBackupResult } from './types';

export class TableBackup {
  static async getAllTables(): Promise<string[]> {
    return [
      'staff', 'asset_transactions', 'asset_reminders', 'sent_asset_reminders',
      'crc_reminders', 'sent_crc_reminders', 'other_assets', 'notifications',
      'cbqln', 'cbkh', 'ldpcrc', 'cbcrc', 'quycrc', 'push_subscriptions',
      'system_errors', 'system_metrics', 'system_status', 'user_sessions',
      'security_events', 'asset_history_archive'
    ];
  }

  static async backupTable(
    tableName: string, 
    format: 'json' | 'csv' = 'json'
  ): Promise<TableBackupResult> {
    startTiming(`backup-table-${tableName}`);
    
    try {
      console.log(`📊 Backing up table: ${tableName} (${format})`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) {
        console.warn(`⚠️ Failed to backup table ${tableName}:`, error);
        throw error;
      }
      
      const tableData = data || [];
      let content: string;

      if (format === 'csv') {
        content = CSVConverter.convertToCSV(tableData, tableName);
      } else {
        content = JSON.stringify({
          table: tableName,
          timestamp: new Date().toISOString(),
          recordCount: tableData.length,
          data: tableData
        }, null, 2);
      }
      
      console.log(`✅ Table ${tableName} backed up: ${tableData.length} records (${format})`);
      endTiming(`backup-table-${tableName}`);
      
      return { data: tableData, content };
    } catch (error) {
      console.warn(`❌ Failed to backup table ${tableName}:`, error);
      endTiming(`backup-table-${tableName}`);
      
      const errorContent = format === 'csv' 
        ? `# ${tableName} - Error: ${error}\n` 
        : JSON.stringify({ error: error?.toString(), table: tableName }, null, 2);
        
      return { data: [], content: errorContent };
    }
  }

  static async backupTables(
    tableNames: string[], 
    format: 'json' | 'csv' = 'json',
    onProgress?: (current: number, total: number, tableName: string) => void
  ): Promise<{ [tableName: string]: TableBackupResult }> {
    startTiming('backup-multiple-tables');
    
    const results: { [tableName: string]: TableBackupResult } = {};
    
    for (let i = 0; i < tableNames.length; i++) {
      const tableName = tableNames[i];
      
      if (onProgress) {
        onProgress(i + 1, tableNames.length, tableName);
      }
      
      results[tableName] = await TableBackup.backupTable(tableName, format);
    }
    
    endTiming('backup-multiple-tables');
    return results;
  }

  static async getAllTableStats(): Promise<{
    totalTables: number;
    tableStats: { [key: string]: number };
    totalRecords: number;
    estimatedSize: number;
  }> {
    startTiming('get-all-table-stats');
    
    try {
      const tables = await TableBackup.getAllTables();
      const stats = {
        totalTables: tables.length,
        tableStats: {} as { [key: string]: number },
        totalRecords: 0,
        estimatedSize: 0
      };

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error && count !== null) {
            stats.tableStats[table] = count;
            stats.totalRecords += count;
            stats.estimatedSize += count * 1024;
          } else {
            stats.tableStats[table] = 0;
          }
        } catch (error) {
          stats.tableStats[table] = 0;
        }
      }

      console.log('✅ Table statistics calculated:', stats);
      endTiming('get-all-table-stats');
      return stats;
    } catch (error) {
      console.error('❌ Error getting table stats:', error);
      endTiming('get-all-table-stats');
      return {
        totalTables: 0,
        tableStats: {},
        totalRecords: 0,
        estimatedSize: 0
      };
    }
  }
}