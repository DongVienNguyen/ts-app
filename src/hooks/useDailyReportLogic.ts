import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import _ from 'lodash';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { getAssetTransactions, updateAssetTransaction, deleteAssetTransaction } from '@/services/assetService';
import { getProcessedNotes, addProcessedNote, updateProcessedNote, deleteProcessedNote, getTakenAssetStatus, addTakenAssetStatus, deleteTakenAssetStatus } from '@/services/reportService';
import { sendEmail } from '@/services/emailService';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getMorningTargetDate, getNextWorkingDay, getCurrentWeekYear, formatToDDMMYYYY } from '@/utils/dateUtils';
import { Transaction, AssetTransactionFilters } from '@/types/asset';
import { ProcessedNote, ProcessedNoteInsert, ProcessedNoteUpdate, TakenAssetStatusInsert } from '@/types/report';
import { formatEmail } from '@/utils/emailUtils';

export const useDailyReportLogic = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useCurrentUser();

  // --- STATE MANAGEMENT ---
  const [filterType, setFilterType] = useState('qln_pgd_next_day');
  const [customFilters, setCustomFilters] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
    parts_day: "all"
  });
  const [showGrouped, setShowGrouped] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // --- DATA FETCHING (REACT QUERY) ---
  const { data: allTransactions = [], isLoading: isLoadingTransactions, isSuccess } = useQuery({
    queryKey: ['allAssetTransactions'],
    queryFn: () => getAssetTransactions({}), // Fetch all initially
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  useEffect(() => {
    if (isSuccess) {
      setLastUpdated(new Date());
    }
  }, [isSuccess, allTransactions]);

  const { data: processedNotes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ['processedNotes'],
    queryFn: getProcessedNotes,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const currentWeekYear = useMemo(() => getCurrentWeekYear(), []);
  const { data: takenTransactionIds = new Set<string>(), isLoading: isLoadingTakenStatus } = useQuery({
    queryKey: ['takenAssetStatus', currentUser?.username, currentWeekYear],
    queryFn: async () => {
      const ids = await getTakenAssetStatus(currentUser!.username, currentWeekYear);
      return new Set(ids);
    },
    enabled: !!currentUser?.username,
  });
  
  const isLoading = isLoadingTransactions || isLoadingNotes || isLoadingTakenStatus;

  // --- FILTERING AND GROUPING LOGIC ---
  const filteredTransactions = useMemo(() => {
    if (allTransactions.length === 0) return [];
    
    let filtered: Transaction[];
    const today = new Date();
    const morningTargetDate = getMorningTargetDate();
    const nextWorkingDay = getNextWorkingDay(today);

    if (filterType === 'qln_pgd_next_day') {
      const formattedTargetDate = format(morningTargetDate, 'yyyy-MM-dd');
      const pgdRooms = ['CMT8', 'NS', 'ĐS', 'LĐH'];
      filtered = allTransactions.filter(t => {
        const isDateMatch = format(new Date(t.transaction_date), 'yyyy-MM-dd') === formattedTargetDate;
        if (!isDateMatch) return false;
        const isMorning = t.parts_day === 'Sáng';
        const isPgdAfternoon = t.parts_day === 'Chiều' && pgdRooms.includes(t.room);
        return isMorning || isPgdAfternoon;
      });
    } else if (filterType === 'custom') {
        const dateFilterStart = new Date(customFilters.start + 'T00:00:00');
        const dateFilterEnd = new Date(customFilters.end + 'T23:59:59');
        filtered = allTransactions.filter(t => {
            const transactionDate = new Date(t.transaction_date);
            const isDateMatch = transactionDate >= dateFilterStart && transactionDate <= dateFilterEnd;
            const isPartsMatch = customFilters.parts_day === 'all' || t.parts_day === customFilters.parts_day;
            return isDateMatch && isPartsMatch;
        });
    } else {
        let targetDate: Date;
        let partsFilter: string | null = null;
        switch(filterType) {
            case 'morning':
                targetDate = morningTargetDate;
                partsFilter = "Sáng";
                break;
            case 'afternoon':
                targetDate = nextWorkingDay;
                partsFilter = "Chiều";
                break;
            case 'today':
                targetDate = today;
                break;
            case 'next_day':
                targetDate = nextWorkingDay;
                break;
            default:
                targetDate = today;
        }
        const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');
        filtered = allTransactions.filter(t => {
            const isDateMatch = format(new Date(t.transaction_date), 'yyyy-MM-dd') === formattedTargetDate;
            const isPartsMatch = !partsFilter || t.parts_day === partsFilter;
            return isDateMatch && isPartsMatch;
        });
    }
    
    return _.orderBy(filtered, ['room', 'asset_year', t => parseInt(String(t.asset_code)) || 0], ['asc', 'asc', 'asc']);
  }, [allTransactions, filterType, customFilters]);

  const groupedRows = useMemo(() => {
    const transactionsForGrouping = filteredTransactions.filter(t => !takenTransactionIds.has(t.id));
    if (!showGrouped || (transactionsForGrouping.length === 0 && processedNotes.length === 0)) return [];

    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(new Date(), { weekStartsOn: 1 });
    
    const assetFrequencyThisWeek = new Map<string, number>();
    allTransactions.forEach(t => {
      if (isWithinInterval(new Date(t.transaction_date), { start: startOfThisWeek, end: endOfThisWeek })) {
        const key = `${t.room}-${t.asset_year}-${t.asset_code}`;
        assetFrequencyThisWeek.set(key, (assetFrequencyThisWeek.get(key) || 0) + 1);
      }
    });

    const groupedByRoom = _.groupBy(transactionsForGrouping, 'room');
    const roomOrder = ['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'DVKH'];
    const sortedRooms = Object.keys(groupedByRoom).sort((a, b) => {
      const indexA = roomOrder.indexOf(a);
      const indexB = roomOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const rows: any[] = [];
    sortedRooms.forEach(room => {
      const groupedByYear = _.groupBy(groupedByRoom[room], 'asset_year');
      Object.keys(groupedByYear).sort().forEach(year => {
        const codesWithStatus = _.sortBy(groupedByYear[year], t => t.asset_code)
          .map(t => {
            const key = `${t.room}-${t.asset_year}-${t.asset_code}`;
            return (assetFrequencyThisWeek.get(key) || 0) > 1 ? `${t.asset_code}*` : t.asset_code;
          });
        rows.push({ id: `${room}-${year}`, room, year, codes: codesWithStatus.join(', '), isNote: false });
      });
    });

    processedNotes.forEach(note => {
      rows.push({
        id: `note-${note.id}`,
        room: `${note.room} - ${note.operation_type}: ${note.content}`,
        isNote: true,
        noteData: note,
      });
    });

    return rows;
  }, [showGrouped, filteredTransactions, takenTransactionIds, processedNotes, allTransactions]);

  // --- MUTATIONS ---
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['allAssetTransactions'] });
    queryClient.invalidateQueries({ queryKey: ['processedNotes'] });
    queryClient.invalidateQueries({ queryKey: ['takenAssetStatus'] });
  };

  const useGenericMutation = <TVariables, TData>(
    mutationFn: (vars: TVariables) => Promise<TData>,
    successMessage: string,
    errorMessage: string
  ) => {
    return useMutation<TData, Error, TVariables>({
      mutationFn,
      onSuccess: () => {
        toast.success(successMessage);
        invalidateQueries();
      },
      onError: (error: Error) => toast.error(errorMessage, { description: error.message }),
    });
  };

  const updateTransactionMutation = useGenericMutation(
    (vars: { id: string, updates: Partial<Transaction> }) => updateAssetTransaction(vars.id, vars.updates),
    "Giao dịch đã được cập nhật.", "Lỗi cập nhật giao dịch."
  );

  const deleteTransactionMutation = useGenericMutation(deleteAssetTransaction, "Giao dịch đã được xóa.", "Lỗi xóa giao dịch.");
  const addNoteMutation = useGenericMutation(addProcessedNote, "Ghi chú đã được thêm.", "Lỗi thêm ghi chú.");
  const updateNoteMutation = useGenericMutation(
    (vars: { id: string, updates: ProcessedNoteUpdate }) => updateProcessedNote(vars.id, vars.updates),
    "Ghi chú đã được cập nhật.", "Lỗi cập nhật ghi chú."
  );
  const deleteNoteMutation = useGenericMutation(deleteProcessedNote, "Ghi chú đã được xóa.", "Lỗi xóa ghi chú.");

  const toggleTakenStatusMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      if (!currentUser?.username) throw new Error("User not found");
      const weekYear = getCurrentWeekYear();
      const isTaken = takenTransactionIds.has(transaction.id);
      if (isTaken) {
        await deleteTakenAssetStatus(transaction.id, currentUser.username, weekYear);
      } else {
        await addTakenAssetStatus({ transaction_id: transaction.id, user_username: currentUser.username, week_year: weekYear });
      }
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công.");
      queryClient.invalidateQueries({ queryKey: ['takenAssetStatus', currentUser?.username, currentWeekYear] });
    },
    onError: (error: Error) => toast.error("Lỗi cập nhật trạng thái.", { description: error.message }),
  });

  // --- HANDLERS ---
  const handleNoteSubmit = async (noteData: ProcessedNoteInsert) => {
    if (!currentUser?.username) {
      toast.error("Bạn cần đăng nhập để thêm ghi chú.");
      return;
    }
    await addNoteMutation.mutateAsync({ ...noteData, staff_code: currentUser.username });
    if (noteData.mail_to_nv) {
      const email = formatEmail(noteData.mail_to_nv);
      if (email) {
        await sendEmail({
          to: email,
          subject: `Thông báo ghi chú đã duyệt: ${noteData.operation_type} - ${noteData.room}`,
          html: `<p><strong>Phòng:</strong> ${noteData.room}</p><p><strong>Loại tác nghiệp:</strong> ${noteData.operation_type}</p><p><strong>Nội dung:</strong></p><p>${noteData.content}</p>`,
        });
      }
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 500);
  };

  return {
    // Data
    filteredTransactions,
    groupedRows,
    processedNotes,
    takenTransactionIds,
    // State
    isLoading,
    isExporting,
    showGrouped,
    setShowGrouped,
    filterType,
    setFilterType,
    customFilters,
    setCustomFilters,
    lastUpdated,
    // Mutations
    updateTransaction: updateTransactionMutation.mutateAsync,
    deleteTransaction: deleteTransactionMutation.mutateAsync,
    addNote: handleNoteSubmit,
    updateNote: updateNoteMutation.mutateAsync,
    deleteNote: deleteNoteMutation.mutateAsync,
    toggleTakenStatus: toggleTakenStatusMutation.mutateAsync,
    // Handlers
    exportToPDF,
    // Current User
    currentUser,
  };
};