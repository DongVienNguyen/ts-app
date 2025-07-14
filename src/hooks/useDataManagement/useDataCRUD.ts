import { useCallback } from 'react';
import { toast } from 'sonner';
import { dataService } from './dataService';
import { TableName } from '@/config/entityConfig';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { FilterState } from './types';

interface UseDataCRUDProps {
  selectedEntity: TableName;
  user: AuthenticatedStaff | null | undefined;
  editingItem: any;
  currentPage: number;
  searchTerm: string;
  filters: Record<string, FilterState>;
  setDialogOpen: (open: boolean) => void;
  setEditingItem: (item: any) => void;
  clearCache: () => void;
  loadData: (page: number, search: string, currentFilters: Record<string, FilterState>) => Promise<void>;
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
}

export const useDataCRUD = ({
  selectedEntity,
  user,
  editingItem,
  currentPage,
  searchTerm,
  filters,
  setDialogOpen,
  setEditingItem,
  clearCache,
  loadData,
  runAsAdmin,
}: UseDataCRUDProps) => {

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
      const result = await dataService.saveData({ selectedEntity, formData, editingItem, user: user! });
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
      const result = await dataService.deleteData({ selectedEntity, item, user: user! });
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [selectedEntity, user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  const toggleStaffLock = useCallback(async (staff: any) => {
    await runAsAdmin(async () => {
      const result = await dataService.toggleStaffLock({ staffId: staff.id, currentStatus: staff.account_status, user: user! });
      toast.success(result.message);
      clearCache();
      loadData(currentPage, searchTerm, filters);
    });
  }, [user, clearCache, loadData, currentPage, searchTerm, filters, runAsAdmin]);

  return {
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
  };
};