import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations';
import type { DataManagementReturn, FilterState, FilterOperator } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { entityConfig, TableName } from '@/config/entityConfig';
import { dataService } from './dataService';
import { toCSV } from '@/utils/csvUtils';

const ITEMS_PER_PAGE = 20;

export const useDataManagement = (): DataManagementReturn => {
  const [selectedEntity, setSelectedEntityState] = useState<TableName>('asset_transactions');
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('management');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, FilterState>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSecureAuth();
  const navigate = useNavigate();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedFilters = useDebounce(filters, 500);

  const { getCachedData, setCachedData, clearCache, clearEntityCache } = createDataCache();
  const currentEntityConfig = entityConfig[selectedEntity];

  const {
    runAsAdmin,
    loadData,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleFileSelectForImport,
    startImportProcess,
    handleImportClick,
    bulkDeleteTransactions,
    importCsvInputRef,
    handleImportCsvClick,
    handleFileSelectForCsvImport,
  } = useDataOperations({
    selectedEntity,
    user,
    editingItem,
    currentPage,
    searchTerm: debouncedSearchTerm,
    filters: debouncedFilters,
    startDate,
    endDate,
    restoreFile,
    data,
    sortColumn,
    sortDirection,
    config: currentEntityConfig,
    getCachedData,
    setCachedData,
    clearCache,
    setData,
    setTotalCount,
    setIsLoading,
    setDialogOpen,
    setEditingItem,
    setRestoreFile,
    restoreInputRef
  });

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
        loadData(currentPage, debouncedSearchTerm, debouncedFilters);
      } catch (error: any) {
        toast.error(`Lỗi xóa hàng loạt: ${error.message}`);
      }
    });
  }, [selectedRows, runAsAdmin, selectedEntity, user, loadData, currentPage, debouncedSearchTerm, debouncedFilters, clearCache]);

  const exportSelectedToCSV = useCallback(() => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (selectedIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một bản ghi để xuất.');
      return;
    }

    const selectedData = data.filter(row => selectedIds.includes(row.id));
    const config = entityConfig[selectedEntity];
    if (!config) {
      toast.error('Không tìm thấy cấu hình cho thực thể này.');
      return;
    }

    try {
      const csvContent = toCSV(selectedData, config.fields);
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${selectedEntity}_selected_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Đã xuất thành công ${selectedIds.length} bản ghi được chọn.`);
    } catch (error: any) {
      toast.error(`Lỗi khi xuất CSV: ${error.message}`);
    }
  }, [selectedRows, data, selectedEntity]);

  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortColumn]);

  const handleFilterChange = useCallback((key: string, value: any, operator?: FilterOperator) => {
    setFilters(prev => {
      const fieldConfig = entityConfig[selectedEntity].fields.find(f => f.key === key);
      let defaultOperator: FilterOperator = 'eq';
      if (fieldConfig?.type === 'text' || fieldConfig?.type === 'email') {
        defaultOperator = 'ilike';
      } else if (fieldConfig?.type === 'boolean') {
        defaultOperator = 'is';
      }

      return {
        ...prev,
        [key]: {
          value: value,
          operator: operator || defaultOperator
        }
      };
    });
    setCurrentPage(1);
  }, [selectedEntity]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setSelectedEntity = useCallback((entity: TableName) => {
    clearEntityCache(selectedEntity);
    setSelectedEntityState(entity);
    setCurrentPage(1);
    setSearchTerm('');
    setSortColumn(null);
    setSortDirection('desc');
    setFilters({});
    setData([]);
    setTotalCount(0);
    setSelectedRows({});
  }, [selectedEntity, clearEntityCache]);

  const paginatedData = data;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const refreshData = useCallback(() => {
    clearCache();
    loadData(currentPage, debouncedSearchTerm, debouncedFilters);
  }, [loadData, currentPage, debouncedSearchTerm, debouncedFilters, clearCache]);

  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'admin') {
      if (selectedEntity) {
        loadData(currentPage, debouncedSearchTerm, debouncedFilters);
      }
    } else if (user) {
      setData([]);
      setTotalCount(0);
      toast.error('Chỉ admin mới có thể truy cập module này.');
    }
  }, [user, selectedEntity, navigate, loadData, currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);
  
  useEffect(() => {
    setSelectedRows({});
  }, [currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);

  return {
    user,
    activeTab,
    setActiveTab,
    selectedEntity,
    setSelectedEntity,
    isLoading,
    searchTerm,
    setSearchTerm,
    data,
    totalCount,
    currentPage,
    setCurrentPage,
    dialogOpen,
    setDialogOpen,
    editingItem,
    setEditingItem,
    handleAdd,
    handleEdit,
    handleDelete,
    handleSave,
    refreshData,
    exportToCSV,
    exportSelectedToCSV,
    handleImportClick,
    restoreInputRef,
    handleFileSelectForImport,
    startImportProcess,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    bulkDeleteTransactions,
    toggleStaffLock,
    runAsAdmin,
    handleSort,
    sortColumn,
    sortDirection,
    filters,
    onFilterChange: handleFilterChange,
    clearFilters: handleClearFilters,
    config: currentEntityConfig,
    restoreFile,
    selectedRows,
    filteredData: data,
    paginatedData,
    totalPages,
    handleRowSelect,
    handleSelectAll,
    handleBulkDelete,
    importCsvInputRef,
    handleImportCsvClick,
    handleFileSelectForCsvImport,
  };
};

export type * from './types';