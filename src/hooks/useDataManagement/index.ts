import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations';
import type { DataManagementReturn } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { entityConfig, TableName } from '@/config/entityConfig'; // Import TableName
import { dataService } from './dataService';
import { toCSV } from '@/utils/csvUtils'; // Import toCSV

const ITEMS_PER_PAGE = 20;

export const useDataManagement = (): DataManagementReturn => {
  // State
  const [selectedEntity, setSelectedEntityState] = useState<TableName>('asset_transactions'); // Changed type to TableName
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
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSecureAuth();
  const navigate = useNavigate();

  // Debounce search and filter terms
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedFilters = useDebounce(filters, 500);

  // Cache management
  const { getCachedData, setCachedData, clearCache, clearEntityCache } = createDataCache();

  // Data operations
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
    bulkDeleteTransactions
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

  // Selection Handlers
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
          user: user! // user is guaranteed to be AuthenticatedStaff here due to early return
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

  // Sort handler
  const handleSort = useCallback((columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortColumn]);

  // Filter handlers
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // Entity change handler
  const setSelectedEntity = useCallback((entity: TableName) => { // Changed type to TableName
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

  // Computed values
  const paginatedData = data;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Refresh data function
  const refreshData = useCallback(() => {
    clearCache();
    loadData(currentPage, debouncedSearchTerm, debouncedFilters);
  }, [loadData, currentPage, debouncedSearchTerm, debouncedFilters, clearCache]);

  // Effects for data loading
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
  
  // Effect to clear selection on page change
  useEffect(() => {
    setSelectedRows({});
  }, [currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);

  const currentEntityConfig = entityConfig[selectedEntity];

  return {
    // State
    selectedEntity,
    data,
    totalCount,
    isLoading,
    searchTerm,
    currentPage,
    dialogOpen,
    editingItem,
    startDate,
    endDate,
    restoreFile,
    activeTab,
    sortColumn,
    sortDirection,
    filters,
    selectedRows,
    
    // Setters
    setSelectedEntity,
    setSearchTerm,
    setCurrentPage,
    setDialogOpen,
    setEditingItem, // Added setEditingItem here
    setStartDate,
    setEndDate,
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData: data,
    paginatedData,
    totalPages,
    config: currentEntityConfig,
    
    // Actions
    runAsAdmin,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    exportSelectedToCSV,
    handleFileSelectForImport,
    startImportProcess,
    handleImportClick,
    bulkDeleteTransactions,
    refreshData,
    handleSort,
    onFilterChange: handleFilterChange, // Renamed to onFilterChange to match interface
    clearFilters: handleClearFilters, // Renamed to clearFilters to match interface
    handleRowSelect,
    handleSelectAll,
    handleBulkDelete,
    
    // User
    user
  };
};

export type * from './types';