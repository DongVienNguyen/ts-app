import { useCallback } from 'react';
import { dataService } from './dataService';
import { toast } from 'sonner';
import { TableName } from '@/config/entityConfig';
import { AuthenticatedStaff } from '@/contexts/AuthContext';
import { FilterState } from './types';

interface UseDataOperationsProps {
  selectedEntity: TableName;
  user: AuthenticatedStaff | null | undefined;
  currentPage: number;
  searchTerm: string;
  filters: Record<string, FilterState>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  getCachedData: (key: string) => any;
  setCachedData: (key: string, data: any, count: number) => void;
  setData: (data: any[]) => void;
  setTotalCount: (count: number) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useDataOperations = ({
  selectedEntity,
  user,
  currentPage,
  searchTerm,
  filters,
  sortColumn,
  sortDirection,
  getCachedData,
  setCachedData,
  setData,
  setTotalCount,
  setIsLoading,
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

  const loadData = useCallback(async (page: number, search: string, currentFilters: Record<string, FilterState>) => {
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
          page,
          searchTerm: search,
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
  }, [selectedEntity, getCachedData, setCachedData, setData, setTotalCount, setIsLoading, sortColumn, sortDirection]);

  return {
    runAsAdmin,
    loadData,
  };
};