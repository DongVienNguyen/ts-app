import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSecureAuth } from '@/contexts/AuthContext';
import { createDataCache } from './cache';
import { useDataOperations } from './useDataOperations'; // Now contains runAsAdmin and loadData
import { useDataCRUD } from './useDataCRUD';
import { useDataImportExport } from './useDataImportExport';
import { useDataBulkActions } from './useDataBulkActions';
import type { DataManagementReturn, FilterState, FilterOperator } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { entityConfig, TableName } from '@/config/entityConfig';

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
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSecureAuth();
  const navigate = useNavigate();

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedFilters = useDebounce(filters, 500);

  const { getCachedData, setCachedData, clearCache, clearEntityCache } = createDataCache();
  const currentEntityConfig = entityConfig[selectedEntity];

  const { runAsAdmin, loadData } = useDataOperations({
    selectedEntity,
    user,
    currentPage,
    searchTerm: debouncedSearchTerm,
    filters: debouncedFilters,
    sortColumn,
    sortDirection,
    getCachedData,
    setCachedData,
    setData,
    setTotalCount,
    setIsLoading,
  });

  const {
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
  } = useDataCRUD({
    selectedEntity,
    user,
    editingItem,
    currentPage,
    searchTerm: debouncedSearchTerm,
    filters: debouncedFilters,
    setDialogOpen,
    setEditingItem,
    clearCache,
    loadData,
    runAsAdmin,
  });

  const {
    exportToCSV,
    handleExportTemplate,
    handleFileSelectForImport,
    startImportProcess,
    handleImportClick,
    importCsvInputRef,
    handleImportCsvClick,
    handleFileSelectForCsvImport,
  } = useDataImportExport({
    selectedEntity,
    user,
    currentPage,
    searchTerm: debouncedSearchTerm,
    filters: debouncedFilters,
    sortColumn,
    sortDirection,
    config: currentEntityConfig,
    setRestoreFile,
    restoreInputRef,
    clearCache,
    loadData,
    runAsAdmin,
  });

  const {
    selectedRows,
    handleRowSelect,
    handleSelectAll,
    handleBulkDelete,
    exportSelectedToCSV,
    bulkDeleteTransactions,
    clearSelectedRows, // Destructure the new function
  } = useDataBulkActions({
    selectedEntity,
    user,
    data,
    currentPage,
    searchTerm: debouncedSearchTerm,
    filters: debouncedFilters,
    startDate,
    endDate,
    config: currentEntityConfig,
    clearCache,
    loadData,
    runAsAdmin,
  });

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
    clearSelectedRows(); // Use the new function
  }, [selectedEntity, clearEntityCache, clearSelectedRows]);

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
    clearSelectedRows(); // Use the new function
  }, [currentPage, debouncedSearchTerm, debouncedFilters, sortColumn, sortDirection, clearSelectedRows]);

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
    handleExportTemplate,
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