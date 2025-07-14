import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2 } from 'lucide-react';
import { Transaction } from '@/types/asset';
import { getNextWorkingDay, getMorningTargetDate, formatToDDMMYYYY } from '@/utils/dateUtils';

interface DetailedReportViewProps {
  transactions: Transaction[];
  isLoading: boolean;
  takenTransactionIds: Set<string>;
  onToggleTaken: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  filterType: string;
  customFilters: { start: string; end: string; };
}

const DetailedReportView: React.FC<DetailedReportViewProps> = ({
  transactions,
  isLoading,
  takenTransactionIds,
  onToggleTaken,
  onEdit,
  onDelete,
  filterType,
  customFilters
}) => {
  const headerDateDisplay = useMemo(() => {
    switch(filterType) {
      case 'morning': return `Sáng ngày (${formatToDDMMYYYY(getMorningTargetDate())})`;
      case 'afternoon': return `Chiều ngày (${formatToDDMMYYYY(getNextWorkingDay(new Date()))})`;
      case 'qln_pgd_next_day': return `QLN Sáng & PGD trong ngày (${formatToDDMMYYYY(getMorningTargetDate())})`;
      case 'today': return `Trong ngày hôm nay (${formatToDDMMYYYY(new Date())})`;
      case 'next_day': return `Trong ngày kế tiếp (${formatToDDMMYYYY(getNextWorkingDay(new Date()))})`;
      case 'custom': return `Từ ${formatToDDMMYYYY(new Date(customFilters.start))} đến ${formatToDDMMYYYY(new Date(customFilters.end))}`;
      default: return "";
    }
  }, [filterType, customFilters]);

  return (
    <Card className="border-0 shadow-xl shadow-slate-100/50">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">Danh sách tài sản cần lấy ({transactions.length} bản ghi)</CardTitle>
        <CardDescription>{headerDateDisplay}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Lấy</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Năm TS</TableHead>
              <TableHead>Mã TS</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Buổi</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>CB</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={10} className="text-center h-24">Đang tải dữ liệu...</TableCell></TableRow>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <TableRow key={t.id} className={takenTransactionIds.has(t.id) ? 'bg-green-50' : ''}>
                  <TableCell><Checkbox checked={takenTransactionIds.has(t.id)} onCheckedChange={() => onToggleTaken(t)} /></TableCell>
                  <TableCell>{t.room}</TableCell>
                  <TableCell>{t.asset_year}</TableCell>
                  <TableCell>{t.asset_code}</TableCell>
                  <TableCell>{t.transaction_type}</TableCell>
                  <TableCell>{formatToDDMMYYYY(t.transaction_date)}</TableCell>
                  <TableCell>{t.parts_day}</TableCell>
                  <TableCell>{t.note}</TableCell>
                  <TableCell>{t.staff_code}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => onEdit(t)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={10} className="text-center h-24">Không có dữ liệu.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DetailedReportView;