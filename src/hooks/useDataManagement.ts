import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { entityConfig } from '@/config/entityConfig';
import { toCSV, fromCSV } from '@/utils/csvUtils';
import { useSecureAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 20;

export const useDataManagement = () => {
  const [selectedEntity, setSelectedEntity] = useState<string>('asset_transactions');
  const [data, setData] = useState<any[]>([]);
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

  const loadData = useCallback(async () => {
    if (!selectedEntity || !user || user.role !== 'admin') return;
    
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log('📊 Loading data for entity:', selectedEntity);
      
      const config = entityConfig[selectedEntity];
      if (!config) {
        throw new Error(`Entity config not found for: ${selectedEntity}`);
      }

      const hasCreatedAt = config.fields.some(f => f.key === 'created_at');
      
      let query = supabase.from(config.entity as any).select('*');
      
      // Add ordering
      if (hasCreatedAt) {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('id', { ascending: false });
      }

      // Limit results to prevent performance issues
      query = query.limit(1000);

      const { data: result, error } = await query;

      if (error) {
        console.error('❌ Database query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      setData(result || []);
      console.log(`✅ Data loaded successfully: ${result?.length || 0} records`);
      
    } catch (error: any) {
      console.error('❌ Failed to load data:', error);
      setMessage({ 
        type: 'error', 
        text: `Không thể tải dữ liệu: ${error.message || 'Lỗi không xác định'}` 
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEntity, user]);

  // Load data when entity changes or user changes
  useEffect(() => {
    if (user === null) {
      // User is not logged in
      navigate('/login');
      return;
    }
    
    if (user && user.role === 'admin') {
      // User is admin, load data
      loadData();
    } else if (user) {
      // User is logged in but not admin
      setData([]);
      setMessage({ type: 'error', text: 'Chỉ admin mới có thể truy cập module này.' });
    }
    // If user is undefined, we're still loading auth state
  }, [user, selectedEntity, navigate, loadData]);

  // Reset page when search term or entity changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEntity]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    
    return data.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

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
        loadData();
      } catch (error: any) {
        console.error('❌ Save operation failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể lưu dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, editingItem, runAsAdmin, loadData]);

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
        loadData();
      } catch (error: any) {
        console.error('❌ Delete operation failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa dữ liệu: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [selectedEntity, runAsAdmin, loadData]);

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
        loadData();
      } catch (error: any) {
        console.error('❌ Toggle staff lock failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể thay đổi trạng thái tài khoản: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [runAsAdmin, loadData]);

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
      link.setAttribute('download', `${selectedEntity}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      setMessage({ type: 'success', text: "Xuất dữ liệu thành công." });
    } catch (error: any) {
      console.error('❌ Export failed:', error);
      setMessage({ type: 'error', text: "Không thể xuất dữ liệu." });
    }
  }, [filteredData, selectedEntity]);

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
        loadData();
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
  }, [restoreFile, runAsAdmin, loadData]);
  
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
        loadData();
      } catch (error: any) {
        console.error('❌ Bulk delete failed:', error);
        setMessage({ 
          type: 'error', 
          text: `Không thể xóa giao dịch hàng loạt: ${error.message || 'Lỗi không xác định'}` 
        });
      }
    });
  }, [startDate, endDate, runAsAdmin, loadData]);

  return {
    // State
    selectedEntity,
    setSelectedEntity,
    data,
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