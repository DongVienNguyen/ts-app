import { startTiming, endTiming } from '@/utils/performanceMonitor';
import { ConfigBackupData } from './types';

export class ConfigBackup {
  static async createConfigBackup(): Promise<ConfigBackupData> {
    startTiming('config-backup');
    
    console.log('⚙️ Creating configuration backup...');
    
    const configData: ConfigBackupData = {
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
      settings: ConfigBackup.getAppSettings(),
      version: '1.0.0'
    };
    
    console.log('✅ Configuration backup created');
    endTiming('config-backup');
    return configData;
  }

  private static getAppSettings(): { [key: string]: any } {
    return {
      theme: 'light',
      responsive: true,
      autoBackup: localStorage.getItem('autoBackupEnabled') === 'true',
      language: 'vi-VN'
    };
  }

  static validateConfigData(configData: any): boolean {
    try {
      return !!(
        configData &&
        configData.timestamp &&
        configData.supabase &&
        configData.features &&
        configData.settings &&
        configData.version
      );
    } catch (error) {
      console.error('❌ Config validation failed:', error);
      return false;
    }
  }
}