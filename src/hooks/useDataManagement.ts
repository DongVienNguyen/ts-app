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
    if (!selectedEntity) return;
    setIsLoading(true);
    await runAsAdmin(async () => {
      try {
        const config = entityConfig[selectedEntity];
        const hasCreatedAt = config.fields.some(f => f.key === 'created_at');
        
        let query = supabase.from(config.entity as any).select('*');
        
        if (hasCreatedAt) {
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('id', { ascending: false });
        }

        const { data: result, error } = await query;

        if (error) throw error;
        setData(result || []);
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể tải dữ liệu: ${error.message || 'Lỗi không xác định'}` });
        setData([]);
      }
    });
    setIsLoading(false);
  }, [selectedEntity, runAsAdmin]);

  useEffect(() => {
    if (user) {
      loadData();
    } else if (user === null) {
      navigate('/login');
    }
  }, [user, selectedEntity, navigate, loadData]);

  const filteredData = useMemo(() => 
    data.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ), [data, searchTerm]
  );

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleAdd = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSave = async (formData: any) => {
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
          const { error } = await supabase.from(config.entity as any).update(submitData).eq('id', editingItem.id);
          if (error) throw error;
          setMessage({ type: 'success', text: "Cập nhật thành công" });
        } else {
          const { error } = await supabase.from(config.entity as any).insert([submitData]);
          if (error) throw error;
          setMessage({ type: 'success', text: "Thêm mới thành công" });
        }
        setDialogOpen(false);
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể lưu dữ liệu: ${error.message || 'Lỗi không xác định'}` });
      }
    });
  };

  const handleDelete = async (item: any) => {
    if (!selectedEntity) return;
    setMessage({ type: '', text: '' });
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi này khỏi bảng ${entityConfig[selectedEntity].name}?`)) {
      return;
    }
    await runAsAdmin(async () => {
      try {
        const config = entityConfig[selectedEntity];
        const { error } = await supabase.from(config.entity as any).delete().eq('id', item.id);
        if (error) throw error;
        setMessage({ type: 'success', text: "Xóa thành công" });
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể xóa dữ liệu: ${error.message || 'Lỗi không xác định'}` });
      }
    });
  };

  const toggleStaffLock = async (staff: any) => {
    setMessage({ type: '', text: '' });
    await runAsAdmin(async () => {
      try {
        const newStatus = staff.account_status === 'active' ? 'locked' : 'active';
        const { error } = await supabase.from('staff').update({ 
          account_status: newStatus, 
          failed_login_attempts: 0, 
          locked_at: newStatus === 'locked' ? new Date().toISOString() : null 
        }).eq('id', staff.id);
        if (error) throw error;
        setMessage({ type: 'success', text: `Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} tài khoản` });
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể thay đổi trạng thái tài khoản: ${error.message || 'Lỗi không xác định'}` });
      }
    });
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      setMessage({ type: 'error', text: "Không có dữ liệu để xuất." });
      return;
    }
    const config = entityConfig[selectedEntity];
    const csvContent = toCSV(filteredData, config.fields);
    
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${selectedEntity}_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ type: 'success', text: "Xuất dữ liệu thành công." });
  };

  const handleRestoreData = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setRestoreFile(event.target.files[0]);
      setMessage({ type: 'info', text: `Đã chọn tệp: ${event.target.files[0].name}. Nhấn Import lần nữa để bắt đầu.` });
    }
  };

  const restoreAllData = async () => {
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
            
            const { error: deleteError } = await supabase.from(config.entity as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError) throw deleteError;

            if (dataToRestore.length > 0) {
              const { error: insertError } = await supabase.from(config.entity as any).insert(dataToRestore);
              if (insertError) throw insertError;
            }
          }
        }
        setMessage({ type: 'success', text: "Import dữ liệu thành công." });
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể import dữ liệu: ${error.message || 'Lỗi không xác định'}` });
      } finally {
        setRestoreFile(null);
        if(restoreInputRef.current) restoreInputRef.current.value = '';
      }
    });
  };
  
  const handleImportClick = () => {
    if (restoreFile) {
      restoreAllData();
    } else {
      restoreInputRef.current?.click();
    }
  };

  const bulkDeleteTransactions = async () => {
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
        setMessage({ type: 'success', text: `Đã xóa thành công các giao dịch từ ${startDate} đến ${endDate}.` });
        loadData();
      } catch (error: any) {
        setMessage({ type: 'error', text: `Không thể xóa giao dịch hàng loạt: ${error.message || 'Lỗi không xác định'}` });
      }
    });
  };

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