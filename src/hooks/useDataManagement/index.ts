import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations';
import type { DataManagementReturn } from './types';

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
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSecureAuth();
  const navigate = useNavigate();

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
    searchTerm,
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

  // Entity change handler with cache clearing
  const setSelectedEntity = useCallback((entity: string) => {
    clearEntityCache(selectedEntity);
    setSelectedEntityState(entity);
    setCurrentPage(1);
    setSearchTerm('');
    setSortColumn(null);
    setSortDirection('desc');
    setData([]);
    setTotalCount(0);
  }, [selectedEntity, clearEntityCache]);

  // Computed values
  const filteredData = data; // Data is already filtered on server
  const paginatedData = data; // Data is already paginated on server
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Refresh data function
  const refreshData = useCallback(() => {
    loadData(currentPage, searchTerm);
  }, [loadData, currentPage, searchTerm]);

  // Effects for data loading
  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'admin') {
      if (selectedEntity) {
        loadData(currentPage, searchTerm);
      }
    } else if (user) {
      setData([]);
      setTotalCount(0);
      setMessage({ type: 'error', text: 'Chỉ admin mới có thể truy cập module này.' });
    }
  }, [user, selectedEntity, navigate, loadData, currentPage, searchTerm, sortColumn, sortDirection]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadData(1, searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadData]);

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
    filteredData,
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
    
    // User
    user
  };
};

// Re-export types
export type * from './types';