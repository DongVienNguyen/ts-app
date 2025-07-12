import { useCallback } from 'react';
import { dataService } from './dataService';
import { exportService } from './exportService';
import type { CacheEntry } from './types';

interface UseDataOperationsProps {
  selectedEntity: string;
  user: any;
  editingItem: any;
  currentPage: number;
  searchTerm: string;
  filters: Record<string, any>; // Added
  startDate: string;
  endDate: string;
  restoreFile: File | null;
  data: any[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  getCachedData: (key: string) => CacheEntry | null;
  setCachedData: (key: string, data: any[], count: number) => void;
  clearCache: () => void;
  setData: (data: any[]) => void;
  setTotalCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
  setMessage: (message: { type: string; text: string }) => void;
  setDialogOpen: (open: boolean) => void;
  setEditingItem: (item: any) => void;
  setRestoreFile: (file: File | null) => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
}

export const useDataOperations = ({
  selectedEntity,
  user,
  editingItem,
  currentPage,
  searchTerm,
  filters, // Added
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
}: UseDataOperationsProps) => {

  const runAsAdmin = useCallback(async (callback: () => Promise<void>) => {
    if (!user || user.role !== 'admin') {
      setMessage({ type: 'error', text: "Hành động yêu cầu quyền admin." });
      return;
    }
    try {
      await callback();
    } catch (error: any) {
      setMessage({ type: 'error', text: `Lỗi thực thi tác vụ admin: ${error.message}` });
    }
  }, [user, setMessage]);

  const loadData = useCallback(async (page: number = 1, search: string = '', currentFilters: Record<string, any> = {}) => {
    if (!selectedEntity || !user || user.role !== 'admin') return;
    
    const cacheKey = `${selectedEntity}-${page}-${search}-${sortColumn}-${sortDirection}-${JSON.stringify(currentFilters)}`; // Updated cache key
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(cached.data);
      setTotalCount(cached.count);
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const result = await dataService.loadData({
        selectedEntity,
        user,
        page,
        search,
        sortColumn,
        sortDirection,
        filters: currentFilters // Passed to dataService
      });

      setCachedData(cacheKey, result.data, result.count);
      setData(result.data);
      setTotalCount(result.count);
      
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Không thể tải dữ liệu: ${error.message || 'Lỗi không xác định'}` 
      });
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, user, sortColumn, sortDirection, getCachedData, setCachedData, setData, setTotalCount, setIsLoading, setMessage]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, [setEditingItem, setDialogOpen]);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, [setEditingItem, setDialogOpen]);

  const handleSave = useCallback(async (formData: any) => {
    if (!selectedEntity) return;
    setMessage({ type: '', text: '' });
    
    await runAsAdmin(async () => {
      try {
        const result = await dataService.saveData({
          selectedEntity,
          formData,
          editingItem,
          user
        });
        
        setMessage({ type: 'success', text: result.message });
        setDialogOpen(false);
        clearCache();
        loadData(currentPage, searchTerm, filters); // Pass filters
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể lưu dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, editingItem, user, runAsAdmin, currentPage, searchTerm, setMessage, setDialogOpen, clearCache, loadData, filters]);

  const handleDelete = useCallback(async (item: any) => {
    if (!selectedEntity) return;
    setMessage({ type: '', text: '' });
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi này?`)) {
      return;
    }
    
    await runAsAdmin(async () => {
      try {
        const result = await dataService.deleteData({
          selectedEntity,
          item,
          user
        });
        
        setMessage({ type: 'success', text: result.message });
        clearCache();
        loadData(currentPage, searchTerm, filters); // Pass filters
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, user, runAsAdmin, currentPage, searchTerm, setMessage, clearCache, loadData, filters]);

  const toggleStaffLock = useCallback(async (staff: any) => {
    setMessage({ type: '', text: '' });
    
    await runAsAdmin(async () => {
      try {
        const result = await dataService.toggleStaffLock(staff, user);
        setMessage({ type: 'success', text: result.message });
        clearCache();
        loadData(currentPage, searchTerm, filters); // Pass filters
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể thay đổi trạng thái tài khoản: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [user, runAsAdmin, currentPage, searchTerm, setMessage, clearCache, loadData, filters]);

  const exportToCSV = useCallback(() => {
    try {
      const result = exportService.exportToCSV(data, selectedEntity, currentPage);
      setMessage({ type: 'success', text: result.message });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  }, [data, selectedEntity, currentPage, setMessage]);

  const handleRestoreData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRestoreFile(event.target.files[0]);
      setMessage({ 
        type: 'info', 
        text: `Đã chọn tệp: ${event.target.files[0].name}. Nhấn Import lần nữa để bắt đầu.` 
      });
    }
  }, [setRestoreFile, setMessage]);

  const restoreAllData = useCallback(async () => {
    if (!restoreFile) {
      setMessage({ type: 'error', text: "Vui lòng chọn tệp ZIP để import." });
      return;
    }
    
    setMessage({ type: '', text: '' });
    
    if (!window.confirm("Bạn có chắc chắn muốn import dữ liệu? Thao tác này sẽ GHI ĐÈ dữ liệu hiện có trong tất cả các bảng.")) {
      return;
    }

    await runAsAdmin(async () => {
      try {
        const result = await exportService.importFromZip(restoreFile, user);
        setMessage({ type: 'success', text: result.message });
        clearCache();
        loadData(currentPage, searchTerm, filters); // Pass filters
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể import dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      } finally {
        setRestoreFile(null);
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    });
  }, [restoreFile, user, runAsAdmin, currentPage, searchTerm, setMessage, clearCache, loadData, setRestoreFile, restoreInputRef, filters]);
  
  const handleImportClick = useCallback(() => {
    if (restoreFile) {
      restoreAllData();
    } else {
      restoreInputRef.current?.click();
    }
  }, [restoreFile, restoreAllData, restoreInputRef]);

  const bulkDeleteTransactions = useCallback(async () => {
    setMessage({ type: '', text: '' });
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả giao dịch từ ${startDate} đến ${endDate}? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    
    await runAsAdmin(async () => {
      try {
        const result = await dataService.bulkDeleteTransactions(startDate, endDate, user);
        setMessage({ type: 'success', text: result.message });
        clearCache();
        loadData(currentPage, searchTerm, filters); // Pass filters
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa giao dịch hàng loạt: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [startDate, endDate, user, runAsAdmin, currentPage, searchTerm, setMessage, clearCache, loadData, filters]);

  return {
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
  };
};