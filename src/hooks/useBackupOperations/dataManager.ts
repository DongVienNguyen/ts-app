import { supabase } from '@/integrations/supabase/client';
import type { BackupRecord } from './types';

export const createBackupDataManager = () => {
  const loadBackupHistoryFromStorage = () => {
    try {
      const lastBackup = localStorage.getItem('lastBackupTime');
      const lastRestore = localStorage.getItem('lastRestoreTime');
      const autoEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      const historyData = localStorage.getItem('backupHistory');
      const history = historyData ? JSON.parse(historyData) : [];

      return {
        lastBackup,
        lastRestore,
        autoEnabled,
        history
      };
    } catch (error) {
      console.error('❌ Error loading backup history from storage:', error);
      return {
        lastBackup: null,
        lastRestore: null,
        autoEnabled: false,
        history: []
      };
    }
  };

  const saveBackupRecord = (record: BackupRecord, isAuto: boolean = false) => {
    try {
      // Save timestamps
      localStorage.setItem('lastBackupTime', record.timestamp);
      if (isAuto) {
        localStorage.setItem('lastAutoBackup', record.timestamp);
      }

      // Save to history
      const existingHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      const newHistory = [record, ...existingHistory].slice(0, 10); // Keep last 10
      localStorage.setItem('backupHistory', JSON.stringify(newHistory));

      return newHistory;
    } catch (error) {
      console.error('❌ Error saving backup record:', error);
      return [];
    }
  };

  const loadBackupStats = async () => {
    try {
      console.log('📊 Loading backup statistics...');
      
      // Load basic table counts - limit queries
      const tableQueries = [
        supabase.from('staff').select('*', { count: 'exact', head: true }),
        supabase.from('asset_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('notifications').select('*', { count: 'exact', head: true })
      ];

      const results = await Promise.allSettled(tableQueries);
      
      let totalRecords = 0;
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.count) {
          totalRecords += result.value.count;
        }
      });

      const estimatedSize = totalRecords * 1024; // Rough estimate
      const sizeInMB = (estimatedSize / 1024 / 1024).toFixed(2);

      const stats = {
        size: `${sizeInMB} MB`,
        recordCount: totalRecords
      };

      console.log('✅ Backup stats loaded:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error loading backup stats:', error);
      return {
        size: '0 MB',
        recordCount: 0
      };
    }
  };

  const checkAutoBackupStatus = (autoBackupEnabled: boolean) => {
    if (!autoBackupEnabled) return false;

    const lastAutoBackup = localStorage.getItem('lastAutoBackup');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return !lastAutoBackup || new Date(lastAutoBackup) < yesterday;
  };

  const scheduleAutoBackup = (performBackup: (isAuto: boolean) => Promise<void>) => {
    console.log('⏰ Auto backup is due, scheduling...');
    // Schedule auto backup for next 2 AM
    const nextBackup = new Date();
    nextBackup.setDate(nextBackup.getDate() + 1);
    nextBackup.setHours(2, 0, 0, 0);
    
    const timeUntilBackup = nextBackup.getTime() - Date.now();
    setTimeout(() => performBackup(true), Math.min(timeUntilBackup, 5000));
  };

  const toggleAutoBackupSetting = (enabled: boolean) => {
    localStorage.setItem('autoBackupEnabled', enabled.toString());
  };

  return {
    loadBackupHistoryFromStorage,
    saveBackupRecord,
    loadBackupStats,
    checkAutoBackupStatus,
    scheduleAutoBackup,
    toggleAutoBackupSetting
  };
};