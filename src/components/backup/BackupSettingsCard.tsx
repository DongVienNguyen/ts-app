import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Download, Upload, Save, RotateCcw, Info } from 'lucide-react';
import { toast } from 'sonner';

interface BackupSettings {
  autoBackup: boolean;
  scheduleTime: string;
  scheduleFrequency: string;
  backupType: string;
  retentionDays: number;
  maxBackups: number;
  compression: boolean;
  notifications: boolean;
  excludeTables: string[];
  customPath: string;
  description: string;
}

const BackupSettingsCard: React.FC = () => {
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: localStorage.getItem('autoBackupEnabled') === 'true',
    scheduleTime: localStorage.getItem('backupScheduleTime') || '02:00',
    scheduleFrequency: localStorage.getItem('backupScheduleFrequency') || 'daily',
    backupType: localStorage.getItem('backupScheduleType') || 'full',
    retentionDays: parseInt(localStorage.getItem('backupRetentionDays') || '30'),
    maxBackups: parseInt(localStorage.getItem('backupMaxBackups') || '10'),
    compression: true,
    notifications: true,
    excludeTables: [],
    customPath: '',
    description: 'Default backup configuration'
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleSettingChange = (key: keyof BackupSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = () => {
    try {
      // Save to localStorage
      localStorage.setItem('autoBackupEnabled', settings.autoBackup.toString());
      localStorage.setItem('backupScheduleTime', settings.scheduleTime);
      localStorage.setItem('backupScheduleFrequency', settings.scheduleFrequency);
      localStorage.setItem('backupScheduleType', settings.backupType);
      localStorage.setItem('backupRetentionDays', settings.retentionDays.toString());
      localStorage.setItem('backupMaxBackups', settings.maxBackups.toString());
      localStorage.setItem('backupCompression', settings.compression.toString());
      localStorage.setItem('backupNotifications', settings.notifications.toString());
      localStorage.setItem('backupExcludeTables', JSON.stringify(settings.excludeTables));
      localStorage.setItem('backupCustomPath', settings.customPath);
      localStorage.setItem('backupDescription', settings.description);

      toast.success('Backup settings saved successfully');
      console.log('💾 Backup settings saved:', settings);
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      toast.error('Failed to save backup settings');
    }
  };

  const handleExportSettings = async () => {
    setIsExporting(true);
    
    try {
      const exportData = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        settings: settings,
        metadata: {
          exportedBy: 'System Backup Manager',
          description: 'Backup configuration export'
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup settings exported successfully');
      console.log('📤 Settings exported:', exportData);
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error('Failed to export settings');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (!importData.settings) {
          throw new Error('Invalid settings file format');
        }

        setSettings(importData.settings);
        toast.success('Backup settings imported successfully');
        console.log('📥 Settings imported:', importData);
      } catch (error) {
        console.error('❌ Import failed:', error);
        toast.error('Failed to import settings: Invalid file format');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleResetSettings = () => {
    const defaultSettings: BackupSettings = {
      autoBackup: false,
      scheduleTime: '02:00',
      scheduleFrequency: 'daily',
      backupType: 'full',
      retentionDays: 30,
      maxBackups: 10,
      compression: true,
      notifications: true,
      excludeTables: [],
      customPath: '',
      description: 'Default backup configuration'
    };

    setSettings(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Backup Settings
        </CardTitle>
        <CardDescription>
          Configure and manage backup system settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Basic Configuration</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">Schedule Time</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={settings.scheduleTime}
                onChange={(e) => handleSettingChange('scheduleTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retention Days</Label>
              <Input
                id="retentionDays"
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) => handleSettingChange('retentionDays', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxBackups">Max Backups</Label>
              <Input
                id="maxBackups"
                type="number"
                min="1"
                max="100"
                value={settings.maxBackups}
                onChange={(e) => handleSettingChange('maxBackups', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customPath">Custom Path</Label>
              <Input
                id="customPath"
                placeholder="/path/to/backups"
                value={settings.customPath}
                onChange={(e) => handleSettingChange('customPath', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Advanced Options</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Auto Backup</Label>
                <p className="text-sm text-gray-500">Enable automatic scheduled backups</p>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="compression">Compression</Label>
                <p className="text-sm text-gray-500">Compress backup files to save space</p>
              </div>
              <Switch
                id="compression"
                checked={settings.compression}
                onCheckedChange={(checked) => handleSettingChange('compression', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-gray-500">Send notifications for backup events</p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe this backup configuration..."
            value={settings.description}
            onChange={(e) => handleSettingChange('description', e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>

          <Button
            onClick={handleExportSettings}
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Settings
              </>
            )}
          </Button>

          <Button variant="outline" className="relative">
            <Upload className="mr-2 h-4 w-4" />
            Import Settings
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isImporting}
            />
          </Button>

          <Button onClick={handleResetSettings} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Settings Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Settings Management:</strong> Export your backup configuration to share 
            across systems or create backups of your settings. Import previously exported 
            configurations to quickly restore your backup setup.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default BackupSettingsCard;