import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { DatabaseBackup } from './databaseBackup';
import { ConfigBackup } from './configBackup';
import { SecurityBackup } from './securityBackup';
import { FunctionsBackup } from './functionsBackup';
import { ZipManager } from './zipManager';
import { BackupOptions, BackupResult } from './types';

export class BackupOrchestrator {
  static async createSelectiveBackup(
    backupType: string, 
    options: BackupOptions = {}
  ): Promise<BackupResult> {
    const startTime = Date.now();
    startTiming(`selective-backup-${backupType}`);
    
    console.log(`🚀 Starting ${backupType} backup...`);
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let backupData: any;
      let filename: string;
      let zipContents: { [path: string]: any } = {};

      switch (backupType) {
        case 'database':
          backupData = await DatabaseBackup.createDatabaseBackup({
            ...options, 
            exportFormat: 'csv'
          });
          filename = `database-backup-${timestamp}.zip`;
          
          for (const [tableName, content] of Object.entries(backupData.files)) {
            zipContents[`database/${tableName}.csv`] = content;
          }
          zipContents['database/metadata.json'] = backupData.metadata;
          break;

        case 'config':
          backupData = await ConfigBackup.createConfigBackup();
          filename = `config-backup-${timestamp}.zip`;
          zipContents['config/settings.json'] = backupData;
          break;

        case 'functions':
          backupData = await FunctionsBackup.createFunctionsBackup();
          filename = `functions-backup-${timestamp}.zip`;
          zipContents['functions/metadata.json'] = backupData;
          break;

        case 'security':
          backupData = await SecurityBackup.createSecurityBackup();
          filename = `security-backup-${timestamp}.zip`;
          zipContents['security/data.json'] = backupData;
          break;

        default:
          throw new Error(`Unknown backup type: ${backupType}`);
      }

      const { blob, size } = await ZipManager.createZipFile(zipContents, filename, options);
      ZipManager.downloadZipFile(blob, filename);

      const duration = Date.now() - startTime;
      endTiming(`selective-backup-${backupType}`);
      
      console.log(`✅ ${backupType} backup completed successfully in ${duration}ms`);
      
      return {
        success: true,
        filename,
        size,
        timestamp: new Date().toISOString(),
        backupType,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      endTiming(`selective-backup-${backupType}`);
      
      console.error(`❌ ${backupType} backup failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backupType,
        duration
      };
    }
  }

  static async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    startTiming('full-backup');
    
    console.log('🚀 Starting full system backup...');
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipContents: { [path: string]: any } = {};

      console.log('📊 Creating database backup...');
      const databaseBackup = await DatabaseBackup.createDatabaseBackup({
        ...options, 
        exportFormat: 'csv'
      });
      
      for (const [tableName, content] of Object.entries(databaseBackup.files)) {
        zipContents[`database/${tableName}.csv`] = content;
      }
      zipContents['database/metadata.json'] = databaseBackup.metadata;

      console.log('⚙️ Creating configuration backup...');
      const configBackup = await ConfigBackup.createConfigBackup();
      zipContents['config/settings.json'] = configBackup;

      console.log('🔧 Creating functions backup...');
      const functionsBackup = await FunctionsBackup.createFunctionsBackup();
      zipContents['functions/metadata.json'] = functionsBackup;

      console.log('🔒 Creating security backup...');
      const securityBackup = await SecurityBackup.createSecurityBackup();
      zipContents['security/data.json'] = securityBackup;

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
      zipContents['backup-info.json'] = metadata;

      const filename = `full-system-backup-${timestamp}.zip`;
      const { blob, size } = await ZipManager.createZipFile(zipContents, filename, options);
      ZipManager.downloadZipFile(blob, filename);

      const duration = Date.now() - startTime;
      endTiming('full-backup');
      
      console.log(`✅ Full backup completed successfully in ${duration}ms`);
      console.log(`📁 File: ${filename} (${(size / 1024 / 1024).toFixed(2)} MB)`);

      return {
        success: true,
        filename,
        size,
        timestamp: new Date().toISOString(),
        backupType: 'full',
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      endTiming('full-backup');
      
      console.error(`❌ Full backup failed after ${duration}ms:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        backupType: 'full',
        duration
      };
    }
  }

  static async validateBackupFile(file: File, expectedType?: string): Promise<{
    valid: boolean;
    type?: string;
    errors: string[];
  }> {
    try {
      const contents = await ZipManager.extractZipFile(file);
      const errors: string[] = [];
      let detectedType: string | undefined;

      if (contents['backup-info.json']) {
        detectedType = 'full';
      } else if (contents['database/metadata.json']) {
        detectedType = 'database';
      } else if (contents['config/settings.json']) {
        detectedType = 'config';
      } else if (contents['functions/metadata.json']) {
        detectedType = 'functions';
      } else if (contents['security/data.json']) {
        detectedType = 'security';
      }

      if (!detectedType) {
        errors.push('Unable to detect backup type');
      }

      if (expectedType && detectedType !== expectedType) {
        errors.push(`Expected ${expectedType} backup, but found ${detectedType}`);
      }

      return {
        valid: errors.length === 0,
        type: detectedType,
        errors
      };

    } catch (error) {
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}