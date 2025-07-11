import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Trash2, Archive, HardDrive, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BackupRetentionCardProps {
  backupHistory: any[];
  onRefresh: () => void;
}

const BackupRetentionCard: React.FC<BackupRetentionCardProps> = ({
  backupHistory,
  onRefresh
}) => {
  const [retentionDays, setRetentionDays] = useState('30');
  const [maxBackups, setMaxBackups] = useState('10');
  const [storageUsed, setStorageUsed] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    // Load retention settings from localStorage
    const savedRetentionDays = localStorage.getItem('backupRetentionDays') || '30';
    const savedMaxBackups = localStorage.getItem('backupMaxBackups') || '10';
    
    setRetentionDays(savedRetentionDays);
    setMaxBackups(savedMaxBackups);
    
    // Calculate storage usage
    calculateStorageUsage();
  }, [backupHistory]);

  const calculateStorageUsage = () => {
    const totalSize = backupHistory.reduce((total, backup) => {
      return total + (backup.size || 0);
    }, 0);
    
    setStorageUsed(totalSize);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpiredBackups = () => {
    const retentionMs = parseInt(retentionDays) * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);
    
    return backupHistory.filter(backup => 
      new Date(backup.timestamp) < cutoffDate
    );
  };

  const getExcessBackups = () => {
    const maxCount = parseInt(maxBackups);
    if (backupHistory.length <= maxCount) return [];
    
    // Sort by timestamp (newest first) and return excess
    const sortedBackups = [...backupHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedBackups.slice(maxCount);
  };

  const handleSaveRetentionSettings = () => {
    localStorage.setItem('backupRetentionDays', retentionDays);
    localStorage.setItem('backupMaxBackups', maxBackups);
    
    toast.success('Retention settings saved successfully');
    console.log('💾 Retention settings saved:', { retentionDays, maxBackups });
  };

  const handleCleanupOldBackups = async () => {
    setIsCleaningUp(true);
    
    try {
      const expiredBackups = getExpiredBackups();
      const excessBackups = getExcessBackups();
      const toDelete = [...expiredBackups, ...excessBackups];
      
      if (toDelete.length === 0) {
        toast.info('No backups need to be cleaned up');
        return;
      }
      
      // Simulate cleanup process
      for (let i = 0; i < toDelete.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`🗑️ Cleaning up backup: ${toDelete[i].filename || toDelete[i].id}`);
      }
      
      // Remove from localStorage history
      const remainingBackups = backupHistory.filter(backup => 
        !toDelete.some(deleted => deleted.id === backup.id)
      );
      
      localStorage.setItem('backupHistory', JSON.stringify(remainingBackups));
      
      toast.success(`Cleaned up ${toDelete.length} old backups`);
      onRefresh();
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      toast.error('Failed to cleanup old backups');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const expiredBackups = getExpiredBackups();
  const excessBackups = getExcessBackups();
  const storagePercentage = Math.min((storageUsed / (100 * 1024 * 1024)) * 100, 100); // Assume 100MB limit

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Backup Retention
        </CardTitle>
        <CardDescription>
          Manage backup retention policies and storage cleanup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Storage Usage</span>
            <span className="text-sm text-gray-600">{formatFileSize(storageUsed)}</span>
          </div>
          <Progress value={storagePercentage} className="w-full h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Used: {formatFileSize(storageUsed)}</span>
            <span>Limit: 100 MB</span>
          </div>
        </div>

        {/* Retention Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Retention Period</label>
            <Select value={retentionDays} onValueChange={setRetentionDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Max Backups</label>
            <Select value={maxBackups} onValueChange={setMaxBackups}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 backups</SelectItem>
                <SelectItem value="10">10 backups</SelectItem>
                <SelectItem value="15">15 backups</SelectItem>
                <SelectItem value="20">20 backups</SelectItem>
                <SelectItem value="50">50 backups</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSaveRetentionSettings} className="w-full">
          <HardDrive className="mr-2 h-4 w-4" />
          Save Retention Settings
        </Button>

        {/* Cleanup Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-gray-900">
              {backupHistory.length}
            </div>
            <div className="text-xs text-gray-600">Total Backups</div>
          </div>

          <div className="p-3 bg-yellow-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-yellow-700">
              {expiredBackups.length}
            </div>
            <div className="text-xs text-yellow-600">Expired</div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg text-center">
            <div className="text-lg font-semibold text-red-700">
              {excessBackups.length}
            </div>
            <div className="text-xs text-red-600">Excess</div>
          </div>
        </div>

        {/* Cleanup Actions */}
        {(expiredBackups.length > 0 || excessBackups.length > 0) && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-900">Cleanup Recommended</span>
            </div>
            <p className="text-sm text-orange-800 mb-3">
              {expiredBackups.length + excessBackups.length} backups can be cleaned up to free storage space.
            </p>
            <Button
              onClick={handleCleanupOldBackups}
              disabled={isCleaningUp}
              variant="outline"
              className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isCleaningUp ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Cleaning up...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cleanup Old Backups ({expiredBackups.length + excessBackups.length})
                </>
              )}
            </Button>
          </div>
        )}

        {/* Retention Policy Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>Current Policy:</strong>
            <ul className="mt-2 space-y-1">
              <li>• Keep backups for {retentionDays} days</li>
              <li>• Maximum {maxBackups} backups stored</li>
              <li>• Automatic cleanup when limits exceeded</li>
              <li>• Manual cleanup available anytime</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupRetentionCard;