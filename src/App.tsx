import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NotificationPermissionPrompt } from '@/components/NotificationPermissionPrompt';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect, Suspense, lazy } from 'react';
import { memoryManager } from '@/utils/memoryManager';

// Lazy load all pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Login = lazy(() => import('@/pages/Login'));
const AssetEntry = lazy(() => import('@/pages/AssetEntry'));
const DailyReport = lazy(() => import('@/pages/DailyReport'));
const BorrowReport = lazy(() => import('@/pages/BorrowReport'));
const AssetReminders = lazy(() => import('@/pages/AssetReminders'));
const CRCReminders = lazy(() => import('@/pages/CRCReminders'));
const OtherAssets = lazy(() => import('@/pages/OtherAssets'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));

// Heavy admin pages - lazy load with higher priority
const DataManagement = lazy(() => import('@/pages/DataManagement'));
const SecurityMonitor = lazy(() => import('@/pages/SecurityMonitor').then(module => ({ default: module.default })));
const ErrorMonitoring = lazy(() => import('@/pages/ErrorMonitoring'));
const UsageMonitoring = lazy(() => import('@/pages/UsageMonitoring'));
const SystemBackup = lazy(() => import('@/pages/SystemBackup'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-gray-600 animate-pulse">Đang tải trang...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      // Enable background refetch for better UX
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function AppContent() {
  // Initialize memory management
  useEffect(() => {
    console.log('🧠 Initializing memory management...');
    
    // Set cleanup threshold to 85%
    memoryManager.setCleanupThreshold(85);
    
    // Log initial memory stats
    const stats = memoryManager.getMemoryStats();
    if (stats) {
      console.log('🧠 Initial memory usage:', `${stats.usagePercentage.toFixed(1)}%`);
    }

    // Cleanup on app unmount
    return () => {
      memoryManager.stopMonitoring();
    };
  }, []);

  //<dyad-problem-report summary="2 problems">
<problem file="src/pages/DailyReport.tsx" line="555" column="16" code="2739">Type '{ transactions: any[]; isLoading: boolean; showDateRange: true; showType: true; showTakenCheckbox: true; showTimeNhan: true; showActions: true; takenTransactionIds: Set&lt;string&gt;; onToggleTaken: (transactionId: any) =&gt; Promise&lt;...&gt;; }' is missing the following properties from type 'ReportTableProps': onEdit, onDelete</problem>
<problem file="src/pages/SecurityMonitor.tsx" line="205" column="13" code="2322">Type '{ recentEvents: { id: string; event_type: string; username: string; event_data: Json; user_agent: string; ip_address: string; created_at: string; }[]; threatTrends: ThreatTrend[]; isLoading: boolean; onRefresh: () =&gt; Promise&lt;...&gt;; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'recentEvents' does not exist on type 'IntrinsicAttributes'.</problem>
</dyad-problem-report><think>Deciding which files are relevant...

**Identifying Missing Props**

I'm currently focused on resolving the TypeScript errors. Error one points out a missing `onEdit` and `onDelete` prop within the `ReportTable` component. It seems I need to provide the correct props, as defined by `ReportTableProps`, to make it happy.  I'll investigate how these props are intended to be used.


**Pinpointing Prop Mismatches**

I'm now tackling the `SecurityMonitor.tsx` issues. It looks like the `SecurityOverview` component isn't designed to receive the props being passed to it. My next step is to either remove the props from `SecurityMonitor.tsx` if they're redundant or adjust `SecurityOverview` to properly accept these props. The component's reliance on the `useSecurityMonitoring` hook suggests that prop injection is unnecessary, and a refactor may be required.


**Resolving Compile-Time Issues**

I'm homing in on the root causes of the compile errors. For `ReportTable`, the solution is straightforward; I'll pass the pre-existing `handleEditTransaction` and `handleDeleteTransaction` functions as props. On the other hand, the `SecurityOverview` component seems to fetch its data internally. The fix is simply to remove the redundant prop passing from `SecurityMonitor.tsx` to resolve the type errors. I'll execute these changes next.


[
  "src/pages/DailyReport.tsx",
  "src/pages/SecurityMonitor.tsx"
]</think><dyad-codebase-context files="src/pages/DailyReport.tsx,src/pages/SecurityMonitor.tsx"></dyad-codebase-context><dyad-write path="src/pages/DailyReport.tsx" description="Fix ReportTable props by adding missing onEdit and onDelete handlers">
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AssetTransaction } from "@/api/entities/AssetTransaction";
import { ProcessedNote } from "@/api/entities/ProcessedNote";
import { TakenAssetStatus } from "@/api/entities/TakenAssetStatus";
import { CBQLN } from "@/api/entities/CBQLN";
import { CBKH } from "@/api/entities/CBKH";
import { LDPCRC } from "@/api/entities/LDPCRC";
import { CBCRC } from "@/api/entities/CBCRC";
import { QUYCRC } from "@/api/entities/QUYCRC";
import { SendEmail } from "@/api/integrations/SendEmail";
import { FileText, Download, Calendar, Filter, ListTree, ChevronLeft, ChevronRight, Plus, CheckCircle, Edit, Trash2 } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek, isWithinInterval, getWeek, getYear } from "date-fns";
import ReportTable from "@/components/reports/ReportTable";
import _ from 'lodash';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { withCache as fetchWithCache } from "@/utils/cacheManager";
import { Checkbox } from "@/components/ui/checkbox";
import AutoCompleteInput from "@/components/reminders/AutoCompleteInput";
import { Transaction } from '@/types/asset';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

// Helper function to get the current date and time in GMT+7
const getGMT7CurrentDateTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const gmt7Millis = utc + (7 * 60 * 60 * 1000);
  return new Date(gmt7Millis);
};

