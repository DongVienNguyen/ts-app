import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

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
}

export class BackupService {
  private static instance: BackupService;

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Get all table names from database
  private async getAllTables(): Promise<string[]> {
    return [
      'staff', 'asset_transactions', 'asset_reminders', 'sent_asset_reminders',
      'crc_reminders', 'sent_crc_reminders', 'other_assets', 'notifications',
      'cbqln', 'cbkh', 'ldpcrc', 'cbcrc', 'quycrc', 'push_subscriptions',
      'system_errors', 'system_metrics', 'system_status', 'user_sessions',
      'security_events', 'asset_history_archive'
    ];
  }

  // Convert JSON data to CSV format
  private convertToCSV(data: any[], tableName: string): string {
    if (!data || data.length === 0) {
      return `# ${tableName} - No data\n`;
    }

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Handle null, undefined, objects, and strings with commas
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return `# Table: ${tableName}\n# Records: ${data.length}\n# Exported: ${new Date().toISOString()}\n${csvHeaders}\n${csvRows.join('\n')}\n`;
  }

  // Backup single table
  private async backupTable(tableName: string, format: 'json' | 'csv' = 'json'): Promise<{ data: any[], content: string }> {
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
        content = this.convertToCSV(tableData, tableName);
      } else {
        content = JSON.stringify({
          table: tableName,
          timestamp: new Date().toISOString(),
          recordCount: tableData.length,
          data: tableData
        }, null, 2);
      }
      
