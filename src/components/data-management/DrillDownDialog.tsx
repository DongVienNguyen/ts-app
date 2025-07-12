import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import { convertToCSV } from "@/utils/csvUtils";
import { FieldConfig } from "@/config/entityConfig";
import { toast } from "sonner";

interface DrillDownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  columns: FieldConfig[];
  loading: boolean;
}

export const DrillDownDialog: React.FC<DrillDownDialogProps> = ({ open, onOpenChange, title, data, columns, loading }) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.info("Không có dữ liệu để xuất.");
      return;
    }
    try {
      const csvContent = convertToCSV(data, columns.map(col => col.key)); // Use convertToCSV and pass headers
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${title.replace(/[\s:]+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã xuất dữ liệu chi tiết.`);
    } catch (error: any) {
      toast.error(`Lỗi khi xuất dữ liệu: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] min-h-[30vh] relative">
          {loading ? (
            <div className="absolute inset-0 bg-white/70 flex justify-center items-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => <TableHead key={col.key}>{col.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length > 0 ? (
                    data.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columns.map((col) => <TableCell key={col.key}>{String(row[col.key] ?? '')}</TableCell>)}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Không tìm thấy dữ liệu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={handleExport} disabled={data.length === 0 || loading}>
            <Download className="mr-2 h-4 w-4" />
            Xuất CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};