import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV, fromCSV } from '@/utils/csvUtils';
import { useSecureAuth } from '@/contexts/AuthContext';

// Types
export interface DataManagementState {
  selectedEntity: string;
  data: any[];
  totalCount: number;
  isLoading: boolean;
  searchTerm: string;
  currentPage: number;
  dialogOpen: boolean;
  editingItem: any;
  startDate: string;
  endDate: string;
  message: { type: string; text: string };
  restoreFile: File | null;
  activeTab: string;
}

export interface CacheEntry {
  data: any[];
  count: number;
  timestamp: number;
}

export interface DataManagementActions {
  handleAdd: () => void;
  handleEdit: (item: any) => void;
  handleSave: (formData: any) => Promise<void>;
  handleDelete: (item: any) => Promise<void>;
  toggleStaffLock: (staff: any) => Promise<void>;
  exportToCSV: () => void;
  handleRestoreData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleImportClick: () => void;
  bulkDeleteTransactions: () => Promise<void>;
  refreshData: () => void;
}

export interface DataManagementReturn extends DataManagementState, DataManagementActions {
  setSelectedEntity: (entity: string) => void;
  setSearchTerm: (term: string) => void;
  setCurrentPage: (page: number) => void;
  setDialogOpen: (open: boolean) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setMessage: (message: { type: string; text: string }) => void;
  setActiveTab: (tab: string) => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  filteredData: any[];
  paginatedData: any[];
  totalPages: number;
  runAsAdmin: (callback: () => Promise<void>) => Promise<void>;
  user: any;
}

