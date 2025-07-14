import { useState, useEffect, useMemo } from 'react';
import { getAssetTransactions } from '@/services/assetService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tables } from '@/integrations/supabase/types';
import _ from 'lodash';

type Transaction = Tables<'asset_transactions'>;

export type GroupedTransaction = Transaction & {
  transaction_count: number;
};

interface DateRange {
  start: string;
  end: string;
}

export const useBorrowReportData = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAssetTransactions();
        setAllTransactions(data as Transaction[]);
      } catch (error) {
        console.error("Error fetching borrow report data:", error);
        toast.error("Không thể tải dữ liệu báo cáo mượn tài sản.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    if (allTransactions.length === 0) return [];

    const exportedAssetKeys = new Set<string>();
    allTransactions.forEach(t => {
      if (t.transaction_type === 'Xuất kho') {
        exportedAssetKeys.add(`${t.room}-${t.asset_year}-${t.asset_code}`);
      }
    });

    const currentlyBorrowed = allTransactions.filter(t => {
      if (t.transaction_type === 'Mượn TS') {
        const assetKey = `${t.room}-${t.asset_year}-${t.asset_code}`;
        return !exportedAssetKeys.has(assetKey);
      }
      return false;
    });

    const startDate = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
    const endDate = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : null;

    const dateAndRoomFiltered = currentlyBorrowed.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      const inDateRange = (!startDate || transactionDate >= startDate) && (!endDate || transactionDate <= endDate);
      const inRoom = selectedRoom === 'all' || t.room === selectedRoom;
      return inDateRange && inRoom;
    });

    const groupedMap = new Map<string, GroupedTransaction>();
    dateAndRoomFiltered.forEach(transaction => {
      const key = `${transaction.room}-${transaction.asset_year}-${transaction.asset_code}`;
      const existing = groupedMap.get(key);

      if (!existing) {
        groupedMap.set(key, {
          ...transaction,
          transaction_count: 1,
        });
      } else {
        existing.transaction_count += 1;
        if (new Date(transaction.transaction_date) > new Date(existing.transaction_date)) {
          existing.transaction_date = transaction.transaction_date;
          existing.parts_day = transaction.parts_day;
          existing.staff_code = transaction.staff_code;
          existing.note = transaction.note;
        }
      }
    });

    const finalFiltered = Array.from(groupedMap.values());
    
    return _.orderBy(finalFiltered, ['room', 'asset_year', t => t.asset_code], ['asc', 'asc', 'asc']);
  }, [allTransactions, dateRange, selectedRoom]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, selectedRoom]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  const rooms = useMemo(() => {
    return [...new Set(allTransactions.map(t => t.room))].sort();
  }, [allTransactions]);

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.warning("Không có dữ liệu để xuất.");
      return;
    }

    const headers = ['STT', 'Phòng', 'Năm TS', 'Mã TS', 'Trạng thái', 'Ngày', 'CB'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map((t, index) => [
        index + 1,
        t.room,
        t.asset_year,
        t.asset_code,
        t.transaction_type,
        format(new Date(t.transaction_date), 'dd/MM/yyyy'),
        t.staff_code
      ].join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `BaoCaoTaiSanDaMuon_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Xuất file Excel thành công!");
  };

  return {
    isLoading,
    dateRange,
    setDateRange,
    selectedRoom,
    setSelectedRoom,
    currentPage,
    setCurrentPage,
    filteredTransactions,
    paginatedTransactions,
    totalPages,
    rooms,
    ITEMS_PER_PAGE,
    exportToCSV,
  };
};