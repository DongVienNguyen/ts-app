import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface RestoreStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  success: boolean;
}

interface RestoreActionsCardProps {
  onRestore: (file: File) => Promise<void>;
  restoreStatus: RestoreStatus; // Receive restoreStatus as a prop
}

const RestoreActionsCard: React.FC<RestoreActionsCardProps> = ({ onRestore, restoreStatus }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null); // Keep selectedFile state
  const [dragOver, setDragOver] = React.useState(false);
  // Removed internal restoreStatus state, now using prop

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    console.log('📁 File selected:', file.name, file.size);
    
    if (!file.name.endsWith('.zip')) {
      toast.error('Vui lòng chọn file backup có định dạng .zip');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('File quá lớn. Vui lòng chọn file nhỏ hơn 100MB');
      return;
    }

    setSelectedFile(file);
    // setRestoreStatus(prev => ({ ...prev, error: null, success: false })); // No longer needed here
    toast.success('File backup đã được chọn');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    // setRestoreStatus(prev => ({ ...prev, error: null, success: false })); // No longer needed here
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartRestore = async () => { // Renamed to avoid conflict with prop
    if (!selectedFile) {
      toast.error('Vui lòng chọn file backup');
      return;
    }

    console.log('🚀 Starting restore with file:', selectedFile.name);
    // The restoreStatus is now managed by the parent component via useBackupOperations
    // and passed as a prop. The onRestore function will trigger updates to that status.
    
    try {
      await onRestore(selectedFile);
      // Status updates are handled by the parent component's restoreStatus prop
    } catch (error) {
      // Error handling is also managed by the parent component's restoreStatus prop
      console.error('❌ Restore failed in RestoreActionsCard:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Restore System
        </CardTitle>
        <CardDescription>
          Upload a backup file to restore your system data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <Label htmlFor="backup-file">Select Backup File</Label>
          
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              dragOver 
                ? 'border-green-500 bg-green-50' 
                : selectedFile
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <FileText className="mx-auto h-12 w-12 text-green-600" />
                <div className="space-y-1">
                  <p className="font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-sm text-green-700">
                    {formatFileSize(selectedFile.size)} • ZIP Archive
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop your backup file here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse for files (ZIP format only)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBrowseClick}
                    className="mt-2"
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
            id="backup-file"
          />
        </div>

        {/* Progress */}
        {restoreStatus.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{restoreStatus.currentStep}</span>
              <span className="font-medium">{restoreStatus.progress}%</span>
            </div>
            <Progress value={restoreStatus.progress} className="w-full h-2" />
          </div>
        )}

        {/* Error Alert */}
        {restoreStatus.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Restore Error:</strong> {restoreStatus.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {restoreStatus.success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Success:</strong> System data has been restored successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> Restoring will replace all current data with the backup data. 
            A backup of current data will be created automatically before restore begins.
          </AlertDescription>
        </Alert>

        {/* Action Button */}
        <Button
          onClick={handleStartRestore}
          disabled={!selectedFile || restoreStatus.isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {restoreStatus.isRunning ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Restoring System...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Start Restore Process
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-700">
            <strong>Restore Instructions:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside">
              <li>Select or drag & drop a valid backup ZIP file</li>
              <li>Review the file information</li>
              <li>Click "Start Restore Process"</li>
              <li>Wait for the process to complete</li>
              <li>System will reload automatically</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RestoreActionsCard;