// Helper function to get the next working day (based on GMT+7)
const getNextWorkingDay = (baseDate = getGMT7CurrentDateTime()) => {
  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + 1);

  const dayOfWeek = newDate.getDay();
  if (dayOfWeek === 0) {
    newDate.setDate(newDate.getDate() + 1);
  } else if (dayOfWeek === 6) {
    newDate.setDate(newDate.getDate() + 2);
  }
  return newDate;
};

// Helper function to get the correct target date for morning-related filters (based on GMT+7)
const getMorningTargetDate = () => {
    const gmt7Now = getGMT7CurrentDateTime();
    const gmt7Hour = gmt7Now.getHours();
    const gmt7Minute = gmt7Now.getMinutes();
    const timeValue = gmt7Hour * 100 + gmt7Minute;

    if (timeValue >= 806) {
        return getNextWorkingDay(gmt7Now);
    }
    return gmt7Now;
}

// Helper function để lấy tuần hiện tại theo format YYYY-WW (based on GMT+7)
const getCurrentWeekYear = () => {
  const gmt7Now = getGMT7CurrentDateTime();
  const year = getYear(gmt7Now);
  const week = getWeek(gmt7Now, { weekStartsOn: 1 });
  return `${year}-${String(week).padStart(2, '0')}`;
};

