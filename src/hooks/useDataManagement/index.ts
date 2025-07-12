import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations';
import type { DataManagementReturn } from './types';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [message, setMessage] = useState({ type: '', text: '' });
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('management');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<Record<string, any>>({});
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
    setMessage,
    setDialogOpen,
    setEditingItem,
    setRestoreFile,
    restoreInputRef
  });

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
      setMessage({ type: 'error', text: 'Chỉ admin mới có thể truy cập module này.' });
    }
  }, [user, selectedEntity, navigate, loadData, currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection]);

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
    message,
    restoreFile,
    activeTab,
    sortColumn,
    sortDirection,
    filters,
    
    // Setters
    setSelectedEntity,
    setSearchTerm,
    setCurrentPage,
    setDialogOpen,
    setStartDate,
    setEndDate,
    setMessage,
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData: data, // Keep for compatibility, though paginatedData is used
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
    
    // User
    user
  };
};

export type * from './types';