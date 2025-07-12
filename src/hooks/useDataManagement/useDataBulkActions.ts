import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { dataService } from './dataService';
import { exportService } from './exportService';
import { TableName, EntityConfig } from '@/config/entityConfig';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { FilterState } from './types';

interface UseDataBulkActionsProps {
  selectedEntity: TableName;
  user: AuthenticatedStaff | null | undefined;
  data: any[];
  currentPage: number;
  searchTerm: string;
  filters: Record<string, FilterState>;
  startDate: string;
  endDate: string;
  config: EntityConfig;
  clearCache: () => void;
  loadData: (page: number, search: string, currentFilters: Record<string, FilterState>) => Promise<void>;
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
}

export const useDataBulkActions = ({
  selectedEntity,
  user,
  data,
  currentPage,
  searchTerm,
  filters,
  startDate,
  endDate,
  config,
  clearCache,
  loadData,
  runAsAdmin,
}: UseDataBulkActionsProps) => {
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const handleRowSelect = useCallback((rowId: string) => {
    setSelectedRows(prev => {
      const newSelection = { ...prev };
      if (newSelection[rowId]) {
        delete newSelection[rowId];
      } else {
        newSelection[rowId] = true;
      }
      return newSelection;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allVisibleIds = data.map(row => row.id);
    const allSelected = allVisibleIds.length > 0 && allVisibleIds.every(id => selectedRows[id]);

    if (allSelected) {
      setSelectedRows({});
    } else {
      const newSelection = allVisibleIds.reduce((acc, id) => {
        acc[id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setSelectedRows(newSelection);
    }
  }, [data, selectedRows]);

  const handleBulkDelete = useCallback(async () => {
    const idsToDelete = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (idsToDelete.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bản ghi để xóa.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${idsToDelete.length} bản ghi đã chọn?`)) {
      return;
    }

    await runAsAdmin(async () => {
      try {
        const result = await dataService.bulkDeleteData({
          selectedEntity,
          ids: idsToDelete,
          user: user!
        });
        toast.success(result.message);
        setSelectedRows({});
        clearCache();
        loadData(currentPage, searchTerm, filters);
      } catch (error: any) {
        toast.error(`Lỗi xóa hàng loạt: ${error.message}`);
      }
    });
  }, [selectedRows, runAsAdmin, selectedEntity, user, loadData, currentPage, searchTerm, filters, clearCache]);

  const exportSelectedToCSV = useCallback(() => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bản ghi để xuất.');
      return;
    }

    const selectedData = data.filter(row => selectedIds.includes(row.id));
    
    try {
      exportService.exportSelectedToCSV(selectedData, config);
      toast.success(`Đã xuất thành công ${selectedIds.length} bản ghi được chọn.`);
    } catch (error: any) {
      toast.error(`Lỗi khi xuất CSV: ${error.message}`);
    }
  }, [selectedRows, data, config]);

  const bulkDeleteTransactions = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc để xóa hàng loạt.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả giao dịch từ ${startDate} đến ${endDate}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    await runAsAdmin(async () => {
      const result = await dataService.bulkDeleteTransactions({ startDate, endDate, user });
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [startDate, endDate, user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  const clearSelectedRows = useCallback(() => {
    setSelectedRows({});
  }, []);

  return {
    selectedRows,
    handleRowSelect,
    handleSelectAll,
    handleBulkDelete,
    exportSelectedToCSV,
    bulkDeleteTransactions,
    clearSelectedRows,
  };
};