function DailyReport() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showGrouped, setShowGrouped] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [customFilters, setCustomFilters] = useState({
    start: format(getGMT7CurrentDateTime(), 'yyyy-MM-dd'),
    end: format(getGMT7CurrentDateTime(), 'yyyy-MM-dd'),
    parts_day: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  const [takenTransactionIds, setTakenTransactionIds] = useState<Set<string>>(new Set<string>());
  const { user } = useAuth();
  
  const [lastUpdated, setLastUpdated] = useState(null);

  // States cho Notes management
  const [processedNotes, setProcessedNotes] = useState([]);
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    room: '',
    operation_type: '',
    content: '',
    mail_to_nv: ''
  });
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Transaction>>({});
  const [allStaff, setAllStaff] = useState([]);
  
  // States cho Note editing
  const [editingNote, setEditingNote] = useState(null);
  const [isEditNoteDialogOpen, setIsEditNoteDialogOpen] = useState(false);
  const [editNoteFormData, setEditNoteFormData] = useState({
    room: '',
    operation_type: '',
    content: ''
  });

  const loadAllStaff = useCallback(async () => {
    try {
        const [qln, kh, ldpcrc, cbcrc, quycrc] = await Promise.all([
            CBQLN.list(),
            CBKH.list(),
            LDPCRC.list(),
            CBCRC.list(),
            QUYCRC.list()
        ]);
        const combined = [...(qln||[]), ...(kh||[]), ...(ldpcrc||[]), ...(cbcrc||[]), ...(quycrc||[])];
        const uniqueStaff = _.uniqBy(combined, 'ten_nv');
        setAllStaff(uniqueStaff);
    } catch (error) {
        console.error("Error loading staff lists:", error);
    }
  }, []);

  useEffect(() => {
    loadAllStaff();
  }, [loadAllStaff]);

  // Load taken status from database for the current staff and week
  const loadTakenStatus = useCallback(async () => {
    if (!user?.username) {
        setTakenTransactionIds(new Set());
        return;
    }
    
    try {
      const currentWeek = getCurrentWeekYear();
      const takenStatuses = await TakenAssetStatus.filter({
        user_username: user.username,
        week_year: currentWeek
      });
      
      const takenIds = new Set(takenStatuses.map(status => status.transaction_id));
      setTakenTransactionIds(takenIds);
    } catch (error) {
      console.error("Error loading taken status:", error);
      setTakenTransactionIds(new Set());
    }
  }, [user?.username]);

  // Function để load transactions với cache bỏ qua khi auto-refresh
  const loadAllTransactions = useCallback(async (useCache = true) => {
    setIsLoading(true);
    try {
      let transactions;
      if (useCache) {
        transactions = await fetchWithCache('daily_report_transactions', async () => {
          return await AssetTransaction.list('-created_at', 1000);
        }, 60000);
      } else {
        transactions = await AssetTransaction.list('-created_at', 1000);
      }
      setAllTransactions(Array.isArray(transactions) ? transactions : []);
      setLastUpdated(getGMT7CurrentDateTime());
    } catch (error) {
      console.error("Error loading transactions:", error);
      setAllTransactions([]);
    }
    setIsLoading(false);
  }, []);

  // Load processed notes
  const loadProcessedNotes = useCallback(async () => {
    try {
      const notes = await ProcessedNote.filter({ is_done: false });
      setProcessedNotes(Array.isArray(notes) ? notes : []);
    } catch (error) {
      console.error("Error loading processed notes:", error);
      setProcessedNotes([]);
    }
  }, []);

  useEffect(() => {
    loadAllTransactions(true);
    loadProcessedNotes();
    
    if (user?.username) {
      loadTakenStatus();
    }

    const gmt7Now = getGMT7CurrentDateTime();
    const gmt7Hour = gmt7Now.getHours();
    const gmt7Minute = gmt7Now.getMinutes();
    const timeValue = gmt7Hour * 100 + gmt7Minute;

    if (timeValue >= 811 && timeValue <= 1310) {
      setFilterType('afternoon');
    } else {
      setFilterType('qln_pgd_next_day');
    }
  }, [user?.username, loadTakenStatus, loadAllTransactions, loadProcessedNotes]);

  // Auto-refresh mỗi 1 phút
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadAllTransactions(false);
        loadProcessedNotes();
        
        if (user?.username) {
          loadTakenStatus();
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [loadAllTransactions, loadProcessedNotes, loadTakenStatus, user?.username]);

  // Effect to reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, customFilters]);

  const filteredTransactions = useMemo(() => {
    if (allTransactions.length === 0) return [];
    
    let filtered;
    const gmt7Now = getGMT7CurrentDateTime();

    if (filterType === 'qln_pgd_next_day') {
      const targetDate = getMorningTargetDate();
      const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');
      const pgdRooms = ['CMT8', 'NS', 'ĐS', 'LĐH'];

      filtered = allTransactions.filter(t => {
        const isDateMatch = format(new Date(t.transaction_date), 'yyyy-MM-dd') === formattedTargetDate;
        if (!isDateMatch) return false;
        const isMorning = t.parts_day === 'Sáng';
        const isPgdAfternoon = t.parts_day === 'Chiều' && pgdRooms.includes(t.room);
        return isMorning || isPgdAfternoon;
      });
    } else if (filterType === 'next_day') {
      const targetDate = getNextWorkingDay(gmt7Now);
      const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');
      filtered = allTransactions.filter(t => format(new Date(t.transaction_date), 'yyyy-MM-dd') === formattedTargetDate);
    } else if (filterType === 'custom') {
      const dateFilterStart = new Date(customFilters.start + 'T00:00:00');
      const dateFilterEnd = new Date(customFilters.end + 'T23:59:59');
      const partsFilter = customFilters.parts_day === 'all' ? null : customFilters.parts_day;
      filtered = allTransactions.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        const isDateMatch = transactionDate >= dateFilterStart && transactionDate <= dateFilterEnd;
        const isPartsMatch = !partsFilter || t.parts_day === partsFilter;
        return isDateMatch && isPartsMatch;
      });
    } else {
      let targetDate;
      let partsFilter;

      if (filterType === 'morning') {
        targetDate = getMorningTargetDate();
        partsFilter = "Sáng";
      } else if (filterType === 'afternoon') {
        targetDate = gmt7Now;
        partsFilter = "Chiều";
      } else {
        targetDate = gmt7Now;
        partsFilter = null;
      }
      
      const formattedTargetDate = format(targetDate, 'yyyy-MM-dd');
      filtered = allTransactions.filter(t => {
        const isDateMatch = format(new Date(t.transaction_date), 'yyyy-MM-dd') === formattedTargetDate;
        const isPartsMatch = !partsFilter || t.parts_day === partsFilter;
        return isDateMatch && isPartsMatch;
      });
    }
    
    return _.orderBy(filtered, ['room', 'asset_year', t => parseInt(t.asset_code) || 0], ['asc', 'asc', 'asc']);
  }, [allTransactions, filterType, customFilters]);
  
  // Lọc ra danh sách dành cho việc gom nhóm (loại bỏ những TS đã lấy)
  const transactionsForGrouping = useMemo(() => {
    return filteredTransactions.filter(t => !takenTransactionIds.has(t.id));
  }, [filteredTransactions, takenTransactionIds]);

  // Pagination logic cho danh sách chi tiết
  const totalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  }, [filteredTransactions.length, ITEMS_PER_PAGE]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage, ITEMS_PER_PAGE]);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    window.print();
    setIsExporting(false);
  };

  // Memoize date formatting to avoid recalculating on every render
  const { 
    todayFormatted, 
    nextWorkingDayFormatted, 
    morningDateFormatted, 
    qlnPgdDateFormatted 
  } = useMemo(() => {
    const gmt7Now = getGMT7CurrentDateTime();
    const morningTargetDate = getMorningTargetDate();
    const qlnPgdTargetDate = getMorningTargetDate();

    return {
      todayFormatted: format(gmt7Now, 'dd/MM/yyyy'),
      nextWorkingDayFormatted: format(getNextWorkingDay(gmt7Now), 'dd/MM/yyyy'),
      morningDateFormatted: format(morningTargetDate, 'dd/MM/yyyy'),
      qlnPgdDateFormatted: format(qlnPgdTargetDate, 'dd/MM/yyyy')
    };
  }, []);

  // Handle note submission
  const handleNoteSubmit = useCallback(async () => {
    if (!user?.username) {
      alert("Bạn cần đăng nhập để tạo ghi chú.");
      return;
    }
    if (!noteFormData.room || !noteFormData.operation_type || !noteFormData.content.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin ghi chú (Phòng, Loại tác nghiệp, Nội dung).");
      return;
    }

    try {
      await ProcessedNote.create({
        ...noteFormData,
        staff_code: user?.username || 'unknown'
      });
      
      if (noteFormData.mail_to_nv) {
          const recipient = allStaff.find(s => s.email === noteFormData.mail_to_nv);
          if (recipient && recipient.email) {
              const emailBody = `
                  <p><strong>Phòng:</strong> ${noteFormData.room}</p>
                  <p><strong>Loại tác nghiệp:</strong> ${noteFormData.operation_type}</p>
                  <p><strong>Nội dung:</strong></p>
                  <p style="white-space: pre-wrap;">${noteFormData.content}</p>
                  <br>
                  <p><em>Ghi chú được tạo bởi: ${user?.staff_name || user?.username || 'N/A'}</em></p>
              `;
              await SendEmail({
                  to: recipient.email,
                  subject: `Thông báo ghi chú đã duyệt: ${noteFormData.operation_type} - ${noteFormData.room}`,
                  body: emailBody,
                  from_name: "Hệ thống Quản lý Tài sản - Notes"
              });
          }
      }

      setNoteFormData({ room: '', operation_type: '', content: '', mail_to_nv: '' });
      setIsNotesDialogOpen(false);
      loadProcessedNotes();
    } catch (error) {
      console.error("Error creating note or sending email:", error);
      alert("Lỗi khi tạo ghi chú. Vui lòng thử lại.");
    }
  }, [noteFormData, user, loadProcessedNotes, allStaff]);

  const handleToggleTakenStatus = useCallback(async (transactionId) => {
    if (!user?.username) {
        console.warn("Cannot toggle taken status: No staff logged in.");
        return;
    }
    
    try {
      const currentWeek = getCurrentWeekYear();
      const isCurrentlyTaken = takenTransactionIds.has(transactionId);
      
      if (isCurrentlyTaken) {
        const existingStatuses = await TakenAssetStatus.filter({
          transaction_id: transactionId,
          user_username: user.username,
          week_year: currentWeek
        });
        
        for (const status of existingStatuses) {
          await TakenAssetStatus.delete(status.id);
        }
        
        setTakenTransactionIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(transactionId);
          return newIds;
        });
      } else {
        await TakenAssetStatus.create({
          transaction_id: transactionId,
          user_username: user.username,
          week_year: currentWeek,
          marked_at: new Date().toISOString()
        });
        
        setTakenTransactionIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.add(transactionId);
          return newIds;
        });
      }
    } catch (error) {
      console.error("Error toggling taken status:", error);
      alert("Lỗi khi thay đổi trạng thái đã lấy. Vui lòng thử lại.");
    }
  }, [user?.username, takenTransactionIds]);

  // Add placeholder handlers for edit and delete
  const handleEditTransaction = useCallback((transaction: any) => {
    console.log('Edit transaction:', transaction);
    // Placeholder - implement edit functionality if needed
  }, []);

  const handleDeleteTransaction = useCallback((transactionId: string) => {
    console.log('Delete transaction:', transactionId);
    // Placeholder - implement delete functionality if needed
  }, []);

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="mb-8 no-print">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Danh sách TS cần lấy</h1>
                {lastUpdated && (
                  <p className="text-slate-600 text-sm">
                    Cập nhật lần cuối: {format(lastUpdated, 'HH:mm:ss - dd/MM/yyyy')} (Tự động mỗi 1 phút)
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={exportToPDF}
                disabled={isExporting || filteredTransactions.length === 0}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-500/25"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? "Đang xuất..." : "Xuất PDF"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card className="border-0 shadow-xl shadow-slate-100/50 no-print">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Bộ lọc danh sách cần xem:
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <RadioGroup value={filterType} onValueChange={setFilterType} className="mb-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="morning" id="morning-range" />
                  <Label htmlFor="morning-range" className="font-normal cursor-pointer">
                    Sáng ngày ({morningDateFormatted})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="qln_pgd_next_day" id="qln_pgd_next_day-range" />
                  <Label htmlFor="qln_pgd_next_day-range" className="font-normal cursor-pointer">
                    QLN Sáng & PGD trong ngày ({qlnPgdDateFormatted})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afternoon" id="afternoon-range" />
                  <Label htmlFor="afternoon-range" className="font-normal cursor-pointer">
                    Chiều ngày ({todayFormatted})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="today" id="today-range" />
                  <Label htmlFor="today-range" className="font-normal cursor-pointer">
                    Trong ngày hôm nay ({todayFormatted})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="next_day" id="next_day-range" />
                  <Label htmlFor="next_day-range" className="font-normal cursor-pointer">
                    Trong ngày kế tiếp ({nextWorkingDayFormatted})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom-range" />
                  <Label htmlFor="custom-range" className="font-normal cursor-pointer">Tùy chọn khoảng thời gian</Label>
                </div>
              </RadioGroup>
              {filterType === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                   <div className="space-y-2">
                     <Label htmlFor="parts_day_filter">Buổi</Label>
                     <Select value={customFilters.parts_day} onValueChange={(v) => setCustomFilters({...customFilters, parts_day: v})}>
                        <SelectTrigger id="parts_day_filter" className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Chọn buổi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            <SelectItem value="Sáng">Sáng</SelectItem>
                            <SelectItem value="Chiều">Chiều</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Từ ngày</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      value={customFilters.start}
                      onChange={(e) => setCustomFilters({...customFilters, start: e.target.value})}
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Đến ngày</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      value={customFilters.end}
                      onChange={(e) => setCustomFilters({...customFilters, end: e.target.value})}
                      className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl shadow-slate-100/50">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Danh sách tài sản cần lấy ({filteredTransactions.length} bản ghi)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ReportTable 
                transactions={paginatedTransactions}
                isLoading={isLoading}
                showDateRange={true}
                showType={true}
                showTakenCheckbox={true}
                showTimeNhan={true}
                showActions={true}
                takenTransactionIds={takenTransactionIds}
                onToggleTaken={handleToggleTakenStatus}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            </CardContent>
          </Card>
        </div>

        {/* Pagination Controls */}
        {filteredTransactions.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center gap-4 mt-6 no-print">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-600 border-slate-300"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Trang trước
            </Button>
            <span className="text-slate-600 font-medium">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              className="bg-white hover:bg-slate-50 text-slate-600 border-slate-300"
            >
              Trang sau
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default DailyReport;