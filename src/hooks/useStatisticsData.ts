import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toast } from 'sonner';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export interface KeyMetrics {
  totalTransactions: number;
  activeStaff: number;
  mostFrequentType: string;
  mostActiveRoom: string;
  mostActivePartsDay: string;
  totalTransactionsChange?: number;
  activeStaffChange?: number;
}

export interface ChartData {
  statistics: any[];
  staffTransactionStats: { name: string; count: number; originalKey: string; }[];
  roomTransactionStats: { name: string; count: number; originalKey: string; }[];
  partsDayTransactionStats: { name: string; count: number; originalKey: string; }[];
  transactionTypeStats: { name: string; value: number; originalKey: string; }[];
  transactionTrends: { date: string; count: number }[];
}

const initialChartData: ChartData = {
  statistics: [],
  staffTransactionStats: [],
  roomTransactionStats: [],
  partsDayTransactionStats: [],
  transactionTypeStats: [],
  transactionTrends: [],
};

export const useStatisticsData = (runAsAdmin: (callback: () => Promise<any>) => Promise<any>, onLoad: () => void) => {
  const [chartData, setChartData] = useState<ChartData>(initialChartData);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const fetchTransactionTypes = async () => {
      await runAsAdmin(async () => {
        const { data, error } = await supabase.from('asset_transactions').select('transaction_type');
        if (error) {
          toast.error("Không thể tải danh sách loại giao dịch.");
        } else if (data) {
          const uniqueTypes = [...new Set(data.map(item => item.transaction_type).filter(Boolean))] as string[];
          setTransactionTypes(uniqueTypes);
        }
      });
    };
    fetchTransactionTypes();
  }, [runAsAdmin]);

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
  };

  const loadData = async (loader: (start: string, end: string, type: string) => Promise<any>, start: string, end: string, type: string) => {
    return runAsAdmin(() => loader(start, end, type));
  };

  const loadStatistics = async (start: string, end: string) => {
    const promises = Object.keys(entityConfig).map(async (key) => {
      const config = entityConfig[key];
      let query = supabase.from(config.entity as any).select('*', { count: 'exact', head: true });
      const dateField = config.fields.find(f => f.key === 'created_at' || f.key === 'transaction_date');
      if (dateField && start && end) {
        query = query.gte(dateField.key, start).lte(dateField.key, end);
      }
      const { count, error } = await query;
      if (error) throw error;
      return { name: config.name, count: count || 0 };
    });
    return Promise.all(promises);
  };

  const createStatsLoader = (field: 'staff_code' | 'room' | 'transaction_type' | 'parts_day', nameMappingTable?: 'staff') => async (start: string, end: string, type: string) => {
    let query = supabase.from('asset_transactions').select(field).gte('transaction_date', start).lte('transaction_date', end);
    if (type !== 'all') query = query.eq('transaction_type', type);
    
    const { data, error } = await query;
    if (error) throw error;

    let staffNameMap: Map<string, string> | null = null;
    if (nameMappingTable === 'staff') {
        const { data: staffData, error: staffError } = await supabase.from('staff').select('username, staff_name');
        if (staffError) throw staffError;
        staffNameMap = new Map(staffData.map(s => [s.username, s.staff_name || s.username]));
    }

    const counts = data.reduce((acc, item) => {
      const key = item[field as keyof typeof item];
      if(key) acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([key, count]) => ({
        name: field === 'staff_code' && staffNameMap ? (staffNameMap.get(key) || key) : key,
        originalKey: key,
        count: count,
        value: count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const loadTransactionTrends = async (start: string, end: string, type: string) => {
    let query = supabase.from('asset_transactions').select('transaction_date').gte('transaction_date', start).lte('transaction_date', end);
    if (type !== 'all') query = query.eq('transaction_type', type);
    query = query.order('transaction_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    const countsByDate = data.reduce((acc, { transaction_date }) => {
      const date = format(parseISO(transaction_date), 'dd/MM');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
  };

  const loadAllStats = useCallback(async (start: string, end: string, type: string) => {
    if (!start || !end) return;
    setIsLoading(true);
    onLoad();
    try {
      const loaders = {
        staff: createStatsLoader('staff_code', 'staff'),
        room: createStatsLoader('room'),
        partsDay: createStatsLoader('parts_day'),
        type: createStatsLoader('transaction_type'),
        trends: loadTransactionTrends,
        records: loadStatistics,
      };

      const currentPeriodPromises = Object.values(loaders).map(loader => loadData(loader, start, end, type));
      
      let previousPeriodPromises: Promise<any>[] = [];
      if (comparisonEnabled) {
        const startDateObj = parseISO(start);
        const endDateObj = parseISO(end);
        const diff = differenceInDays(endDateObj, startDateObj);
        const prevStartDate = format(subDays(startDateObj, diff + 1), 'yyyy-MM-dd');
        const prevEndDate = format(subDays(endDateObj, diff + 1), 'yyyy-MM-dd');
        previousPeriodPromises = [loaders.staff, loaders.room, loaders.partsDay].map(loader => loadData(loader, prevStartDate, prevEndDate, type));
      }

      const [
        currentStaffStats, currentRoomStats, currentPartsDayStats, currentTypeStats, currentTrends, currentRecordStats,
        previousStaffStats,
      ] = await Promise.all([...currentPeriodPromises, ...previousPeriodPromises]);

      setChartData({
        staffTransactionStats: currentStaffStats || [],
        roomTransactionStats: currentRoomStats || [],
        partsDayTransactionStats: currentPartsDayStats || [],
        transactionTypeStats: currentTypeStats || [],
        transactionTrends: currentTrends || [],
        statistics: currentRecordStats || [],
      });

      const totalTransactions = (currentStaffStats || []).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
      const activeStaff = (currentStaffStats || []).length;
      const mostFrequentType = currentTypeStats && currentTypeStats.length > 0 ? currentTypeStats[0].name : 'N/A';
      const mostActiveRoom = currentRoomStats && currentRoomStats.length > 0 ? currentRoomStats[0].name : 'N/A';
      const mostActivePartsDay = currentPartsDayStats && currentPartsDayStats.length > 0 ? currentPartsDayStats[0].name : 'N/A';

      let metrics: KeyMetrics = { totalTransactions, activeStaff, mostFrequentType, mostActiveRoom, mostActivePartsDay };

      if (comparisonEnabled) {
        const prevTotalTransactions = (previousStaffStats || []).reduce((acc: number, curr: { count: number }) => acc + curr.count, 0);
        const prevActiveStaff = (previousStaffStats || []).length;
        metrics.totalTransactionsChange = calculatePercentageChange(totalTransactions, prevTotalTransactions);
        metrics.activeStaffChange = calculatePercentageChange(activeStaff, prevActiveStaff);
      }
      
      setKeyMetrics(metrics);

    } catch (error: any) {
      toast.error(`Không thể tải dữ liệu thống kê: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [onLoad, comparisonEnabled, runAsAdmin]);

  useEffect(() => {
    loadAllStats(startDate, endDate, selectedType);
  }, [loadAllStats, startDate, endDate, selectedType, comparisonEnabled]);

  return {
    isLoading,
    chartData,
    keyMetrics,
    filters: {
      startDate,
      endDate,
      selectedType,
      comparisonEnabled,
      transactionTypes,
    },
    setters: {
      setStartDate,
      setEndDate,
      setSelectedType,
      setComparisonEnabled,
    }
  };
};