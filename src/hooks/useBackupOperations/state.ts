import { useState } from 'react';
import type { BackupStatus, RestoreStatus, BackupItem, BackupRecord, BackupCache } from './types';

const CACHE_DURATION = 10 * 60 * 1000; // 10 phút

export const useBackupState = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastBackup: null,
    autoBackupEnabled: false,
    error: null,
    estimatedTimeRemaining: null
  });

  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>({
    isRunning: false,
    progress: 0,
    currentStep: '',
    lastRestore: null,
    error: null,
    estimatedTimeRemaining: null
  });

  const [backupItems, setBackupItems] = useState<BackupItem[]>([
    {
      id: 'database',
      name: 'Database Tables',
      description: 'All database tables exported as CSV files',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending',
      recordCount: 0
    },
    {
      id: 'functions',
      name: 'Edge Functions',
      description: 'Supabase Edge Functions metadata',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    },
    {
      id: 'config',
      name: 'Configuration',
      description: 'App configuration and settings',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    },
    {
      id: 'security',
      name: 'Security Data',
      description: 'Security events and monitoring data',
      size: '0 MB',
      lastBackup: 'Never',
      status: 'pending'
    }
  ]);

  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>([]);
  const [dataCache, setDataCache] = useState<Map<string, BackupCache>>(new Map());

  // State update helpers
  const updateBackupStatus = (updates: Partial<BackupStatus>) => {
    setBackupStatus(prev => ({ ...prev, ...updates }));
  };

  const updateRestoreStatus = (updates: Partial<RestoreStatus>) => {
    setRestoreStatus(prev => ({ ...prev, ...updates }));
  };

  const updateBackupItems = (updater: (items: BackupItem[]) => BackupItem[]) => {
    setBackupItems(updater);
  };

  const clearCache = () => {
    setDataCache(new Map());
  };

  const getCachedData = (key: string): BackupCache | null => {
    const cached = dataCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached;
    }
    return null;
  };

  const setCachedData = (key: string, data: any) => {
    const newCache = new Map(dataCache);
    newCache.set(key, { data, timestamp: Date.now() });
    setDataCache(newCache);
  };

  return {
    // State
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    dataCache,
    
    // State setters
    setBackupStatus,
    setRestoreStatus,
    setBackupItems,
    setBackupHistory,
    
    // State helpers
    updateBackupStatus,
    updateRestoreStatus,
    updateBackupItems,
    clearCache,
    getCachedData,
    setCachedData
  };
};