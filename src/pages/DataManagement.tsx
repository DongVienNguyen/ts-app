import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Settings, Plus, Download, Upload, Trash2, Edit, Lock, AlertCircle, BarChart2, Database as DatabaseIcon, BellRing, Users, Shield, BookOpen, CheckCircle, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Layout from '@/components/Layout';
import { useSecureAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import DateInput from '@/components/DateInput';
import { toCSV, fromCSV } from '@/utils/csvUtils';
import PushNotificationTester from '@/components/PushNotificationTester';
import { entityConfig } from '@/config/entityConfig';
import { StatisticsTab } from '@/components/data-management/StatisticsTab';
import { EditDialog } from '@/components/data-management/EditDialog';
import { SecurityDashboard } from '@/components/SecurityDashboard';
import { SecurityTestPanel } from '@/components/SecurityTestPanel';
import { SecurityDocumentation } from '@/components/SecurityDocumentation';
import { SecurityImplementationSummary } from '@/components/SecurityImplementationSummary';
import { SecurityWorkflowDemo } from '@/components/SecurityWorkflowDemo';
import { AccountManagementTab } from '@/components/data-management/AccountManagementTab';
import { VAPIDKeyTester } from '@/components/VAPIDKeyTester';

const DataManagement = () => {
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
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const { user } = useSecureAuth();
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 20;

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

  const filteredData = useMemo(() => data.filter(item => Object.values(item).some(value => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase()))), [data, searchTerm]);
  const paginatedData = useMemo(() => { const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE); }, [filteredData, currentPage]);
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
        const { error } = await supabase.from('staff').update({ account_status: newStatus, failed_login_attempts: 0, locked_at: newStatus === 'locked' ? new Date().toISOString() : null }).eq('id', staff.id);
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

  if (!user) return <Layout><div>Đang kiểm tra quyền truy cập...</div></Layout>;
  if (user.role !== 'admin') return <Layout><div>Chỉ admin mới có thể truy cập module này.</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center space-x-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý dữ liệu</h1>
            <p className="text-gray-500">Quản lý tất cả dữ liệu trong hệ thống với tốc độ cao</p>
          </div>
        </div>

        {message.text && (
          <Alert variant={message.type === 'error' ? 'destructive' : (message.type === 'info' ? 'default' : 'default')} className={message.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="management" className="w-full">
          <TabsList className="border-b">
            <TabsTrigger value="management"><DatabaseIcon className="mr-2 h-4 w-4" />Quản lý dữ liệu</TabsTrigger>
            <TabsTrigger value="statistics"><BarChart2 className="mr-2 h-4 w-4" />Thống kê</TabsTrigger>
            <TabsTrigger value="security-dashboard"><Shield className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
            <TabsTrigger value="accounts"><Users className="mr-2 h-4 w-4" />Tài khoản</TabsTrigger>
            <TabsTrigger value="security-test"><Shield className="mr-2 h-4 w-4" />Test Bảo mật</TabsTrigger>
            <TabsTrigger value="security-docs"><BookOpen className="mr-2 h-4 w-4" />Tài liệu</TabsTrigger>
            <TabsTrigger value="security-summary"><CheckCircle className="mr-2 h-4 w-4" />Tổng kết</TabsTrigger>
            <TabsTrigger value="security-workflow"><ArrowRight className="mr-2 h-4 w-4" />Demo</TabsTrigger>
            <TabsTrigger value="push-notifications"><BellRing className="mr-2 h-4 w-4" />Thông báo đẩy</TabsTrigger>
          </TabsList>

          <TabsContent value="management" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chọn bảng dữ liệu</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Chọn bảng" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(entityConfig).map((key) => (
                      <SelectItem key={key} value={key}>
                        {entityConfig[key].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> New
                </Button>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                <input
                  type="file"
                  ref={restoreInputRef}
                  onChange={handleRestoreData}
                  accept=".zip"
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tìm kiếm trong bảng dữ liệu</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder={`Tìm kiếm trong ${entityConfig[selectedEntity]?.name}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </CardContent>
            </Card>

            {selectedEntity === 'asset_transactions' && (
              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle>Xóa hàng loạt (Admin)</CardTitle>
                  <p className="text-sm text-gray-600">Chọn khoảng thời gian để xóa tất cả các giao dịch trong khoảng đó. Hành động này không thể hoàn tác.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Ngày bắt đầu</Label>
                      <DateInput value={startDate} onChange={setStartDate} />
                    </div>
                    <div>
                      <Label htmlFor="endDate">Ngày kết thúc</Label>
                      <DateInput value={endDate} onChange={setEndDate} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={bulkDeleteTransactions} variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Xóa theo ngày
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>{entityConfig[selectedEntity]?.name} (Tổng: {filteredData.length} bản ghi)</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-2">Đang tải dữ liệu...</span>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {entityConfig[selectedEntity]?.fields.map((field) => (
                              <TableHead key={field.key}>{field.label}</TableHead>
                            ))}
                            <TableHead className="text-right">Thao tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedData.length > 0 ? (
                            paginatedData.map((item) => (
                              <TableRow key={item.id}>
                                {entityConfig[selectedEntity]?.fields.map((field) => (
                                  <TableCell key={field.key} className="py-2 px-4 whitespace-nowrap">
                                    {field.type === 'date' && item[field.key]
                                      ? new Date(item[field.key]).toLocaleDateString('vi-VN')
                                      : field.type === 'boolean' && item[field.key] !== undefined
                                        ? (item[field.key] ? 'Có' : 'Không')
                                        : (selectedEntity === 'staff' && field.key === 'password')
                                          ? '********'
                                          : item[field.key]?.toString()}
                                  </TableCell>
                                ))}
                                <TableCell className="text-right py-2 px-4">
                                  <div className="flex justify-end space-x-1">
                                    {selectedEntity === 'staff' && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleStaffLock(item)}
                                        title={item.account_status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                                      >
                                        <Lock className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Chỉnh sửa">
                                      <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item)} title="Xóa">
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={(entityConfig[selectedEntity]?.fields.length || 0) + 1} className="text-center py-8">
                                Không có dữ liệu
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <Button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      <span>
                        Trang {currentPage} / {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        Tiếp
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="statistics" className="mt-6 space-y-6">
            <StatisticsTab runAsAdmin={runAsAdmin} setMessage={setMessage} onLoad={() => {}} />
          </TabsContent>

          <TabsContent value="security-dashboard" className="mt-6 space-y-6">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="accounts" className="mt-6 space-y-6">
            <AccountManagementTab />
          </TabsContent>

          <TabsContent value="security-test" className="mt-6 space-y-6">
            <SecurityTestPanel />
          </TabsContent>

          <TabsContent value="security-docs" className="mt-6 space-y-6">
            <SecurityDocumentation />
          </TabsContent>

          <TabsContent value="security-summary" className="mt-6 space-y-6">
            <SecurityImplementationSummary />
          </TabsContent>

          <TabsContent value="security-workflow" className="mt-6 space-y-6">
            <SecurityWorkflowDemo />
          </TabsContent>

          <TabsContent value="push-notifications" className="mt-6 space-y-6">
            <VAPIDKeyTester />
            <PushNotificationTester />
          </TabsContent>

          <EditDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            config={entityConfig[selectedEntity]}
            editingItem={editingItem}
            onSave={handleSave}
          />
        </Tabs>
      </div>
    </Layout>
  );
};

export default DataManagement;