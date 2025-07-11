import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Upload, Clock, ListTodo, BarChart, Activity, Settings } from 'lucide-react';
import BackupHeader from '@/components/backup/BackupHeader';
import BackupStatusCard from '@/components/backup/BackupStatusCard';
import BackupActionsCard from '@/components/backup/BackupActionsCard';
import BackupComponentsCard from '@/components/backup/BackupComponentsCard';
import BackupInfoAlert from '@/components/backup/BackupInfoAlert';
import BackupHistoryCard from '@/components/backup/BackupHistoryCard';
import BackupProgressCard from '@/components/backup/BackupProgressCard';
import BackupScheduleCard from '@/components/backup/BackupScheduleCard';
import BackupRetentionCard from '@/components/backup/BackupRetentionCard';
import BackupVerificationCard from '@/components/backup/BackupVerificationCard';
import BackupSettingsCard from '@/components/backup/BackupSettingsCard';
import BackupPerformanceCard from '@/components/backup/BackupPerformanceCard';
import BackupAnalyticsCard from '@/components/backup/BackupAnalyticsCard';
import SystemHealthCard from '@/components/backup/SystemHealthCard';
import RestoreActionsCard from '@/components/backup/RestoreActionsCard';
import RestorePreviewCard from '@/components/backup/RestorePreviewCard';
import { useBackupOperations } from '@/hooks/useBackupOperations';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';