const ITEMS_PER_PAGE = 20;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDataManagement = (): DataManagementReturn => {
  // State
  const [selectedEntity, setSelectedEntityState] = useState<string>('asset_transactions');
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('management');
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Cache
  const dataCache = useRef<Map<string, CacheEntry>>(new Map());

  const { user } = useSecureAuth();
  const navigate = useNavigate();

  // Cache utilities
  const getCachedData = useCallback((key: string): CacheEntry | null => {
    const cached = dataCache.current.get(key);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any[], count: number) => {
    dataCache.current.set(key, {
      data,
      count,
      timestamp: Date.now()
    });
  }, []);

  const clearCache = useCallback(() => {
    dataCache.current.clear();
  }, []);

  const clearEntityCache = useCallback((entity: string) => {
    const keysToDelete = Array.from(dataCache.current.keys()).filter(key => 
      key.startsWith(entity)
    );
    keysToDelete.forEach(key => dataCache.current.delete(key));
  }, []);

  // Admin utilities
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
  }, [user]);

  // Data loading
  const loadData = useCallback(async (page: number = 1, search: string = '') => {
    if (!selectedEntity || !user || user.role !== 'admin') return;
    
    const cacheKey = `${selectedEntity}-${page}-${search}`;
    const cached = getCachedData(cacheKey);
    
    if (cached) {
      setData(cached.data);
      setTotalCount(cached.count);
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const config = entityConfig[selectedEntity];
      if (!config) {
        throw new Error(`Entity config not found for: ${selectedEntity}`);
      }

      const hasCreatedAt = config.fields.some(f => f.key === 'created_at');
      let query = supabase.from(config.entity as any).select('*', { count: 'exact' });
      
      if (search.trim()) {
        const textFields = config.fields.filter(f => 
          !f.type || f.type === 'text' || f.type === 'textarea'
        ).map(f => f.key);
        
        if (textFields.length > 0) {
          const searchConditions = textFields.map(field => 
            `${field}.ilike.%${search}%`
          ).join(',');
          query = query.or(searchConditions);
        }
      }
      
      if (hasCreatedAt) {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('id', { ascending: false });
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: result, error, count } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const pageData = result || [];
      const totalRecords = count || 0;

      setCachedData(cacheKey, pageData, totalRecords);
      setData(pageData);
      setTotalCount(totalRecords);
      
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
  }, [selectedEntity, user, getCachedData, setCachedData]);

  // CRUD operations
  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async (formData: any) => {
    if (!selectedEntity) return;
    setMessage({ type: '', text: '' });
    
    await runAsAdmin(async () => {
      try {
        const config = entityConfig[selectedEntity];
        
        for (const field of config.fields.filter(f => f.required)) {
          if (!formData[field.key]) {
            setMessage({ type: 'error', text: `Vui lòng điền ${field.label}` });
            return;
          }
        }
        
        const submitData: { [key: string]: any } = { ...formData };

        config.fields.filter(f => f.type === 'boolean').forEach(field => {
          if (submitData[field.key] !== undefined && submitData[field.key] !== null) {
            submitData[field.key] = submitData[field.key] === 'true';
          }
        });

        Object.keys(submitData).forEach(key => {
          if (key !== 'password' && (submitData[key] === '' || submitData[key] === null)) {
            delete submitData[key];
          }
        });

        if (selectedEntity === 'staff') {
          if (editingItem) {
            if (submitData.password === '') {
              delete submitData.password;
            }
          } else {
            if (!submitData.password) {
              submitData.password = '123456';
            }
          }
        }

        if (editingItem) {
          delete submitData.id;
          const { error } = await supabase
            .from(config.entity as any)
            .update(submitData)
            .eq('id', editingItem.id);
          
          if (error) throw error;
          setMessage({ type: 'success', text: "Cập nhật thành công" });
        } else {
          const { error } = await supabase
            .from(config.entity as any)
            .insert([submitData]);
          
          if (error) throw error;
          setMessage({ type: 'success', text: "Thêm mới thành công" });
        }
        
        setDialogOpen(false);
        clearCache();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể lưu dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, editingItem, runAsAdmin, currentPage, searchTerm, loadData, clearCache]);

  const handleDelete = useCallback(async (item: any) => {
    if (!selectedEntity) return;
    setMessage({ type: '', text: '' });
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi này khỏi bảng ${entityConfig[selectedEntity].name}?`)) {
      return;
    }
    
    await runAsAdmin(async () => {
      try {
        const config = entityConfig[selectedEntity];
        const { error } = await supabase
          .from(config.entity as any)
          .delete()
          .eq('id', item.id);
        
        if (error) throw error;
        setMessage({ type: 'success', text: "Xóa thành công" });
        
        clearCache();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, runAsAdmin, currentPage, searchTerm, loadData, clearCache]);

  const toggleStaffLock = useCallback(async (staff: any) => {
    setMessage({ type: '', text: '' });
    
    await runAsAdmin(async () => {
      try {
        const newStatus = staff.account_status === 'active' ? 'locked' : 'active';
        const { error } = await supabase
          .from('staff')
          .update({ 
            account_status: newStatus, 
            failed_login_attempts: 0, 
            locked_at: newStatus === 'locked' ? new Date().toISOString() : null 
          })
          .eq('id', staff.id);
        
        if (error) throw error;
        setMessage({ 
          type: 'success', 
          text: `Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản` 
        });
        
        clearCache();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể thay đổi trạng thái tài khoản: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [runAsAdmin, currentPage, searchTerm, loadData, clearCache]);

  // Export/Import
  const exportToCSV = useCallback(() => {
    if (data.length === 0) {
      setMessage({ type: 'error', text: "Không có dữ liệu để xuất." });
      return;
    }
    
    try {
      const config = entityConfig[selectedEntity];
      const csvContent = toCSV(data, config.fields);
      
      const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `${selectedEntity}_page_${currentPage}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setMessage({ type: 'success', text: "Xuất dữ liệu thành công." });
    } catch (error: any) {
      setMessage({ type: 'error', text: "Không thể xuất dữ liệu." });
    }
  }, [data, selectedEntity, currentPage]);

  const handleRestoreData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRestoreFile(event.target.files[0]);
      setMessage({ 
        type: 'info', 
        text: `Đã chọn tệp: ${event.target.files[0].name}. Nhấn Import lần nữa để bắt đầu.` 
      });
    }
  }, []);

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
        const zip = await JSZip.loadAsync(restoreFile);
        
        for (const key in entityConfig) {
          const config = entityConfig[key];
          const fileName = `${key}.csv`;
          const file = zip.file(fileName);
          
          if (file) {
            const content = await file.async("text");
            const dataToRestore = fromCSV(content, config.fields);
            
            const { error: deleteError } = await supabase
              .from(config.entity as any)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (deleteError) throw deleteError;

            if (dataToRestore.length > 0) {
              const { error: insertError } = await supabase
                .from(config.entity as any)
                .insert(dataToRestore);
              
              if (insertError) throw insertError;
            }
          }
        }
        
        setMessage({ type: 'success', text: "Import dữ liệu thành công." });
        clearCache();
        loadData(currentPage, searchTerm);
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
  }, [restoreFile, runAsAdmin, currentPage, searchTerm, loadData, clearCache]);
  
  const handleImportClick = useCallback(() => {
    if (restoreFile) {
      restoreAllData();
    } else {
      restoreInputRef.current?.click();
    }
  }, [restoreFile, restoreAllData]);

  // Bulk operations
  const bulkDeleteTransactions = useCallback(async () => {
    setMessage({ type: '', text: '' });
    
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: "Vui lòng chọn cả ngày bắt đầu và ngày kết thúc." });
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả giao dịch từ ${startDate} đến ${endDate}? Thao tác này không thể hoàn tác.`)) {
      return;
    }
    
    await runAsAdmin(async () => {
      try {
        const { error } = await supabase
          .from('asset_transactions')
          .delete()
          .gte('transaction_date', startDate)
          .lte('transaction_date', endDate);

        if (error) throw error;
        setMessage({ 
          type: 'success', 
          text: `Đã xóa thành công các giao dịch từ ${startDate} đến ${endDate}.` 
        });
        
        clearCache();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa giao dịch hàng loạt: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [startDate, endDate, runAsAdmin, currentPage, searchTerm, loadData, clearCache]);

  // Entity change handler
  const setSelectedEntity = useCallback((entity: string) => {
    clearEntityCache(selectedEntity);
    setSelectedEntityState(entity);
    setCurrentPage(1);
    setSearchTerm('');
    setData([]);
    setTotalCount(0);
  }, [selectedEntity, clearEntityCache]);

  // Computed values
  const filteredData = data;
  const paginatedData = data;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const refreshData = useCallback(() => {
    loadData(currentPage, searchTerm);
  }, [loadData, currentPage, searchTerm]);

  // Effects
  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'admin') {
      if (selectedEntity) {
        setCurrentPage(1);
        loadData(1, searchTerm);
      }
    } else if (user) {
      setData([]);
      setTotalCount(0);
      setMessage({ type: 'error', text: 'Chỉ admin mới có thể truy cập module này.' });
    }
  }, [user, selectedEntity, navigate, loadData, searchTerm]);

  useEffect(() => {
    if (user?.role === 'admin' && selectedEntity) {
      loadData(currentPage, searchTerm);
    }
  }, [currentPage, user, selectedEntity, loadData, searchTerm]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadData(1, searchTerm);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, currentPage, loadData]);

  return {
    // State
    selectedEntity,
    data,
    totalCount,
    isLoading,
    searchTerm,
    currentPage,
    dialogOpen,
    editingItem,
    startDate,
    endDate,
    message,
    restoreFile,
    activeTab,
    
    // Setters
    setSelectedEntity,
    setSearchTerm,
    setCurrentPage,
    setDialogOpen,
    setStartDate,
    setEndDate,
    setMessage,
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData,
    paginatedData,
    totalPages,
    
    // Actions
    runAsAdmin,
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleRestoreData,
    handleImportClick,
    bulkDeleteTransactions,
    refreshData,
    
    // User
    user
  };
};