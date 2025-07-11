import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

export interface BackupOptions {
  includeTables?: string[];
  excludeTables?: string[];
  includeSystemData?: boolean;
  compress?: boolean;
}

export interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  error?: string;
  timestamp: string;
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

  // Backup single table
  private async backupTable(tableName: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.warn(`Failed to backup table ${tableName}:`, error);
      return [];
    }
  }

  // Create full database backup
  async createDatabaseBackup(options: BackupOptions = {}): Promise<any> {
    const tables = options.includeTables || await this.getAllTables();
    const excludeTables = options.excludeTables || [];
    
    const backupData: any = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: tables.filter(t => !excludeTables.includes(t))
      },
      data: {}
    };

    for (const table of tables) {
      if (!excludeTables.includes(table)) {
        backupData.data[table] = await this.backupTable(table);
      }
    }

    return backupData;
  }

  // Create system configuration backup
  async createConfigBackup(): Promise<any> {
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
        securityMonitoring: true
      },
      settings: {
        theme: 'light',
        responsive: true,
        autoBackup: localStorage.getItem('autoBackupEnabled') === 'true'
      }
    };
  }

  // Create complete system backup
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zip = new JSZip();

      // Database backup
      const databaseBackup = await this.createDatabaseBackup(options);
      zip.file('database/backup.json', JSON.stringify(databaseBackup, null, 2));

      // Configuration backup
      const configBackup = await this.createConfigBackup();
      zip.file('config/settings.json', JSON.stringify(configBackup, null, 2));

      // Edge functions metadata
      const functionsBackup = {
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
        timestamp: new Date().toISOString()
      };
      zip.file('functions/metadata.json', JSON.stringify(functionsBackup, null, 2));

      // Backup metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        type: 'full_system_backup',
        version: '1.0.0',
        description: 'Complete system backup including database, configuration, and metadata'
      };
      zip.file('backup-info.json', JSON.stringify(metadata, null, 2));

      // Generate zip file
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: options.compress !== false ? 'DEFLATE' : 'STORE',
        compressionOptions: { level: 6 }
      });

      const filename = `system-backup-${timestamp}.zip`;
      
      // Create download
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename,
        size: content.size,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Schedule automatic backup
  setupAutoBackup(): void {
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
  }

  // Get backup statistics
  async getBackupStats(): Promise<any> {
    try {
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

      return stats;
    } catch (error) {
      console.error('Error getting backup stats:', error);
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