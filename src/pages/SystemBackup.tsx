import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BackupHeader from '@/components/backup/BackupHeader';
import BackupStatusCard from '@/components/backup/BackupStatusCard';
import BackupActionsCard from '@/components/backup/BackupActionsCard';
import BackupComponentsCard from '@/components/backup/BackupComponentsCard';
import BackupInfoAlert from '@/components/backup/BackupInfoAlert';
import BackupHistoryCard from '@/components/backup/BackupHistoryCard';
import BackupProgressCard from '@/components/backup/BackupProgressCard';
import SystemHealthCard from '@/components/backup/SystemHealthCard';
import RestoreActionsCard from '@/components/backup/RestoreActionsCard';
import RestorePreviewCard from '@/components/backup/RestorePreviewCard';
import { useBackupOperations } from '@/hooks/useBackupOperations';
import Layout from '@/components/Layout';

const SystemBackup: React.FC = () => {
  const {
    backupStatus,
    restoreStatus,
    backupItems,
    backupHistory,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory,
    loadBackupStats
  } = useBackupOperations();

  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

  const handlePerformBackup = () => {
    console.log('🔄 SystemBackup: Starting backup process...');
    performBackup(false);
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
    // Note: This would need to be implemented in the hook
    // For now, just show a warning
    alert('Backup cancellation is not yet implemented. Please wait for completion.');
  };

  console.log('🔍 SystemBackup DEBUG:', {
    backupStatus,
    restoreStatus,
    backupItemsCount: backupItems?.length || 0,
    backupHistoryCount: backupHistory?.length || 0,
    selectedRestoreFile: selectedRestoreFile?.name || null
  });

  return (
    <Layout>
      <div className="space-y-6">
        <BackupHeader />
        
        {/* Backup Progress Card - Shows when backup is running */}
        <BackupProgressCard
          isRunning={backupStatus.isRunning}
          progress={backupStatus.progress}
          currentStep={backupStatus.currentStep}
          estimatedTimeRemaining={backupStatus.estimatedTimeRemaining}
          onCancel={handleCancelBackup}
        />
        
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="backup" disabled={backupStatus.isRunning}>
              Backup
            </TabsTrigger>
            <TabsTrigger value="restore" disabled={backupStatus.isRunning || restoreStatus.isRunning}>
              Restore
            </TabsTrigger>
            <TabsTrigger value="history">
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-6 mt-6">
            {/* System Health Check */}
            <SystemHealthCard />
            
            {/* Backup Status */}
            <BackupStatusCard
              backupStatus={backupStatus}
              onToggleAutoBackup={handleToggleAutoBackup}
            />
            
            {/* Backup Actions */}
            <BackupActionsCard
              isRunning={backupStatus.isRunning}
              progress={backupStatus.progress}
              currentStep={backupStatus.currentStep}
              onPerformBackup={handlePerformBackup}
              onRefreshStatus={handleRefreshStatus}
            />
            
            {/* Backup Components */}
            <BackupComponentsCard
              backupItems={backupItems || []}
            />
            
            {/* Information */}
            <BackupInfoAlert />
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-6 mt-6">
            {/* Restore Progress (similar to backup progress) */}
            {restoreStatus.isRunning && (
              <BackupProgressCard
                isRunning={restoreStatus.isRunning}
                progress={restoreStatus.progress}
                currentStep={restoreStatus.currentStep}
                estimatedTimeRemaining={restoreStatus.estimatedTimeRemaining}
              />
            )}
            
            {/* Restore Preview */}
            <RestorePreviewCard
              selectedFile={selectedRestoreFile}
            />
            
            {/* Restore Actions */}
            <RestoreActionsCard
              onRestore={handlePerformRestore}
            />
            
            {/* Last Restore Info */}
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
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            {/* Backup History */}
            <BackupHistoryCard
              backupHistory={backupHistory || []}
              onRefresh={handleRefreshStatus}
            />
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Quick Backup</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Create a backup right now without waiting for scheduled time.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handlePerformBackup}
                    disabled={backupStatus.isRunning}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {backupStatus.isRunning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Backup'
                    )}
                  </button>
                  <button
                    onClick={handleRefreshStatus}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  >
                    Refresh
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Backup Statistics</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Backups:</span>
                    <span className="font-medium">{backupHistory?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Successful:</span>
                    <span className="font-medium text-green-600">
                      {backupHistory?.filter(h => h.success).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">
                      {backupHistory?.filter(h => !h.success).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto Backup:</span>
                    <span className={`font-medium ${backupStatus.autoBackupEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {backupStatus.autoBackupEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SystemBackup;