const SystemBackup: React.FC = () => {
  const {
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    canAccess,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory,
    loadBackupStats
  } = useBackupOperations();

  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('backup');

  // Add cleanup for Supabase channels to help with bfcache
  useEffect(() => {
    return () => {
      const channels = supabase.getChannels();
      if (channels.length > 0) {
        console.log('Unmounting SystemBackup: Removing Supabase real-time channels to allow bfcache.');
        supabase.removeAllChannels();
      }
    };
  }, []);

  // Show access denied for non-admin users
  if (canAccess === false) {
    return (
      <Layout>
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chỉ admin mới có thể truy cập trang System Backup.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  // Show loading state while checking access
  if (canAccess === undefined) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handlePerformBackup = (backupType: string = 'full') => {
    console.log('🔄 SystemBackup: Starting backup process...', { backupType });
    performBackup(false, backupType);
  };

  const handlePerformRestore = async (file: File) => {
    console.log('🔄 SystemBackup: Starting restore process with file:', file.name);
    setSelectedRestoreFile(file);
    await performRestore(file);
  };

  const handleRefreshStatus = () => {
    console.log('🔄 SystemBackup: Refreshing backup status...');
    loadBackupHistory();
    loadBackupStats();
  };

  const handleToggleAutoBackup = (enabled: boolean) => {
    console.log('🔄 SystemBackup: Toggling auto backup:', enabled);
    toggleAutoBackup(enabled);
  };

  const handleCancelBackup = () => {
    console.log('🛑 SystemBackup: Canceling backup...');
    alert('Backup cancellation is not yet implemented. Please wait for completion.');
  };

  const tabs = [
    { value: 'backup', label: 'Backup', icon: Download, disabled: backupStatus.isRunning },
    { value: 'restore', label: 'Restore', icon: Upload, disabled: backupStatus.isRunning || restoreStatus.isRunning },
    { value: 'schedule', label: 'Schedule', icon: Clock, disabled: false },
    { value: 'management', label: 'Management', icon: ListTodo, disabled: false },
    { value: 'analytics', label: 'Analytics', icon: BarChart, disabled: false },
    { value: 'monitoring', label: 'Monitoring', icon: Activity, disabled: false },
    { value: 'settings', label: 'Settings', icon: Settings, disabled: false },
  ];

  const renderContent = () => {
    const contentClass = "space-y-6 mt-6";
    switch (activeTab) {
      case 'backup':
        return (
          <div className={contentClass}>
            <SystemHealthCard />
            <BackupStatusCard backupStatus={backupStatus} onToggleAutoBackup={handleToggleAutoBackup} />
            <BackupActionsCard isRunning={backupStatus.isRunning} progress={backupStatus.progress} currentStep={backupStatus.currentStep} onPerformBackup={handlePerformBackup} onRefreshStatus={handleRefreshStatus} />
            <BackupComponentsCard backupItems={backupItems || []} />
            <BackupInfoAlert />
          </div>
        );
      case 'restore':
        return (
          <div className={contentClass}>
            {restoreStatus.isRunning && (
              <BackupProgressCard isRunning={restoreStatus.isRunning} progress={restoreStatus.progress} currentStep={restoreStatus.currentStep} estimatedTimeRemaining={restoreStatus.estimatedTimeRemaining} />
            )}
            <RestorePreviewCard selectedFile={selectedRestoreFile} />
            <RestoreActionsCard onRestore={handlePerformRestore} />
            {restoreStatus.lastRestore && (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Last Restore:</strong> {new Date(restoreStatus.lastRestore).toLocaleString('vi-VN')}
                </p>
                {restoreStatus.error && (
                  <p className="text-sm text-red-600 mt-1">
                    <strong>Last Error:</strong> {restoreStatus.error}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      case 'schedule':
        return (
          <div className={contentClass}>
            <BackupScheduleCard autoBackupEnabled={backupStatus.autoBackupEnabled} onToggleAutoBackup={handleToggleAutoBackup} lastAutoBackup={localStorage.getItem('lastAutoBackup')} />
          </div>
        );
      case 'management':
        return (
          <div className={contentClass}>
            <BackupRetentionCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
            <BackupVerificationCard backupHistory={backupHistory || []} />
            <BackupHistoryCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
          </div>
        );
      case 'analytics':
        return (
          <div className={contentClass}>
            <BackupAnalyticsCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
          </div>
        );
      case 'monitoring':
        return (
          <div className={contentClass}>
            <SystemHealthCard />
            <BackupPerformanceCard backupHistory={backupHistory || []} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">System Performance</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between"><span>Total Backups:</span><span className="font-medium">{backupHistory?.length || 0}</span></div>
                  <div className="flex justify-between"><span>Success Rate:</span><span className="font-medium text-green-600">{backupHistory?.length > 0 ? ((backupHistory.filter(h => h.success).length / backupHistory.length) * 100).toFixed(1) : 0}%</span></div>
                  <div className="flex justify-between"><span>Avg Duration:</span><span className="font-medium">{backupHistory?.length > 0 ? Math.round(backupHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / backupHistory.length / 1000) : 0}s</span></div>
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Storage Efficiency</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between"><span>Total Size:</span><span className="font-medium">{((backupHistory?.reduce((sum, h) => sum + (h.size || 0), 0) || 0) / 1024 / 1024).toFixed(1)} MB</span></div>
                  <div className="flex justify-between"><span>Avg Compression:</span><span className="font-medium">~65%</span></div>
                  <div className="flex justify-between"><span>Space Saved:</span><span className="font-medium text-green-600">{((backupHistory?.reduce((sum, h) => sum + (h.size || 0), 0) || 0) * 0.65 / 1024 / 1024).toFixed(1)} MB</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className={contentClass}>
            <BackupSettingsCard />
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => handlePerformBackup('full')} disabled={backupStatus.isRunning} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Test Full Backup</button>
                <button onClick={() => handlePerformBackup('database')} disabled={backupStatus.isRunning} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Test Database Backup</button>
                <button onClick={() => handlePerformBackup('config')} disabled={backupStatus.isRunning} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Test Config Backup</button>
                <button onClick={() => handlePerformBackup('security')} disabled={backupStatus.isRunning} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed">Test Security Backup</button>
                <button onClick={handleRefreshStatus} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">Refresh All</button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <BackupHeader />
        
        {backupStatus.error && (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Backup Error: {backupStatus.error}</AlertDescription></Alert>
        )}

        {restoreStatus.error && (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Restore Error: {restoreStatus.error}</AlertDescription></Alert>
        )}
        
        <BackupProgressCard isRunning={backupStatus.isRunning} progress={backupStatus.progress} currentStep={backupStatus.currentStep} estimatedTimeRemaining={backupStatus.estimatedTimeRemaining} onCancel={handleCancelBackup} />
        
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn một mục..." />
          </SelectTrigger>
          <SelectContent>
            {tabs.map(tab => (
              <SelectItem key={tab.value} value={tab.value} disabled={tab.disabled}>
                <div className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {renderContent()}
      </div>
    </Layout>
  );
};

export default SystemBackup;