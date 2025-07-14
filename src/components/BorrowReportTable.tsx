import React, { Dispatch, SetStateAction } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type Transaction = Tables<'asset_transactions'>;
export type ReportTransaction = Transaction & { transaction_count?: number };

export interface BorrowReportTableProps {
  transactions: ReportTransaction[];
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
  totalRecords: number;
}

const BorrowReportTable: React.FC<BorrowReportTableProps> = ({
  transactions,
  currentPage,
  setCurrentPage,
  totalPages,
  totalRecords,
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NV</TableHead>
              <TableHead>Ngày GD</TableHead>
              <TableHead>Ca</TableHead>
              <TableHead>Phòng</TableHead>
              <TableHead>Loại GD</TableHead>
              <TableHead>Năm TS</TableHead>
              <TableHead>Mã TS</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead>Số lần mượn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.staff_code}</TableCell>
                  <TableCell>{format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{transaction.parts_day}</TableCell>
                  <TableCell>{transaction.room}</TableCell>
                  <TableCell>{transaction.transaction_type}</TableCell>
                  <TableCell>{transaction.asset_year}</TableCell>
                  <TableCell>{transaction.asset_code}</TableCell>
                  <TableCell>{transaction.note}</TableCell>
                  <TableCell>{transaction.transaction_count}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  Không có dữ liệu giao dịch.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center no-print">
        <Button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Trước
        </Button>
        <span>
          Trang {currentPage} / {totalPages} (Tổng: {totalRecords} bản ghi)
        </span>
        <Button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Tiếp
        </Button>
      </div>
    </div>
  );
};

export default BorrowReportTable;