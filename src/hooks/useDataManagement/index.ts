import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations';
import { dataService } from './dataService';
import type { DataManagementReturn } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner'; // Import toast from sonner

const ITEMS_PER_PAGE = 20;

export const useDataManagement = (): DataManagementReturn => {
  // State
  const [selectedEntity, setSelectedEntityState] = useState<string>('asset_transactions');
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // const [message, setMessage] = useState({ type: '', text: '' }); // Removed
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
    handleRestoreData,
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
    // setMessage, // Removed
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
          user
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
  const setSelectedEntity = useCallback((entity: string) => {
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
      toast.error('Chỉ admin mới có thể truy cập module này.'); // Changed to toast
    }
  }, [user, selectedEntity, navigate, loadData, currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);
  
  // Effect to clear selection on page change
  useEffect(() => {
    setSelectedRows({});
  }, [currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);

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
    // message, // Removed
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
    setStartDate,
    setEndDate,
    // setMessage, // Removed
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData: data,
    paginatedData,
    totalPages,
    
    // Actions
    runAsAdmin,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleRestoreData,
    handleImportClick,
    bulkDeleteTransactions,
    refreshData,
    handleSort,
    handleFilterChange,
    handleClearFilters,
    handleRowSelect,
    handleSelectAll,
    handleBulkDelete,
    
    // User
    user
  };
};

export type * from './types';