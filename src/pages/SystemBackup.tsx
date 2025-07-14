import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Upload, Clock, Settings, BarChart, Activity, Shield, Database, HardDrive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import RestoreActionsCard from '@/components/backup/RestoreActionsCard';
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

  // Calculate backup metrics for header
  const getBackupMetrics = () => {
    const totalBackups = backupHistory?.length || 0;
    const successfulBackups = backupHistory?.filter(b => b.success).length || 0;
    const successRate = totalBackups > 0 ? Math.round((successfulBackups / totalBackups) * 100) : 0;
    const lastBackupStatus = backupHistory?.[0]?.success ? 'success' : 'failed';
    const isRunning = backupStatus.isRunning || restoreStatus.isRunning;
    
    return { totalBackups, successfulBackups, successRate, lastBackupStatus, isRunning };
  };

  const metrics = getBackupMetrics();

  const tabs = [
    { value: 'backup', label: 'Backup & Restore', icon: Download, disabled: false },
    { value: 'schedule', label: 'Lập lịch', icon: Clock, disabled: false },
    { value: 'management', label: 'Quản lý', icon: Settings, disabled: false },
    { value: 'analytics', label: 'Phân tích', icon: BarChart, disabled: false },
    { value: 'monitoring', label: 'Giám sát', icon: Activity, disabled: false },
  ];

  const renderContent = () => {
    const contentClass = "space-y-6 mt-6";
    switch (activeTab) {
      case 'backup':
        return (
          <div className={contentClass}>
            {/* Quick Actions Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Download className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">Tác vụ Backup & Restore</h3>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <BackupActionsCard 
                  isRunning={backupStatus.isRunning} 
                  progress={backupStatus.progress} 
                  currentStep={backupStatus.currentStep} 
                  onPerformBackup={handlePerformBackup} 
                  onRefreshStatus={handleRefreshStatus} 
                />
                <RestoreActionsCard 
                  onRestore={handlePerformRestore} 
                  restoreStatus={restoreStatus} 
                />
              </div>
            </div>

            {/* System Components */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Thành phần Hệ thống</h3>
                <Badge variant="outline" className="text-xs">Components</Badge>
              </div>
              <BackupComponentsCard backupItems={backupItems || []} />
            </div>

            {/* Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Thông tin Quan trọng</h3>
              </div>
              <BackupInfoAlert />
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className={contentClass}>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-6 w-6 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Lập lịch Backup Tự động</h2>
                <Badge variant="outline" className="ml-2">Automation</Badge>
              </div>
              <BackupScheduleCard 
                autoBackupEnabled={backupStatus.autoBackupEnabled} 
                onToggleAutoBackup={handleToggleAutoBackup} 
                lastAutoBackup={localStorage.getItem('lastAutoBackup')} 
              />
            </div>
          </div>
        );
      case 'management':
        return (
          <div className={contentClass}>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-semibold text-gray-900">Quản lý Backup</h2>
                <Badge variant="outline" className="ml-2">Management Tools</Badge>
              </div>
              <div className="space-y-6">
                <BackupRetentionCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
                <BackupVerificationCard backupHistory={backupHistory || []} />
                <BackupHistoryCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
                <BackupSettingsCard />
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className={contentClass}>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <BarChart className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-gray-900">Phân tích & Báo cáo</h2>
                <Badge variant="outline" className="ml-2">Analytics</Badge>
              </div>
              <BackupAnalyticsCard backupHistory={backupHistory || []} onRefresh={handleRefreshStatus} />
            </div>
          </div>
        );
      case 'monitoring':
        return (
          <div className={contentClass}>
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-semibold text-gray-900">Giám sát Hiệu suất</h2>
                <Badge variant="outline" className="ml-2">Performance</Badge>
              </div>
              <div className="space-y-6">
                <BackupPerformanceCard backupHistory={backupHistory || []} />
                
                {/* Performance Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-900 mb-1">
                          {backupHistory?.length || 0}
                        </div>
                        <div className="text-sm text-blue-700">Tổng số Backup</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-900 mb-1">
                          {metrics.successRate}%
                        </div>
                        <div className="text-sm text-green-700">Tỷ lệ Thành công</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-900 mb-1">
                          {backupHistory?.length > 0 ? Math.round(backupHistory.reduce((sum, h) => sum + (h.duration || 0), 0) / backupHistory.length / 1000) : 0}s
                        </div>
                        <div className="text-sm text-purple-700">Thời gian TB</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-4">
          <BackupHeader />
          
          {/* Backup Metrics Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* System Status */}
            <Card className={`bg-gradient-to-r ${
              metrics.isRunning ? 'from-yellow-50 to-yellow-100 border-yellow-200' :
              metrics.lastBackupStatus === 'success' ? 'from-green-50 to-green-100 border-green-200' :
              'from-red-50 to-red-100 border-red-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    metrics.isRunning ? 'bg-yellow-500' :
                    metrics.lastBackupStatus === 'success' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}>
                    <HardDrive className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      metrics.isRunning ? 'text-yellow-900' :
                      metrics.lastBackupStatus === 'success' ? 'text-green-900' :
                      'text-red-900'
                    }`}>
                      Trạng thái Hệ thống
                    </p>
                    <p className={`text-xs ${
                      metrics.isRunning ? 'text-yellow-700' :
                      metrics.lastBackupStatus === 'success' ? 'text-green-700' :
                      'text-red-700'
                    }`}>
                      {metrics.isRunning ? 'Đang xử lý...' :
                       metrics.lastBackupStatus === 'success' ? 'Sẵn sàng' :
                       'Cần kiểm tra'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      metrics.isRunning ? 'bg-yellow-100 text-yellow-800' :
                      metrics.lastBackupStatus === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {metrics.isRunning ? 'BUSY' :
                     metrics.lastBackupStatus === 'success' ? 'READY' :
                     'ERROR'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Total Backups */}
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Tổng Backup</p>
                    <p className="text-xs text-blue-700">Đã tạo</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {metrics.totalBackups}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Success Rate */}
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Tỷ lệ Thành công</p>
                    <p className="text-xs text-green-700">Backup thành công</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {metrics.successRate}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Auto Backup */}
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-900">Auto Backup</p>
                    <p className="text-xs text-purple-700">
                      {backupStatus.autoBackupEnabled ? 'Đã bật' : 'Đã tắt'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${
                      backupStatus.autoBackupEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {backupStatus.autoBackupEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Alerts */}
        {backupStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Backup Error: {backupStatus.error}</AlertDescription>
          </Alert>
        )}

        {restoreStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Restore Error: {restoreStatus.error}</AlertDescription>
          </Alert>
        )}
        
        {/* Progress Card - Always visible when running */}
        {(backupStatus.isRunning || restoreStatus.isRunning) && (
          <BackupProgressCard 
            isRunning={backupStatus.isRunning || restoreStatus.isRunning} 
            progress={backupStatus.isRunning ? backupStatus.progress : restoreStatus.progress} 
            currentStep={backupStatus.isRunning ? backupStatus.currentStep : restoreStatus.currentStep} 
            estimatedTimeRemaining={backupStatus.isRunning ? backupStatus.estimatedTimeRemaining : restoreStatus.estimatedTimeRemaining} 
            onCancel={handleCancelBackup} 
          />
        )}
        
        {/* Tab Navigation */}
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn chức năng..." />
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

        {/* Tab Content */}
        {renderContent()}

        {/* Footer */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-1">Hệ thống Backup - Tài sản CRC</p>
              <p>
                Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')} | 
                Trạng thái: {metrics.isRunning ? '🟡 Đang xử lý' : metrics.lastBackupStatus === 'success' ? '🟢 Sẵn sàng' : '🔴 Lỗi'} | 
                Auto: {backupStatus.autoBackupEnabled ? '✅ Bật' : '❌ Tắt'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SystemBackup;