import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV, fromCSV } from '@/utils/csvUtils';
import { useSecureAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 20; // Giảm từ 50 xuống 20

export const useDataManagement = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('asset_transactions');
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

  // Cache để tránh load lại dữ liệu đã load
  const dataCache = useRef<Map<string, { data: any[], count: number, timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

  const { user } = useSecureAuth();
  const navigate = useNavigate();

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

  // Load dữ liệu với phân trang và cache
  const loadData = useCallback(async (page: number = 1, search: string = '') => {
    if (!selectedEntity || !user || user.role !== 'admin') return;
    
    // Tạo cache key
    const cacheKey = `${selectedEntity}-${page}-${search}`;
    const cached = dataCache.current.get(cacheKey);
    
    // Kiểm tra cache
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setData(cached.data);
      setTotalCount(cached.count);
      return;
    }
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log(`📊 Loading ${selectedEntity} - Page ${page}, Search: "${search}"`);
      
      const config = entityConfig[selectedEntity];
      if (!config) {
        throw new Error(`Entity config not found for: ${selectedEntity}`);
      }

      const hasCreatedAt = config.fields.some(f => f.key === 'created_at');
      
      // Tạo query với phân trang
      let query = supabase.from(config.entity as any).select('*', { count: 'exact' });
      
      // Thêm tìm kiếm nếu có
      if (search.trim()) {
        // Tìm kiếm trong các trường text - fix type check by checking field.type exists and is searchable
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
      
      // Thêm sắp xếp
      if (hasCreatedAt) {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('id', { ascending: false });
      }

      // Thêm phân trang
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data: result, error, count } = await query;

      if (error) {
        console.error('❌ Database query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      const pageData = result || [];
      const totalCount = count || 0;

      // Lưu vào cache
      dataCache.current.set(cacheKey, {
        data: pageData,
        count: totalCount,
        timestamp: Date.now()
      });

      setData(pageData);
      setTotalCount(totalCount);
      
      console.log(`✅ Data loaded: ${pageData.length}/${totalCount} records`);
      
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setMessage({ 
        type: 'error', 
        text: `Không thể tải dữ liệu: ${error.message || 'Lỗi không xác định'}` 
      });
      setData([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, user]);

  // Load data khi entity hoặc page thay đổi
  useEffect(() => {
    if (user === null) {
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'admin') {
      // Clear cache khi đổi entity
      if (selectedEntity) {
        setCurrentPage(1);
        loadData(1, searchTerm);
      }
    } else if (user) {
      setData([]);
      setTotalCount(0);
      setMessage({ type: 'error', text: 'Chỉ admin mới có thể truy cập module này.' });
    }
  }, [user, selectedEntity, navigate]);

  // Load data khi page hoặc search thay đổi
  useEffect(() => {
    if (user?.role === 'admin' && selectedEntity) {
      loadData(currentPage, searchTerm);
    }
  }, [currentPage, searchTerm, loadData]);

  // Debounce search
  const debouncedSearch = useMemo(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadData(1, searchTerm);
      } else {
        setCurrentPage(1); // Reset về trang 1 khi search
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Clear cache khi entity thay đổi
  const handleEntityChange = useCallback((entity: string) => {
    // Clear cache cho entity cũ
    const oldKeys = Array.from(dataCache.current.keys()).filter(key => 
      key.startsWith(selectedEntity)
    );
    oldKeys.forEach(key => dataCache.current.delete(key));
    
    setSelectedEntity(entity);
    setCurrentPage(1);
    setSearchTerm('');
    setData([]);
    setTotalCount(0);
  }, [selectedEntity]);

  const filteredData = data; // Data đã được filter ở server
  const paginatedData = data; // Data đã được paginate ở server
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
        
        // Validate required fields
        for (const field of config.fields.filter(f => f.required)) {
          if (!formData[field.key]) {
            setMessage({ type: 'error', text: `Vui lòng điền ${field.label}` });
            return;
          }
        }
        
        const submitData: { [key: string]: any } = { ...formData };

        // Handle boolean fields
        config.fields.filter(f => f.type === 'boolean').forEach(field => {
          if (submitData[field.key] !== undefined && submitData[field.key] !== null) {
            submitData[field.key] = submitData[field.key] === 'true';
          }
        });

        // Clean empty values
        Object.keys(submitData).forEach(key => {
          if (key !== 'password' && (submitData[key] === '' || submitData[key] === null)) {
            delete submitData[key];
          }
        });

        // Handle staff password
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
        
        // Clear cache và reload data
        dataCache.current.clear();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        console.error('❌ Save operation failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể lưu dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, editingItem, runAsAdmin, currentPage, searchTerm, loadData]);

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
        
        // Clear cache và reload data
        dataCache.current.clear();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        console.error('❌ Delete operation failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, runAsAdmin, currentPage, searchTerm, loadData]);

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
        
        // Clear cache và reload data
        dataCache.current.clear();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        console.error('❌ Toggle staff lock failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể thay đổi trạng thái tài khoản: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [runAsAdmin, currentPage, searchTerm, loadData]);

  const exportToCSV = useCallback(() => {
    if (filteredData.length === 0) {
      setMessage({ type: 'error', text: "Không có dữ liệu để xuất." });
      return;
    }
    
    try {
      const config = entityConfig[selectedEntity];
      const csvContent = toCSV(filteredData, config.fields);
      
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
      console.error('❌ Export failed:', error);
      setMessage({ type: 'error', text: "Không thể xuất dữ liệu." });
    }
  }, [filteredData, selectedEntity, currentPage]);

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
            
            // Delete existing data
            const { error: deleteError } = await supabase
              .from(config.entity as any)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000');
            
            if (deleteError) throw deleteError;

            // Insert new data
            if (dataToRestore.length > 0) {
              const { error: insertError } = await supabase
                .from(config.entity as any)
                .insert(dataToRestore);
              
              if (insertError) throw insertError;
            }
          }
        }
        
        setMessage({ type: 'success', text: "Import dữ liệu thành công." });
        
        // Clear cache và reload data
        dataCache.current.clear();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        console.error('❌ Import failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể import dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      } finally {
        setRestoreFile(null);
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    });
  }, [restoreFile, runAsAdmin, currentPage, searchTerm, loadData]);
  
  const handleImportClick = useCallback(() => {
    if (restoreFile) {
      restoreAllData();
    } else {
      restoreInputRef.current?.click();
    }
  }, [restoreFile, restoreAllData]);

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
        
        // Clear cache và reload data
        dataCache.current.clear();
        loadData(currentPage, searchTerm);
      } catch (error: any) {
        console.error('❌ Bulk delete failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa giao dịch hàng loạt: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [startDate, endDate, runAsAdmin, currentPage, searchTerm, loadData]);

  // Fix loadData function signature for button click
  const refreshData = useCallback(() => {
    loadData(currentPage, searchTerm);
  }, [loadData, currentPage, searchTerm]);

  return {
    // State
    selectedEntity,
    setSelectedEntity: handleEntityChange,
    data,
    totalCount,
    isLoading,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    dialogOpen,
    setDialogOpen,
    editingItem,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    message,
    setMessage,
    activeTab,
    setActiveTab,
    restoreInputRef,
    
    // Computed values
    filteredData,
    paginatedData,
    totalPages,
    
    // Functions
    runAsAdmin,
    loadData,
    refreshData, // Add this for button clicks
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    toggleStaffLock,
    exportToCSV,
    handleRestoreData,
    handleImportClick,
    bulkDeleteTransactions,
    
    // User
    user
  };
};