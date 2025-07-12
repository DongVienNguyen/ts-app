import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { convertToCSV } from '@/utils/csvUtils';
import { FieldConfig } from '@/config/entityConfig';

interface ChartContainerProps {
  title: string;
  icon: React.ReactNode;
  isLoading: boolean;
  children: React.ReactElement;
  height?: number;
  exportData?: any[];
  exportFields?: FieldConfig[];
  exportFilename?: string;
}

const renderLoading = () => (
  <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, icon, isLoading, children, height = 400, exportData, exportFields, exportFilename }) => {
  const canExport = exportData && exportFields && exportFilename;

  const handleExport = () => {
    if (!canExport || !exportData || exportData.length === 0) {
      toast.info("Không có dữ liệu để xuất.");
      return;
    }
    try {
      const csvContent = convertToCSV(exportData, exportFields.map(f => f.key)); // Use convertToCSV and pass headers
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${exportFilename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã xuất dữ liệu ${exportFilename}.`);
    } catch (error: any) {
      toast.error(`Lỗi khi xuất dữ liệu: ${error.message}`);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">{icon}{title}</CardTitle>
        {canExport && (
          <Button variant="ghost" size="sm" onClick={handleExport} disabled={isLoading || !exportData || exportData.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="relative">
        {isLoading && renderLoading()}
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};