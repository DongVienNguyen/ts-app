import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';

interface ReportTableProps {
  transactions: any[]; // Replace 'any' with actual transaction type if available
  isLoading: boolean;
  showDateRange: boolean;
  showType: boolean;
  showTakenCheckbox: boolean;
  showTimeNhan: boolean;
  showActions: boolean;
  showStaffCode: boolean;
  takenTransactionIds: Set<string>;
  onToggleTaken: (id: string) => void;
  onEdit: (transaction: any) => void;
  onDelete: (id: string) => void;
}

const ReportTable: React.FC<ReportTableProps> = ({
  transactions,
  isLoading,
  showDateRange,
  showType,
  showTakenCheckbox,
  showTimeNhan,
  showActions,
  showStaffCode,
  takenTransactionIds,
  onToggleTaken,
  onEdit,
  onDelete
}) => {
  if (isLoading) {
    return <div className="p-4 text-center">Đang tải dữ liệu...</div>;
  }

  if (transactions.length === 0) {
    return <div className="p-4 text-center">Không có giao dịch nào phù hợp.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showTakenCheckbox && <TableHead className="text-center w-16">Đã lấy</TableHead>}
          <TableHead>Phòng</TableHead>
          <TableHead>Năm TS</TableHead>
          <TableHead>Mã TS</TableHead>
          {showType && <TableHead>Loại</TableHead>}
          {showDateRange && <TableHead>Ngày</TableHead>}
          <TableHead>Buổi</TableHead>
          <TableHead>Ghi chú</TableHead>
          {showStaffCode && <TableHead>CB</TableHead>}
          {showTimeNhan && <TableHead>Time nhắn</TableHead>}
          {showActions && <TableHead className="text-right">Thao tác</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            {showTakenCheckbox && (
              <TableCell className="text-center">
                <input
                  type="checkbox"
                  checked={takenTransactionIds.has(transaction.id)}
                  onChange={() => onToggleTaken(transaction.id)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
              </TableCell>
            )}
            <TableCell>{transaction.room}</TableCell>
            <TableCell>{transaction.asset_year}</TableCell>
            <TableCell>{transaction.asset_code}</TableCell>
            {showType && <TableCell>{transaction.transaction_type}</TableCell>}
            {showDateRange && <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>}
            <TableCell>{transaction.parts_day}</TableCell>
            <TableCell>{transaction.note}</TableCell>
            {showStaffCode && <TableCell>{transaction.staff_code}</TableCell>}
            {showTimeNhan && <TableCell>{format(new Date(transaction.created_at), 'HH:mm - dd/MM')}</TableCell>}
            {showActions && (
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Sửa giao dịch"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Xóa giao dịch"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReportTable;