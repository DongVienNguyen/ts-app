import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

export interface RestoreOptions {
  restoreTables?: string[];
  skipTables?: string[];
  validateData?: boolean;
  createBackupBeforeRestore?: boolean;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  skippedTables: string[];
  errors: string[];
  timestamp: string;
}

export class RestoreService {
  private static instance: RestoreService;

  static getInstance(): RestoreService {
    if (!RestoreService.instance) {
      RestoreService.instance = new RestoreService();
    }
    return RestoreService.instance;
  }

  // Parse backup file
  private async parseBackupFile(file: File): Promise<any> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    // Check if it's a valid backup file
    const backupInfo = zipContent.file('backup-info.json');
    if (!backupInfo) {
      throw new Error('File không phải là backup hợp lệ (thiếu backup-info.json)');
    }

    const backupInfoContent = await backupInfo.async('text');
    const backupMetadata = JSON.parse(backupInfoContent);

    // Get database backup
    const databaseFile = zipContent.file('database/backup.json');
    if (!databaseFile) {
      throw new Error('Không tìm thấy dữ liệu database trong backup');
    }

    const databaseContent = await databaseFile.async('text');
    const databaseData = JSON.parse(databaseContent);

    // Get configuration
    const configFile = zipContent.file('config/settings.json');
    let configData = null;
    if (configFile) {
      const configContent = await configFile.async('text');
      configData = JSON.parse(configContent);
    }

    return {
      metadata: backupMetadata,
      database: databaseData,
      config: configData
    };
  }

  // Validate backup data
  private validateBackupData(backupData: any): void {
    if (!backupData.database || !backupData.database.data) {
      throw new Error('Dữ liệu backup không hợp lệ');
    }

    if (!backupData.metadata || !backupData.metadata.timestamp) {
      throw new Error('Metadata backup không hợp lệ');
    }

    // Check if backup is too old (more than 30 days)
    const backupDate = new Date(backupData.metadata.timestamp);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    if (backupDate < thirtyDaysAgo) {
      console.warn('⚠️ Backup cũ hơn 30 ngày, có thể không tương thích');
    }
  }

  // Restore single table
  private async restoreTable(tableName: string, data: any[]): Promise<boolean> {
    try {
      if (!data || data.length === 0) {
        console.log(`Table ${tableName} is empty, skipping...`);
        return true;
      }

      // Delete existing data (be careful!)
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        console.warn(`Warning deleting from ${tableName}:`, deleteError);
      }

      // Insert new data in batches
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert(batch);

        if (insertError) {
          throw new Error(`Error inserting into ${tableName}: ${insertError.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to restore table ${tableName}:`, error);
      throw error;
    }
  }

  // Create backup before restore
  private async createPreRestoreBackup(): Promise<void> {
    try {
      // Use the existing backup service
      const { backupService } = await import('./backupService');
      await backupService.createFullBackup({
        compress: true
      });
      console.log('✅ Pre-restore backup created');
    } catch (error) {
      console.warn('⚠️ Failed to create pre-restore backup:', error);
      // Don't throw error, just warn
    }
  }

  // Restore configuration
  private async restoreConfiguration(configData: any): Promise<void> {
    if (!configData) return;

    try {
      // Restore auto backup setting
      if (configData.settings?.autoBackup !== undefined) {
        localStorage.setItem('autoBackupEnabled', configData.settings.autoBackup.toString());
      }

      // Restore other settings as needed
      console.log('✅ Configuration restored');
    } catch (error) {
      console.warn('⚠️ Failed to restore configuration:', error);
    }
  }

  // Main restore function
  async restoreFromFile(
    file: File, 
    options: RestoreOptions = {},
    onProgress?: (progress: number, step: string) => void
  ): Promise<RestoreResult> {
    const result: RestoreResult = {
      success: false,
      restoredTables: [],
      skippedTables: [],
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      onProgress?.(5, 'Đang đọc file backup...');
      
      // Parse backup file
      const backupData = await this.parseBackupFile(file);
      
      onProgress?.(10, 'Đang xác thực dữ liệu backup...');
      
      // Validate backup data
      this.validateBackupData(backupData);

      // Create pre-restore backup if requested
      if (options.createBackupBeforeRestore) {
        onProgress?.(15, 'Đang tạo backup trước khi restore...');
        await this.createPreRestoreBackup();
      }

      onProgress?.(25, 'Bắt đầu restore dữ liệu...');

      // Get tables to restore
      const allTables = Object.keys(backupData.database.data);
      const tablesToRestore = options.restoreTables || allTables;
      const skipTables = options.skipTables || [];

      // Restore tables
      let completedTables = 0;
      for (const tableName of tablesToRestore) {
        if (skipTables.includes(tableName)) {
          result.skippedTables.push(tableName);
          continue;
        }

        try {
          const progress = 25 + (completedTables / tablesToRestore.length) * 60;
          onProgress?.(progress, `Đang restore bảng ${tableName}...`);

          await this.restoreTable(tableName, backupData.database.data[tableName]);
          result.restoredTables.push(tableName);
        } catch (error) {
          const errorMsg = `Table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.error('Restore table error:', errorMsg);
        }

        completedTables++;
      }

      onProgress?.(90, 'Đang restore cấu hình...');
      
      // Restore configuration
      await this.restoreConfiguration(backupData.config);

      onProgress?.(100, 'Restore hoàn tất!');

      result.success = result.errors.length === 0;
      
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      console.error('Restore failed:', error);
      
      return result;
    }
  }

  // Get restore preview (what will be restored)
  async getRestorePreview(file: File): Promise<any> {
    try {
      const backupData = await this.parseBackupFile(file);
      
      const preview = {
        metadata: backupData.metadata,
        tables: Object.keys(backupData.database.data).map(tableName => ({
          name: tableName,
          recordCount: backupData.database.data[tableName]?.length || 0
        })),
        hasConfiguration: !!backupData.config,
        totalRecords: Object.values(backupData.database.data)
          .reduce((total: number, tableData: any) => total + (tableData?.length || 0), 0)
      };

      return preview;
    } catch (error) {
      throw new Error(`Cannot preview backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const restoreService = RestoreService.getInstance();