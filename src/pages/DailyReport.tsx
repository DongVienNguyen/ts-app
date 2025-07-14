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

// Helper function to get the current date and time in GMT+7
const getGMT7CurrentDateTime = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // Convert to UTC milliseconds
  const gmt7Millis = utc + (7 * 60 * 60 * 1000); // Add 7 hours for GMT+7
  return new Date(gmt7Millis);
};

// Helper function to get the next working day (based on GMT+7)
const getNextWorkingDay = (baseDate = getGMT7CurrentDateTime()) => { // Default to current GMT+7 date
  const newDate = new Date(baseDate); // Create a mutable copy
  newDate.setDate(newDate.getDate() + 1); // Add one day

  const dayOfWeek = newDate.getDay(); // This will correctly reflect the day of week for the GMT+7 date
  if (dayOfWeek === 0) { // If it's Sunday, move to Monday
    newDate.setDate(newDate.getDate() + 1);
  } else if (dayOfWeek === 6) { // If it's Saturday, move to Monday
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

    // From 08:06 onwards, target is the next working day
    if (timeValue >= 806) {
        return getNextWorkingDay(gmt7Now); // Pass the GMT+7 date
    }
    // Before 08:06, target is the current day
    return gmt7Now; // Return the GMT+7 date
}

// Helper function để lấy tuần hiện tại theo format YYYY-WW (based on GMT+7)
const getCurrentWeekYear = () => {
  const gmt7Now = getGMT7CurrentDateTime();
  const year = getYear(gmt7Now);
  const week = getWeek(gmt7Now, { weekStartsOn: 1 }); // Tuần bắt đầu từ thứ 2
  return `${year}-${String(week).padStart(2, '0')}`;
};

export default function DailyReport() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showGrouped, setShowGrouped] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [customFilters, setCustomFilters] = useState({
    start: format(getGMT7CurrentDateTime(), 'yyyy-MM-dd'), // Initialize with GMT+7 date
    end: format(getGMT7CurrentDateTime(), 'yyyy-MM-dd'),   // Initialize with GMT+7 date
    parts_day: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;
  
  // State để lưu các ID của giao dịch đã được đánh dấu "Đã lấy" (đồng bộ qua database)
  const [takenTransactionIds, setTakenTransactionIds] = useState<Set<string>>(new Set<string>());
  const [currentStaff, setCurrentStaff] = useState(null);
  
  // State để hiển thị thời gian cập nhật cuối cùng
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

  // Load current staff from localStorage on component mount
  useEffect(() => {
    try {
      const staffData = localStorage.getItem('loggedInStaff');
      if (staffData) {
        setCurrentStaff(JSON.parse(staffData));
      }
    } catch (error) {
      console.error("Error loading staff data:", error);
    }
  }, []);

  // Load taken status from database for the current staff and week
  const loadTakenStatus = useCallback(async () => {
    if (!currentStaff?.username) {
        setTakenTransactionIds(new Set()); // Clear if no staff
        return;
    }
    
    try {
      const currentWeek = getCurrentWeekYear();
      const takenStatuses = await TakenAssetStatus.filter({
        user_username: currentStaff.username,
        week_year: currentWeek
      });
      
      const takenIds = new Set(takenStatuses.map(status => status.transaction_id));
      setTakenTransactionIds(takenIds);
    } catch (error) {
      console.error("Error loading taken status:", error);
      setTakenTransactionIds(new Set());
    }
  }, [currentStaff?.username]);

  // Function để load transactions với cache bỏ qua khi auto-refresh
  const loadAllTransactions = useCallback(async (useCache = true) => {
    setIsLoading(true);
    try {
      let transactions;
      if (useCache) {
        transactions = await fetchWithCache('daily_report_transactions', async () => {
          return await AssetTransaction.list('-created_date', 1000);
        }, 60000); // Cache for 1 minute
      } else {
        // Bỏ qua cache khi auto-refresh để lấy dữ liệu mới nhất
        transactions = await AssetTransaction.list('-created_date', 1000);
      }
      setAllTransactions(Array.isArray(transactions) ? transactions : []);
      setLastUpdated(getGMT7CurrentDateTime()); // Set last updated time using GMT+7
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
    loadAllTransactions(true); // Lần đầu sử dụng cache
    loadProcessedNotes(); // Load notes on mount
    
    // Load taken status after transactions and currentStaff are potentially available
    if (currentStaff?.username) {
      loadTakenStatus();
    }

    const gmt7Now = getGMT7CurrentDateTime(); // Use GMT+7 current date/time
    const gmt7Hour = gmt7Now.getHours();
    const gmt7Minute = gmt7Now.getMinutes();
    const timeValue = gmt7Hour * 100 + gmt7Minute;

    if (timeValue >= 811 && timeValue <= 1310) {
      setFilterType('afternoon');
    } else {
      setFilterType('qln_pgd_next_day');
    }
  }, [currentStaff?.username, loadTakenStatus, loadAllTransactions, loadProcessedNotes]);

  // Auto-refresh mỗi 1 phút
  useEffect(() => {
    const interval = setInterval(() => {
      // Chỉ refresh khi tab đang active để tiết kiệm tài nguyên
      if (!document.hidden) {
        loadAllTransactions(false); // Không dùng cache để lấy dữ liệu mới nhất
        loadProcessedNotes(); // Also refresh notes
        
        // Reload taken status if needed
        if (currentStaff?.username) {
          loadTakenStatus();
        }
      }
    }, 60000); // 1 phút = 60000ms

    return () => clearInterval(interval);
  }, [loadAllTransactions, loadProcessedNotes, loadTakenStatus, currentStaff?.username]);

  // Effect to reset current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, customFilters]);

  // Thêm useEffect để tự động cuộn đến phần danh sách TS trên mobile
  useEffect(() => {
    const scrollToMainContent = () => {
      // Kiểm tra nếu là giao diện mobile (màn hình < 768px)
      if (window.innerWidth < 768) {
        const targetElement = document.getElementById('main-content-section');
        if (targetElement) {
          // Cuộn đến phần main content với offset để hiển thị ở đầu màn hình
          const offsetTop = targetElement.offsetTop - 20;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    };

    // Delay một chút để đảm bảo DOM đã render xong
    const timeoutId = setTimeout(scrollToMainContent, 800);
    
    return () => clearTimeout(timeoutId);
  }, []); // Chỉ chạy một lần khi component mount

  const filteredTransactions = useMemo(() => {
    if (allTransactions.length === 0) return [];
    
    let filtered;
    const gmt7Now = getGMT7CurrentDateTime(); // Get GMT+7 current date/time once

    if (filterType === 'qln_pgd_next_day') {
      const targetDate = getMorningTargetDate(); // This already returns GMT+7 adjusted Date
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
      const targetDate = getNextWorkingDay(gmt7Now); // Pass GMT+7 now
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
        targetDate = getMorningTargetDate(); // This already returns GMT+7 adjusted Date
        partsFilter = "Sáng";
      } else if (filterType === 'afternoon') {
        targetDate = gmt7Now; // Use GMT+7 current date
        partsFilter = "Chiều";
      } else { // 'today'
        targetDate = gmt7Now; // Use GMT+7 current date
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
    const gmt7Now = getGMT7CurrentDateTime(); // Use GMT+7 current date/time
    const morningTargetDate = getMorningTargetDate(); // This returns GMT+7 adjusted Date
    const qlnPgdTargetDate = getMorningTargetDate(); // As per requirement, uses the same logic

    return {
      todayFormatted: format(gmt7Now, 'dd/MM/yyyy'), // Format GMT+7 date
      nextWorkingDayFormatted: format(getNextWorkingDay(gmt7Now), 'dd/MM/yyyy'), // Format GMT+7 next working day
      morningDateFormatted: format(morningTargetDate, 'dd/MM/yyyy'),
      qlnPgdDateFormatted: format(qlnPgdTargetDate, 'dd/MM/yyyy')
    };
  }, []);

  // Handle note submission
  const handleNoteSubmit = useCallback(async () => {
    if (!noteFormData.room || !noteFormData.operation_type || !noteFormData.content.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin ghi chú (Phòng, Loại tác nghiệp, Nội dung).");
      return;
    }

    try {
      await ProcessedNote.create({
        ...noteFormData,
        staff_code: currentStaff?.username || 'unknown'
      });
      
      // Gửi email nếu có người nhận
      if (noteFormData.mail_to_nv) {
          const recipient = allStaff.find(s => s.email === noteFormData.mail_to_nv); // Changed to s.email
          if (recipient && recipient.email) {
              const emailBody = `
                  <p><strong>Phòng:</strong> ${noteFormData.room}</p>
                  <p><strong>Loại tác nghiệp:</strong> ${noteFormData.operation_type}</p>
                  <p><strong>Nội dung:</strong></p>
                  <p style="white-space: pre-wrap;">${noteFormData.content}</p>
                  <br>
                  <p><em>Ghi chú được tạo bởi: ${currentStaff?.staff_name || currentStaff?.username || 'N/A'}</em></p>
              `;
              await SendEmail({
                  to: recipient.email, // Use recipient.email directly
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
  }, [noteFormData, currentStaff, loadProcessedNotes, allStaff]);

  // Handle note completion
  const handleNoteDone = useCallback(async (noteId) => {
    try {
      await ProcessedNote.update(noteId, {
        is_done: true,
        done_at: new Date().toISOString()
      });
      loadProcessedNotes();
    } catch (error) {
      console.error("Error marking note as done:", error);
      alert("Lỗi khi đánh dấu ghi chú đã xong. Vui lòng thử lại.");
    }
  }, [loadProcessedNotes]);

  // Handle note edit
  const handleEditNote = useCallback((note) => {
    setEditingNote(note);
    setEditNoteFormData({
      room: note.room,
      operation_type: note.operation_type,
      content: note.content
    });
    setIsEditNoteDialogOpen(true);
  }, []);

  // Handle note update
  const handleUpdateNote = useCallback(async () => {
    if (!editingNote) return;

    try {
      await ProcessedNote.update(editingNote.id, editNoteFormData);
      setIsEditNoteDialogOpen(false);
      setEditingNote(null);
      loadProcessedNotes();
    } catch (error) {
      console.error("Error updating note:", error);
      alert("Lỗi khi cập nhật ghi chú. Vui lòng thử lại.");
    }
  }, [editingNote, editNoteFormData, loadProcessedNotes]);

  // Handle note delete
  const handleDeleteNote = useCallback(async (noteId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi chú này?")) return;

    try {
      await ProcessedNote.delete(noteId);
      loadProcessedNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      alert("Lỗi khi xóa ghi chú. Vui lòng thử lại.");
    }
  }, [loadProcessedNotes]);

  // Handle transaction edit
  const handleEditTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setEditFormData({
      transaction_date: format(new Date(transaction.transaction_date), 'yyyy-MM-dd'),
      parts_day: transaction.parts_day,
      room: transaction.room,
      transaction_type: transaction.transaction_type,
      asset_year: transaction.asset_year,
      asset_code: transaction.asset_code,
      note: transaction.note || ''
    });
    setIsEditDialogOpen(true);
  }, []);

  // Handle transaction update
  const handleUpdateTransaction = useCallback(async () => {
    if (!editingTransaction) return;

    try {
      await AssetTransaction.update(editingTransaction.id, editFormData);
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
      alert("Cập nhật giao dịch thành công!");
      // Reload data
      loadAllTransactions(false);
    } catch (error) {
      console.error("Error updating giao dịch:", error);
      alert("Lỗi khi cập nhật giao dịch. Vui lòng thử lại.");
    }
  }, [editingTransaction, editFormData, loadAllTransactions]);

  // Handle transaction delete
  const handleDeleteTransaction = useCallback(async (transactionId) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;

    try {
      await AssetTransaction.delete(transactionId);
      alert("Xóa giao dịch thành công!");
      loadAllTransactions(false);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Lỗi khi xóa giao dịch. Vui lòng thử lại.");
    }
  }, [loadAllTransactions]);

  const groupedRows = useMemo(() => {
    // Sử dụng transactionsForGrouping thay vì filteredTransactions
    if (!showGrouped || (transactionsForGrouping.length === 0 && processedNotes.length === 0)) return [];
    
    // Create a frequency map for assets taken this week
    const gmt7Now = getGMT7CurrentDateTime(); // Use GMT+7 for current week calculation
    // Setting weekStartsOn: 1 makes Monday the first day of the week
    const startOfThisWeek = startOfWeek(gmt7Now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(gmt7Now, { weekStartsOn: 1 });
    
    const assetFrequencyThisWeek = new Map();
    allTransactions.forEach(t => {
      const transactionDate = new Date(t.transaction_date);
      if (isWithinInterval(transactionDate, { start: startOfThisWeek, end: endOfThisWeek })) {
        const key = `${t.room}-${t.asset_year}-${t.asset_code}`;
        assetFrequencyThisWeek.set(key, (assetFrequencyThisWeek.get(key) || 0) + 1);
      }
    });

    const groupedByRoom = _.groupBy(transactionsForGrouping, 'room');
    const roomOrder = ['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'DVKH'];
    const sortedRooms = Object.keys(groupedByRoom).sort((a, b) => {
      const indexA = roomOrder.indexOf(a);
      const indexB = roomOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b); // Both not in order, sort alphabetically
      if (indexA === -1) return 1; // A not in order, B is
      if (indexB === -1) return -1; // B not in order, A is
      return indexA - indexB; // Both in order
    });

    const rows = [];
    
    // Thêm các phòng thông thường
    for (const room of sortedRooms) {
      const groupedByYear = _.groupBy(groupedByRoom[room], 'asset_year');
      const sortedYears = Object.keys(groupedByYear).sort((a, b) => parseInt(a) - parseInt(b));
      for (const year of sortedYears) {
        const codesWithStatus = _.sortBy(groupedByYear[year], t => parseInt(t.asset_code) || 0)
          .map(t => {
            const key = `${t.room}-${t.asset_year}-${t.asset_code}`;
            const wasTakenBefore = (assetFrequencyThisWeek.get(key) || 0) > 1;
            return `${t.asset_code}${wasTakenBefore ? '*' : ''}`;
          });
        
        rows.push({ id: `${room}-${year}`, room, year, codes: codesWithStatus.join(', ') });
      }
    }

    // Thêm Notes section ở cuối
    if (processedNotes.length > 0) {
      processedNotes.forEach((note) => {
        rows.push({
          id: `note-${note.id}`,
          room: `${note.room} - ${note.operation_type}: ${note.content}`,
          year: '',
          codes: '',
          isNote: true,
          noteData: note,
          isFullWidth: true
        });
      });
    }

    return rows;
  }, [showGrouped, transactionsForGrouping, allTransactions, processedNotes]);

  const headerDateDisplay = useMemo(() => {
    const gmt7Now = getGMT7CurrentDateTime(); // Use GMT+7 current date/time
    const morningTargetDate = getMorningTargetDate(); // This returns GMT+7 adjusted Date
    const qlnPgdTargetDate = getMorningTargetDate(); // As per requirement, uses the same logic

    const todayFormatted = format(gmt7Now, 'dd/MM/yyyy'); // Format GMT+7 date
    const nextWorkingDayFormatted = format(getNextWorkingDay(gmt7Now), 'dd/MM/yyyy'); // Format GMT+7 next working day
    const morningDateFormatted = format(morningTargetDate, 'dd/MM/yyyy');
    const qlnPgdDateFormatted = format(qlnPgdTargetDate, 'dd/MM/yyyy');

    switch(filterType) {
      case 'morning':
        return `Sáng ngày (${morningDateFormatted})`;
      case 'afternoon':
        return `Chiều ngày (${todayFormatted})`;
      case 'qln_pgd_next_day':
        return `QLN Sáng & PGD trong ngày (${qlnPgdDateFormatted})`;
      case 'today':
        return `Trong ngày hôm nay (${todayFormatted})`;
      case 'next_day':
        return `Trong ngày kế tiếp (${nextWorkingDayFormatted})`;
      case 'custom':
        const start = new Date(customFilters.start + 'T00:00:00');
        const end = new Date(customFilters.end + 'T00:00:00');
        let datePart = start.getTime() === end.getTime() ? `Ngày ${format(start, 'dd/MM/yyyy')}` : `Từ ${format(start, 'dd/MM/yyyy')} đến ${format(end, 'dd/MM/yyyy')}`;
        if (customFilters.parts_day === 'Sáng') datePart += ' (Sáng)';
        else if (customFilters.parts_day === 'Chiều') datePart += ' (Chiều)';
        return datePart;
      default:
        return "";
    }
  }, [filterType, customFilters]);

  const handleToggleTakenStatus = useCallback(async (transactionId) => {
    if (!currentStaff?.username) {
        console.warn("Cannot toggle taken status: No staff logged in.");
        return;
    }
    
    try {
      const currentWeek = getCurrentWeekYear();
      const isCurrentlyTaken = takenTransactionIds.has(transactionId);
      
      if (isCurrentlyTaken) {
        // Xóa đánh dấu - tìm và xóa record trong database
        const existingStatuses = await TakenAssetStatus.filter({
          transaction_id: transactionId,
          user_username: currentStaff.username,
          week_year: currentWeek
        });
        
        for (const status of existingStatuses) {
          await TakenAssetStatus.delete(status.id);
        }
        
        // Cập nhật state local
        setTakenTransactionIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(transactionId);
          return newIds;
        });
      } else {
        // Thêm đánh dấu - tạo record mới trong database
        await TakenAssetStatus.create({
          transaction_id: transactionId,
          user_username: currentStaff.username,
          week_year: currentWeek,
          marked_at: new Date().toISOString()
        });
        
        // Cập nhật state local
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
  }, [currentStaff?.username, takenTransactionIds]);

  return (
    <div className="p-4 md:p-8">
       <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none; }
        }
      `}</style>

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
            <Button
              onClick={() => setShowGrouped(!showGrouped)}
              disabled={filteredTransactions.length === 0 && processedNotes.length === 0}
              variant="outline"
              className="bg-white hover:bg-purple-50 border-purple-600 text-purple-600 shadow-lg shadow-purple-500/10"
            >
              <ListTree className="w-4 h-4 mr-2" />
              {showGrouped ? "Ẩn DS" : "Hiện DS"}
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
      
        <div id="print-section" className="space-y-6">
          {showGrouped && (
            <Card className="border-0 shadow-xl shadow-slate-100/50" id="main-content-section">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b border-slate-200">
                <CardTitle className="text-lg font-semibold text-slate-800 flex justify-between items-center">
                  <span>{headerDateDisplay}</span>
                  <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-blue-50 hover:bg-blue-100 border-blue-600 text-blue-600">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Thêm ghi chú đã duyệt</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Phòng</Label>
                          <Select value={noteFormData.room} onValueChange={(value) => setNoteFormData({...noteFormData, room: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn phòng" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="QLN">QLN</SelectItem>
                              <SelectItem value="CMT8">CMT8</SelectItem>
                              <SelectItem value="NS">NS</SelectItem>
                              <SelectItem value="ĐS">ĐS</SelectItem>
                              <SelectItem value="LĐH">LĐH</SelectItem>
                              <SelectItem value="NQ">NQ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Loại tác nghiệp</Label>
                          <Select value={noteFormData.operation_type} onValueChange={(value) => setNoteFormData({...noteFormData, operation_type: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại tác nghiệp" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hoàn trả">Hoàn trả</SelectItem>
                              <SelectItem value="Xuất kho">Xuất kho</SelectItem>
                              <SelectItem value="Nhập kho">Nhập kho</SelectItem>
                              <SelectItem value="Xuất mượn">Xuất mượn</SelectItem>
                              <SelectItem value="Thiếu CT">Thiếu CT</SelectItem>
                              <SelectItem value="Khác">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nội dung</Label>
                          <Textarea
                            value={noteFormData.content}
                            onChange={(e) => setNoteFormData({...noteFormData, content: e.target.value})}
                            placeholder="Nhập nội dung ghi chú..."
                            className="h-24"
                          />
                        </div>
                        <div className="flex items-end gap-3">
                          <div className="flex-1 space-y-2">
                            <Label>Mail đến NV (Tùy chọn)</Label>
                            <AutoCompleteInput
                              value={noteFormData.mail_to_nv}
                              onChange={(value) => setNoteFormData({...noteFormData, mail_to_nv: value})}
                              suggestions={allStaff.map(s => ({ value: s.email, label: s.ten_nv }))} // Pass value and label
                              placeholder="Nhập tên nhân viên để gửi email..."
                            />
                          </div>
                          <Button onClick={handleNoteSubmit} className="bg-green-600 hover:bg-green-700 h-10">
                            Gửi
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
                <CardDescription>
                  <p>Dấu (*) TS đã được nhắn hơn một lần trong tuần</p>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 px-1">Phòng</TableHead>
                      <TableHead className="w-14 px-2">Năm</TableHead>
                      <TableHead className="px-2">Danh sách Mã TS</TableHead>
                      <TableHead className="w-32 px-1 text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRows.length > 0 ? groupedRows.map(row => (
                      <TableRow key={row.id}>
                        {row.isFullWidth ? (
                            <TableCell colSpan={3} className="font-bold text-lg px-2 whitespace-pre-wrap">
                                {row.room}
                            </TableCell>
                        ) : (
                          <>
                            <TableCell className={`font-bold text-lg px-1`}>
                              {row.room}
                            </TableCell>
                            <TableCell className="font-bold text-lg px-1">{row.year}</TableCell>
                            <TableCell className={`font-bold text-lg px-2`}>
                              {row.codes}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="px-1 text-right">
                          {row.isNote && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditNote(row.noteData)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Chỉnh sửa ghi chú"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNote(row.noteData.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Xóa ghi chú"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleNoteDone(row.noteData.id)}
                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white"
                                title="Đánh dấu đã xử lý"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">Không có dữ liệu để gom nhóm.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl shadow-slate-100/50">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <CardTitle className="text-lg font-semibold text-slate-800">
                Danh sách tài sản cần lấy ({filteredTransactions.length} bản ghi)
              </CardTitle>
               <CardDescription>{headerDateDisplay}</CardDescription>
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
      </div>

      {/* Edit Note Dialog */}
      <Dialog open={isEditNoteDialogOpen} onOpenChange={setIsEditNoteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa ghi chú</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phòng</Label>
              <Select value={editNoteFormData.room} onValueChange={(value) => setEditNoteFormData({...editNoteFormData, room: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QLN">QLN</SelectItem>
                  <SelectItem value="CMT8">CMT8</SelectItem>
                  <SelectItem value="NS">NS</SelectItem>
                  <SelectItem value="ĐS">ĐS</SelectItem>
                  <SelectItem value="LĐH">LĐH</SelectItem>
                  <SelectItem value="NQ">NQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Loại tác nghiệp</Label>
              <Select value={editNoteFormData.operation_type} onValueChange={(value) => setEditNoteFormData({...editNoteFormData, operation_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại tác nghiệp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hoàn trả">Hoàn trả</SelectItem>
                  <SelectItem value="Xuất kho">Xuất kho</SelectItem>
                  <SelectItem value="Nhập kho">Nhập kho</SelectItem>
                  <SelectItem value="Xuất mượn">Xuất mượn</SelectItem>
                  <SelectItem value="Thiếu CT">Thiếu CT</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea
                value={editNoteFormData.content}
                onChange={(e) => setEditNoteFormData({...editNoteFormData, content: e.target.value})}
                placeholder="Nhập nội dung ghi chú..."
                className="h-24"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditNoteDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateNote} className="bg-blue-600 hover:bg-blue-700">
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giao dịch</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Ngày giao dịch</Label>
              <Input
                type="date"
                value={editFormData.transaction_date || ''}
                onChange={(e) => setEditFormData({...editFormData, transaction_date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Buổi</Label>
              <Select value={editFormData.parts_day || ''} onValueChange={(value) => setEditFormData({...editFormData, parts_day: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn buổi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sáng">Sáng</SelectItem>
                  <SelectItem value="Chiều">Chiều</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phòng</Label>
              <Select value={editFormData.room || ''} onValueChange={(value) => setEditFormData({...editFormData, room: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phòng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QLN">QLN</SelectItem>
                  <SelectItem value="CMT8">CMT8</SelectItem>
                  <SelectItem value="NS">NS</SelectItem>
                  <SelectItem value="ĐS">ĐS</SelectItem>
                  <SelectItem value="LĐH">LĐH</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Loại tác nghiệp</Label>
              <Select value={editFormData.transaction_type || ''} onValueChange={(value) => setEditFormData({...editFormData, transaction_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Xuất kho">Xuất kho</SelectItem>
                  <SelectItem value="Mượn TS">Mượn TS</SelectItem>
                  <SelectItem value="Thay bìa">Thay bìa</SelectItem>
                  <SelectItem value="Khác">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Năm TS</Label>
              <Input
                type="number"
                value={editFormData.asset_year || ''}
                onChange={(e) => setEditFormData({...editFormData, asset_year: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <Label>Mã TS</Label>
              <Input
                type="number"
                value={editFormData.asset_code || ''}
                onChange={(e) => setEditFormData({...editFormData, asset_code: parseInt(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ghi chú</Label>
              <Textarea
                value={editFormData.note || ''}
                onChange={(e) => setEditFormData({...editFormData, note: e.target.value})}
                placeholder="Nhập ghi chú..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdateTransaction} className="bg-blue-600 hover:bg-blue-700">
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagination Controls */}
      {filteredTransactions.length > ITEMS_PER_PAGE && (
        <div className="flex justify-center items-center gap-4 mt-6 no-print">
          <Button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Trước
          </Button>
          <span className="text-slate-700 font-medium">
            Trang {currentPage} trên {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            className="bg-white hover:bg-slate-50 text-slate-600 shadow-sm"
          >
            Tiếp <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}