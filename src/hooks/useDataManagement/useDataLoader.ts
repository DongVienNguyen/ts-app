import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TableName, entityConfig } from '@/config/entityConfig';
import { DataLoaderReturn } from './types';
import { toast } from 'sonner';

export const useDataLoader = (selectedEntity: TableName): DataLoaderReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const config = entityConfig[selectedEntity];
  const ITEMS_PER_PAGE = 20;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase.from(selectedEntity).select('*', { count: 'exact' });

      // Apply search term
      if (searchTerm) {
        const searchFields = config.fields.filter(f => f.type === 'text' || f.type === 'textarea' || f.type === 'email');
        if (searchFields.length > 0) {
          const searchConditions = searchFields.map(f => `${f.key}.ilike.%${searchTerm}%`).join(',');
          query = query.or(searchConditions);
        }
      }

      // Apply filters
      Object.keys(filters).forEach(key => {
        const filterValue = filters[key];
        if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
          const fieldConfig = config.fields.find(f => f.key === key);
          if (fieldConfig) {
            if (fieldConfig.type === 'date') {
              query = query.eq(key, filterValue);
            } else if (fieldConfig.type === 'boolean') {
              query = query.eq(key, filterValue === 'true');
            } else {
              query = query.ilike(key, `%${filterValue}%`);
            }
          }
        }
      });

      // Apply sorting
      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      } else if (config.primaryKey) {
        query = query.order(config.primaryKey, { ascending: true }); // Default sort by primary key
      }

      // Apply pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: fetchedData, count, error } = await query;

      if (error) {
        throw error;
      }

      setData(fetchedData || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Lỗi khi tải dữ liệu:', error.message);
      toast.error(`Lỗi khi tải dữ liệu: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, currentPage, searchTerm, sortColumn, sortDirection, filters, config]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = () => {
    fetchData();
  };

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1); // Reset to first page on clearing filters
  }, []);

  return {
    isLoading,
    data,
    totalCount,
    currentPage,
    setCurrentPage,
    searchTerm,
    setSearchTerm,
    refreshData,
    sortColumn,
    sortDirection,
    handleSort,
    filters,
    handleFilterChange,
    clearFilters,
  };
};