      console.log(`✅ Table ${tableName} backed up: ${tableData.length} records (${format})`);
      return { data: tableData, content };
    } catch (error) {
      console.warn(`❌ Failed to backup table ${tableName}:`, error);
      return { data: [], content: format === 'csv' ? `# ${tableName} - Error: ${error}\n` : '{}' };
    }
  }

  // Create database backup with CSV format
  async createDatabaseBackup(options: BackupOptions = {}): Promise<any> {
    console.log('🗄️ Creating database backup...');
    const tables = options.includeTables || await this.getAllTables();
    const excludeTables = options.excludeTables || [];
    const format = options.exportFormat || 'csv';
    
    const backupData: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        format: format,
        tables: tables.filter(t => !excludeTables.includes(t)),
        totalTables: tables.filter(t => !excludeTables.includes(t)).length
      },
      data: {},
      files: {}
    };

    let totalRecords = 0;
    for (const table of tables) {
      if (!excludeTables.includes(table)) {
        const { data: tableData, content } = await this.backupTable(table, format);
        backupData.data[table] = tableData;
        backupData.files[table] = content;
        totalRecords += tableData.length;
      }
    }

    backupData.metadata.totalRecords = totalRecords;
    console.log(`✅ Database backup completed: ${totalRecords} total records from ${backupData.metadata.totalTables} tables (${format})`);
    
    return backupData;
  }

  // Create configuration backup
  async createConfigBackup(): Promise<any> {
    console.log('⚙️ Creating configuration backup...');
    return {
      timestamp: new Date().toISOString(),
      supabase: {
        url: 'https://itoapoyrxxmtbbuolfhk.supabase.co',
        project_id: 'itoapoyrxxmtbbuolfhk'
      },
      features: {
        authentication: true,
        notifications: true,
        pushNotifications: true,
        errorTracking: true,
        usageTracking: true,
        securityMonitoring: true,
        backupRestore: true
      },
      settings: {
        theme: 'light',
        responsive: true,
        autoBackup: localStorage.getItem('autoBackupEnabled') === 'true',
        language: 'vi-VN'
      },
      version: '1.0.0'
    };
  }

  // Create functions backup
  async createFunctionsBackup(): Promise<any> {
    console.log('🔧 Creating functions backup...');
    return {
      functions: [
        'send-notification-email',
        'login-user', 
        'create-admin-user',
        'test-resend-api',
        'send-push-notification',
        'check-account-status',
        'reset-password',
        'analyze-asset-image'
      ],
      timestamp: new Date().toISOString(),
      count: 8,
      description: 'Supabase Edge Functions metadata and configuration'
    };
  }

  // Create security backup
  async createSecurityBackup(): Promise<any> {
    console.log('🔒 Creating security backup...');
    const securityTables = ['security_events', 'user_sessions', 'system_errors'];
    const securityData: any = {
      timestamp: new Date().toISOString(),
      tables: {},
      summary: {
        totalEvents: 0,
        totalSessions: 0,
        totalErrors: 0
      }
    };

    for (const table of securityTables) {
      try {
        const { data } = await supabase.from(table).select('*');
        securityData.tables[table] = data || [];
        
        if (table === 'security_events') securityData.summary.totalEvents = data?.length || 0;
        if (table === 'user_sessions') securityData.summary.totalSessions = data?.length || 0;
        if (table === 'system_errors') securityData.summary.totalErrors = data?.length || 0;
      } catch (error) {
        console.warn(`Failed to backup security table ${table}:`, error);
        securityData.tables[table] = [];
      }
    }

    return securityData;
  }

  // Create selective backup based on type
  async createSelectiveBackup(backupType: string, options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting ${backupType} backup...`);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zip = new JSZip();
      let backupData: any;
      let filename: string;

      switch (backupType) {
        case 'database':
          backupData = await this.createDatabaseBackup({ ...options, exportFormat: 'csv' });
          filename = `database-backup-${timestamp}.zip`;
          
          // Add CSV files for each table
          for (const [tableName, content] of Object.entries(backupData.files)) {
            zip.file(`database/${tableName}.csv`, content as string);
          }
          
          // Add metadata
          zip.file('database/metadata.json', JSON.stringify(backupData.metadata, null, 2));
          break;

        case 'config':
          backupData = await this.createConfigBackup();
          filename = `config-backup-${timestamp}.zip`;
          zip.file('config/settings.json', JSON.stringify(backupData, null, 2));
          break;

        case 'functions':
          backupData = await this.createFunctionsBackup();
          filename = `functions-backup-${timestamp}.zip`;
          zip.file('functions/metadata.json', JSON.stringify(backupData, null, 2));
          break;

        case 'security':
          backupData = await this.createSecurityBackup();
          filename = `security-backup-${timestamp}.zip`;
          zip.file('security/data.json', JSON.stringify(backupData, null, 2));
          break;

        default:
          throw new Error(`Unknown backup type: ${backupType}`);
      }

      // Generate zip file
      console.log('📦 Generating ZIP file...');
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: options.compress !== false ? 'DEFLATE' : 'STORE',
        compressionOptions: { level: 6 }
      });

      // Create download
      console.log('💾 Initiating download...');
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const duration = Date.now() - startTime;
      console.log(`✅ ${backupType} backup completed successfully in ${duration}ms`);
      console.log(`📁 File: ${filename} (${(content.size / 1024 / 1024).toFixed(2)} MB)`);

      return {
        success: true,
        filename,
        size: content.size,
        timestamp: new Date().toISOString(),
        backupType
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${backupType} backup failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backupType
      };
    }
  }

  // Create complete system backup
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    console.log('🚀 Starting full system backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zip = new JSZip();

      // Database backup with CSV format
      console.log('📊 Creating database backup...');
      const databaseBackup = await this.createDatabaseBackup({ ...options, exportFormat: 'csv' });
      
      // Add CSV files for each table
      for (const [tableName, content] of Object.entries(databaseBackup.files)) {
        zip.file(`database/${tableName}.csv`, content as string);
      }
      zip.file('database/metadata.json', JSON.stringify(databaseBackup.metadata, null, 2));

      // Configuration backup
      console.log('⚙️ Creating configuration backup...');
      const configBackup = await this.createConfigBackup();
      zip.file('config/settings.json', JSON.stringify(configBackup, null, 2));

      // Functions backup
      console.log('🔧 Creating functions backup...');
      const functionsBackup = await this.createFunctionsBackup();
      zip.file('functions/metadata.json', JSON.stringify(functionsBackup, null, 2));

      // Security backup
      console.log('🔒 Creating security backup...');
      const securityBackup = await this.createSecurityBackup();
      zip.file('security/data.json', JSON.stringify(securityBackup, null, 2));

      // Backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        type: 'full_system_backup',
        version: '1.0.0',
        description: 'Complete system backup including database (CSV), configuration, functions, and security data',
        stats: {
          totalTables: databaseBackup.metadata.totalTables,
          totalRecords: databaseBackup.metadata.totalRecords,
          backupDuration: Date.now() - startTime
        }
      };
      zip.file('backup-info.json', JSON.stringify(metadata, null, 2));

      // Generate zip file
      console.log('📦 Generating ZIP file...');
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: options.compress !== false ? 'DEFLATE' : 'STORE',
        compressionOptions: { level: 6 }
      });

      const filename = `full-system-backup-${timestamp}.zip`;
      
      // Create download
      console.log('💾 Initiating download...');
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const duration = Date.now() - startTime;
      console.log(`✅ Full backup completed successfully in ${duration}ms`);
      console.log(`📁 File: ${filename} (${(content.size / 1024 / 1024).toFixed(2)} MB)`);

      return {
        success: true,
        filename,
        size: content.size,
        timestamp: new Date().toISOString(),
        backupType: 'full'
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Full backup failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backupType: 'full'
      };
    }
  }

  // Schedule automatic backup
  setupAutoBackup(): void {
    console.log('⏰ Setting up auto backup scheduler...');
    
    const checkAndBackup = async () => {
      const autoEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      if (!autoEnabled) return;

      const lastAutoBackup = localStorage.getItem('lastAutoBackup');
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      if (!lastAutoBackup || new Date(lastAutoBackup) < yesterday) {
        // Check if it's around 2 AM (within 1 hour window)
        const hour = now.getHours();
        if (hour >= 2 && hour <= 3) {
          console.log('🔄 Starting automatic backup...');
          const result = await this.createFullBackup();
          
          if (result.success) {
            localStorage.setItem('lastAutoBackup', now.toISOString());
            console.log('✅ Automatic backup completed');
          } else {
            console.error('❌ Automatic backup failed:', result.error);
          }
        }
      }
    };

    // Check every hour
    setInterval(checkAndBackup, 60 * 60 * 1000);
    
    // Initial check after 5 minutes
    setTimeout(checkAndBackup, 5 * 60 * 1000);
    
    console.log('✅ Auto backup scheduler initialized');
  }

  // Get backup statistics
  async getBackupStats(): Promise<any> {
    try {
      console.log('📊 Getting backup statistics...');
      const tables = await this.getAllTables();
      const stats: any = {
        totalTables: tables.length,
        tableStats: {},
        totalRecords: 0,
        estimatedSize: 0
      };

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            stats.tableStats[table] = count || 0;
            stats.totalRecords += count || 0;
            stats.estimatedSize += (count || 0) * 1024; // Rough estimate
          }
        } catch (error) {
          stats.tableStats[table] = 0;
        }
      }

      console.log('✅ Backup statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting backup stats:', error);
      return {
        totalTables: 0,
        tableStats: {},
        totalRecords: 0,
        estimatedSize: 0
      };
    }
  }
}

// Export singleton instance
export const backupService = BackupService.getInstance();