import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

interface ReportTableProps {
  transactions: any[]; // Replace 'any' with actual transaction type if available
  isLoading: boolean;
  showDateRange: boolean;
  showType: boolean;
  showTakenCheckbox: boolean;
  showTimeNhan: boolean;
  showActions: boolean;
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
          {showDateRange && <TableHead>Ngày</TableHead>}
          <TableHead>Buổi</TableHead>
          <TableHead>Phòng</TableHead>
          {showType && <TableHead>Loại</TableHead>}
          <TableHead>Năm TS</TableHead>
          <TableHead>Mã TS</TableHead>
          <TableHead>Ghi chú</TableHead>
          {showTimeNhan && <TableHead>Thời gian nhận</TableHead>}
          {showTakenCheckbox && <TableHead className="text-center">Đã lấy</TableHead>}
          {showActions && <TableHead className="text-right">Thao tác</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            {showDateRange && <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>}
            <TableCell>{transaction.parts_day}</TableCell>
            <TableCell>{transaction.room}</TableCell>
            {showType && <TableCell>{transaction.transaction_type}</TableCell>}
            <TableCell>{transaction.asset_year}</TableCell>
            <TableCell>{transaction.asset_code}</TableCell>
            <TableCell>{transaction.note}</TableCell>
            {showTimeNhan && <TableCell>{format(new Date(transaction.created_at), 'HH:mm:ss')}</TableCell>}
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
            {showActions && (
              <TableCell className="text-right">
                <button onClick={() => onEdit(transaction)} className="text-blue-500 hover:text-blue-700 mr-2">Sửa</button>
                <button onClick={() => onDelete(transaction.id)} className="text-red-500 hover:text-red-700">Xóa</button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ReportTable;