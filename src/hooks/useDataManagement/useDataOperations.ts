import { useCallback } from 'react';
import { dataService } from './dataService';
import { exportService } from './exportService';
import { restoreService } from '@/services/restoreService';
import { toast } from 'sonner';

interface UseDataOperationsProps {
  selectedEntity: string;
  user: any;
  editingItem: any;
  currentPage: number;
  searchTerm: string;
  filters: Record<string, any>;
  startDate: string;
  endDate: string;
  restoreFile: File | null;
  data: any[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any, count: number) => void;
  clearCache: () => void;
  setData: (data: any[]) => void;
  setTotalCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
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
  filters,
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
}: UseDataOperationsProps) => {

  const runAsAdmin = useCallback(async (callback: () => Promise<void>) => {
    if (!user || user.role !== 'admin') {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
      return;
    }
    setIsLoading(true);
    try {
      await callback();
    } catch (error: any) {
      toast.error(`Lỗi: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [user, setIsLoading]);

  const loadData = useCallback(async (page: number, search: string, currentFilters: Record<string, any>) => {
    setIsLoading(true);
    try {
      const cacheKey = `${selectedEntity}-${page}-${search}-${JSON.stringify(currentFilters)}-${sortColumn}-${sortDirection}`;
      const cached = getCachedData(cacheKey);

      if (cached) {
        setData(cached.data);
        setTotalCount(cached.count);
      } else {
        const { data: fetchedData, count } = await dataService.loadData({
          selectedEntity,
          user,
          page,
          search,
          sortColumn,
          sortDirection,
          filters: currentFilters
        });
        setData(fetchedData);
        setTotalCount(count);
        setCachedData(cacheKey, fetchedData, count);
      }
    } catch (error: any) {
      toast.error(`Lỗi tải dữ liệu: ${error.message}`);
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, user, getCachedData, setCachedData, setData, setTotalCount, setIsLoading, sortColumn, sortDirection, filters]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, [setEditingItem, setDialogOpen]);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, [setEditingItem, setDialogOpen]);

  const handleSave = useCallback(async (formData: any) => {
    await runAsAdmin(async () => {
      const result = await dataService.saveData({ selectedEntity, formData, editingItem, user });
      toast.success(result.message);
      setDialogOpen(false);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [selectedEntity, editingItem, user, setDialogOpen, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  const handleDelete = useCallback(async (item: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) {
      return;
    }
    await runAsAdmin(async () => {
      const result = await dataService.deleteData({ selectedEntity, item, user });
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [selectedEntity, user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  const toggleStaffLock = useCallback(async (staff: any) => {
    await runAsAdmin(async () => {
      const result = await dataService.toggleStaffLock(staff, user);
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  const exportToCSV = useCallback(() => {
    runAsAdmin(async () => {
      try {
        const { data: allData } = await dataService.loadData({
          selectedEntity,
          user,
          page: 1,
          search: searchTerm,
          sortColumn,
          sortDirection,
          filters
        });
        exportService.exportToCSV(allData, selectedEntity, currentPage);
        toast.success('Dữ liệu đã được xuất ra CSV.');
      } catch (error: any) {
        toast.error(`Lỗi xuất CSV: ${error.message}`);
      }
    });
  }, [selectedEntity, user, searchTerm, sortColumn, sortDirection, filters, runAsAdmin, currentPage]);

  const handleFileSelectForImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      toast.info('Tệp đã được chọn. Nhấn "Import" để bắt đầu khôi phục.');
    } else {
      setRestoreFile(null);
    }
  }, [setRestoreFile]);

  const startImportProcess = useCallback(async (file: File) => {
    await runAsAdmin(async () => {
      try {
        const result = await restoreService.restoreDataFromZip(file, user);
        if (result.success) {
          toast.success(result.message);
          clearCache();
          loadData(currentPage, searchTerm, filters);
        } else {
          toast.error(result.message);
        }
      } catch (error: any) {
        toast.error(`Lỗi trong quá trình import: ${error.message}`);
      } finally {
        setRestoreFile(null); // Clear the selected file after processing
        if (restoreInputRef.current) {
          restoreInputRef.current.value = ''; // Clear the input field
        }
      }
    });
  }, [user, runAsAdmin, clearCache, loadData, currentPage, searchTerm, filters, setRestoreFile, restoreInputRef]);

  const handleImportClick = useCallback(() => {
    if (restoreInputRef.current) {
      restoreInputRef.current.click();
    }
  }, [restoreInputRef]);

  const bulkDeleteTransactions = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn cả ngày bắt đầu và ngày kết thúc để xóa hàng loạt.');
      return;
    }
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả giao dịch từ ${startDate} đến ${endDate}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    await runAsAdmin(async () => {
      const result = await dataService.bulkDeleteTransactions(startDate, endDate, user);
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [startDate, endDate, user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  return {
    runAsAdmin,
    loadData,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleFileSelectForImport, // Changed name
    startImportProcess, // New function
    handleImportClick,
    bulkDeleteTransactions
  };
};