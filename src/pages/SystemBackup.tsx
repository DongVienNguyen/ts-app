import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
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
    canAccess,
    performBackup,
    performRestore,
    toggleAutoBackup,
    loadBackupHistory,
    loadBackupStats
  } = useBackupOperations();

  const [selectedRestoreFile, setSelectedRestoreFile] = useState<File | null>(null);

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

  console.log('🔍 SystemBackup DEBUG:', {
    canAccess,
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
        
        {/* Show backup errors */}
        {backupStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Backup Error: {backupStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Show restore errors */}
        {restoreStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Restore Error: {restoreStatus.error}
            </AlertDescription>
          </Alert>
        )}
        
        <BackupProgressCard
          isRunning={backupStatus.isRunning}
          progress={backupStatus.progress}
          currentStep={backupStatus.currentStep}
          estimatedTimeRemaining={backupStatus.estimatedTimeRemaining}
          onCancel={handleCancelBackup}
        />
        
        <Tabs defaultValue="backup" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="backup" disabled={backupStatus.isRunning}>
              Backup
            </TabsTrigger>
            <TabsTrigger value="restore" disabled={backupStatus.isRunning || restoreStatus.isRunning}>
              Restore
            </TabsTrigger>
            <TabsTrigger value="schedule">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="management">
              Management
            </TabsTrigger>
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="backup" className="space-y-6 mt-6">
            <SystemHealthCard />
            
            <BackupStatusCard
              backupStatus={backupStatus}
              onToggleAutoBackup={handleToggleAutoBackup}
            />
            
            <BackupActionsCard
              isRunning={backupStatus.isRunning}
              progress={backupStatus.progress}
              currentStep={backupStatus.currentStep}
              onPerformBackup={handlePerformBackup}
              onRefreshStatus={handleRefreshStatus}
            />
            
            <BackupComponentsCard
              backupItems={backupItems || []}
            />
            
            <BackupInfoAlert />
          </TabsContent>
          
          <TabsContent value="restore" className="space-y-6 mt-6">
            {restoreStatus.isRunning && (
              <BackupProgressCard
                isRunning={restoreStatus.isRunning}
                progress={restoreStatus.progress}
                currentStep={restoreStatus.currentStep}
                estimatedTimeRemaining={restoreStatus.estimatedTimeRemaining}
              />
            )}
            
            <RestorePreviewCard
              selectedFile={selectedRestoreFile}
            />
            
            <RestoreActionsCard
              onRestore={handlePerformRestore}
            />
            
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

          <TabsContent value="schedule" className="space-y-6 mt-6">
            <BackupScheduleCard
              autoBackupEnabled={backupStatus.autoBackupEnabled}
              onToggleAutoBackup={handleToggleAutoBackup}
              lastAutoBackup={localStorage.getItem('lastAutoBackup')}
            />
          </TabsContent>

          <TabsContent value="management" className="space-y-6 mt-6">
            <BackupRetentionCard
              backupHistory={backupHistory || []}
              onRefresh={handleRefreshStatus}
            />
            
            <BackupVerificationCard
              backupHistory={backupHistory || []}
            />
            
            <BackupHistoryCard
              backupHistory={backupHistory || []}
              onRefresh={handleRefreshStatus}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-6">
            <BackupPerformanceCard
              backupHistory={backupHistory || []}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Performance Summary</h3>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Total Backups:</span>
                    <span className="font-medium">{backupHistory?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-medium text-green-600">
                      {backupHistory?.length > 0 
                        ? ((backupHistory.filter(h => h.success).length / backupHistory.length) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Duration:</span>
                    <span className="font-medium">
                      {backupHistory?.length > 0
                        ? Math.round(backupHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / backupHistory.length / 1000)
                        : 0}s
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Storage Efficiency</h3>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span className="font-medium">
                      {((backupHistory?.reduce((sum, h) => sum + (h.size || 0), 0) || 0) / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Compression:</span>
                    <span className="font-medium">~65%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Space Saved:</span>
                    <span className="font-medium text-green-600">
                      {((backupHistory?.reduce((sum, h) => sum + (h.size || 0), 0) || 0) * 0.65 / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <BackupSettingsCard />
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePerformBackup('full')}
                  disabled={backupStatus.isRunning}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Full Backup
                </button>
                <button
                  onClick={() => handlePerformBackup('database')}
                  disabled={backupStatus.isRunning}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Test Database Backup
                </button>
                <button
                  onClick={handleRefreshStatus}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                >
                  Refresh All
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SystemBackup;