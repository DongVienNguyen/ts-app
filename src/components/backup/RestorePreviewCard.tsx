import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Database, Package } from 'lucide-react';
import { restoreService } from '@/services/restoreService';

interface RestorePreviewCardProps {
  selectedFile: File | null;
}

const RestorePreviewCard: React.FC<RestorePreviewCardProps> = ({
  selectedFile
}) => {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      loadPreview();
    } else {
      setPreview(null);
      setError(null);
    }
  }, [selectedFile]);

  const loadPreview = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const previewData = await restoreService.getRestorePreview(selectedFile);
      setPreview(previewData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedFile) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Restore Preview
          </CardTitle>
          <CardDescription>
            Select a backup file to preview its contents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No backup file selected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Restore Preview
        </CardTitle>
        <CardDescription>
          Preview of backup file: {selectedFile.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading preview...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        )}

        {preview && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-lg font-semibold">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                <div className="text-sm text-gray-600">File Size</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-lg font-semibold">{preview.tables?.length || 0}</div>
                <div className="text-sm text-gray-600">Tables</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-lg font-semibold">{preview.totalRecords || 0}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
            </div>

            {/* Backup Metadata */}
            {preview.metadata && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Backup Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(preview.metadata.timestamp).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2">
                      <Badge variant="outline">{preview.metadata.type || 'manual'}</Badge>
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Version:</span>
                    <span className="ml-2 font-medium">{preview.metadata.version || '1.0.0'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Configuration:</span>
                    <span className="ml-2">
                      <Badge variant={preview.hasConfiguration ? "default" : "secondary"}>
                        {preview.hasConfiguration ? 'Included' : 'Not included'}
                      </Badge>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tables Preview */}
            {preview.tables && preview.tables.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Database Tables ({preview.tables.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {preview.tables.map((table: any) => (
                    <div key={table.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{table.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {table.recordCount} records
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RestorePreviewCard;