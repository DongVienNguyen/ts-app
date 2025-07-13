import { useState, useEffect } from 'react';
import { CheckCircle, Eye, Filter, List, Layers, Download, Trash2 } from 'lucide-react'; // Import Trash2 icon
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SystemError } from '@/utils/errorTracking';
import { ErrorFilters, ErrorFilters as ErrorFiltersComponent } from './ErrorFilters';
import { ErrorDetailsModal } from './ErrorDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { startOfDay, endOfDay } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { SmartPagination } from '@/components/SmartPagination';
import { getSeverityColor } from '@/utils/errorTracking';
import { convertToCSV, downloadCSV } from '@/utils/csvUtils';
import clsx from 'clsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ErrorListTabProps {
  recentErrors: SystemError[];
  isLoading: boolean;
  onRefresh: () => void;
  initialFilter?: { type: 'severity' | 'status'; value: string } | null;
  onFilterApplied?: () => void;
  isPaginated?: boolean; // Added isPaginated prop
}

const ITEMS_PER_PAGE = 10;

export function ErrorListTab({ recentErrors, isLoading, onRefresh, initialFilter, onFilterApplied, isPaginated = true }: ErrorListTabProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ErrorFilters>({});
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialFilter) {
      setFilters(prevFilters => ({
        ...prevFilters,
        [initialFilter.type]: initialFilter.value,
      }));
      onFilterApplied?.();
    }
  }, [initialFilter, onFilterApplied]);

  const handleUpdateErrorStatus = async (errorId: string, status: string) => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    
    const updateData: Partial<SystemError> = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
      updateData.resolved_by = user.username;
    } else {
      updateData.resolved_at = null;
      updateData.resolved_by = null;
    }

    const { error } = await supabase
      .from('system_errors')
      .update(updateData)
      .eq('id', errorId);

    if (error) {
      toast.error(`Cập nhật trạng thái lỗi thất bại.`);
    } else {
      toast.success(`Lỗi đã được đánh dấu là ${status}.`);
      onRefresh();
    }
  };

  const handleBulkResolve = async () => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    if (selectedIds.length === 0) return;

    const { error } = await supabase
      .from('system_errors')
      .update({ 
        status: 'resolved', 
        resolved_at: new Date().toISOString(),
        resolved_by: user.username,
      })
      .in('id', selectedIds);

    if (error) {
      toast.error(`Giải quyết ${selectedIds.length} lỗi thất bại.`);
    } else {
      toast.success(`${selectedIds.length} lỗi đã được đánh dấu là đã giải quyết.`);
      setSelectedIds([]);
      onRefresh();
    }
  };

  const handleBulkDelete = async () => {
    if (!user) {
      toast.error('Bạn phải đăng nhập để thực hiện hành động này.');
      return;
    }
    if (selectedIds.length === 0) return;

    const { error } = await supabase
      .from('system_errors')
      .delete()
      .in('id', selectedIds);

    if (error) {
      toast.error(`Xóa ${selectedIds.length} lỗi thất bại.`);
    } else {
      toast.success(`${selectedIds.length} lỗi đã được xóa thành công.`);
      setSelectedIds([]);
      onRefresh();
    }
    setShowBulkDeleteConfirm(false);
  };

  const filteredErrors = recentErrors.filter(error => {
    if (filters.severity && error.severity !== filters.severity) return false;
    if (filters.status && error.status !== filters.status) return false;
    if (filters.errorType && error.error_type !== filters.errorType) return false;
    if (filters.assignedTo) {
      if (filters.assignedTo === 'unassigned') {
        if (error.assigned_to) return false;
      } else if (error.assigned_to !== filters.assignedTo) {
        return false;
      }
    }
    
    if (filters.dateRange?.from) {
      const errorDate = new Date(error.created_at!);
      const fromDate = startOfDay(filters.dateRange.from);
      if (errorDate < fromDate) return false;
    }
    if (filters.dateRange?.to) {
      const errorDate = new Date(error.created_at!);
      const toDate = endOfDay(filters.dateRange.to);
      if (errorDate > toDate) return false;
    }
    
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        error.error_message.toLowerCase().includes(searchLower) ||
        error.error_type.toLowerCase().includes(searchLower) ||
        (error.function_name && error.function_name.toLowerCase().includes(searchLower)) ||
        (error.user_id && error.user_id.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const {
    paginatedData,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    canNextPage,
    canPrevPage,
  } = usePagination({ data: filteredErrors, itemsPerPage: ITEMS_PER_PAGE });

  const groupErrors = (errors: SystemError[]) => {
    const groups: { [key: string]: { count: number; latestError: SystemError } } = {};
    for (const error of errors) {
      const key = `${error.error_type}|${error.error_message}`;
      if (!groups[key]) {
        groups[key] = { count: 0, latestError: error };
      }
      groups[key].count++;
      if (new Date(error.created_at!) > new Date(groups[key].latestError.created_at!)) {
        groups[key].latestError = error;
      }
    }
    return Object.values(groups).sort((a, b) => b.count - a.count);
  };

  const groupedErrors = viewMode === 'grouped' ? groupErrors(filteredErrors) : [];

  const handleViewDetails = (error: SystemError) => {
    setSelectedError(error);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedError(null);
    setIsModalOpen(false);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(sid => sid !== id));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredErrors.map(e => e.id!) : []);
  };

  const getStatusBadgeVariant = (status: string | undefined) => {
    switch (status) {
      case 'new': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'archived': return 'outline';
      default: return 'outline';
    }
  };

  const handleExportCSV = () => {
    if (filteredErrors.length === 0) {
      toast.info('Không có dữ liệu lỗi để xuất.');
      return;
    }

    const headers = [
      'ID', 'Loại lỗi', 'Mức độ nghiêm trọng', 'Thông báo lỗi', 'Tên hàm', 'ID người dùng',
      'URL yêu cầu', 'Tác nhân người dùng', 'Địa chỉ IP', 'Trạng thái', 'Thời gian tạo',
      'Thời gian giải quyết', 'Người giải quyết', 'Ghi chú giải quyết'
    ];

    const data = filteredErrors.map(error => ({
      ID: error.id,
      'Loại lỗi': error.error_type,
      'Mức độ nghiêm trọng': error.severity,
      'Thông báo lỗi': error.error_message,
      'Tên hàm': error.function_name,
      'ID người dùng': error.user_id,
      'URL yêu cầu': error.request_url,
      'Tác nhân người dùng': error.user_agent,
      'Địa chỉ IP': error.ip_address,
      'Trạng thái': error.status,
      'Thời gian tạo': error.created_at ? new Date(error.created_at).toLocaleString('vi-VN') : '',
      'Thời gian giải quyết': error.resolved_at ? new Date(error.resolved_at).toLocaleString('vi-VN') : '',
      'Người giải quyết': error.resolved_by,
      'Ghi chú giải quyết': error.resolution_notes,
    }));

    const csv = convertToCSV(data, headers);
    downloadCSV(csv, 'error_log');
    toast.success('Dữ liệu lỗi đã được xuất thành công!');
  };

  const errorsToDisplay = isPaginated ? paginatedData : filteredErrors;

  return (
    <>
      <div className="space-y-4">
        <ErrorFiltersComponent
          onFiltersChange={setFilters}
          totalErrors={recentErrors.length}
          filteredErrors={filteredErrors.length}
          currentFilters={filters}
        />

        {viewMode === 'list' && selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md dark:bg-gray-800">
            <span className="text-sm font-medium">
              Đã chọn {selectedIds.length} / {filteredErrors.length} lỗi
            </span>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleBulkResolve}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Giải quyết
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Danh sách Lỗi</CardTitle>
              <div className="flex items-center space-x-2">
                <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as any)}>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grouped" aria-label="Grouped view">
                    <Layers className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Xuất CSV
                </Button>
                <Button variant="outline" size="sm" onClick={onRefresh}>Làm mới</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : viewMode === 'list' ? (
              errorsToDisplay.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center p-2 border-b">
                    <Checkbox id="select-all" checked={selectedIds.length > 0 && selectedIds.length === filteredErrors.length} onCheckedChange={(checked) => handleSelectAll(!!checked)} className="mr-4" />
                    <label htmlFor="select-all" className="text-sm font-medium">Chọn tất cả</label>
                  </div>
                  {errorsToDisplay.map((error) => (
                    <div key={error.id} className={clsx(
                      "border rounded-lg p-4 hover:bg-gray-50 transition-colors",
                      { 'new-item-highlight': error.isNew }
                    )}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1"><Checkbox id={`select-${error.id}`} checked={selectedIds.includes(error.id!)} onCheckedChange={(checked) => handleSelect(error.id!, !!checked)} className="mr-4 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2"><Badge className={getSeverityColor(error.severity)}>{error.severity?.toUpperCase() || 'UNKNOWN'}</Badge><Badge variant="outline">{error.error_type}</Badge><span className="text-sm text-gray-500">{new Date(error.created_at!).toLocaleString('vi-VN')}</span></div>
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">{error.error_message}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">{error.function_name && (<span>Chức năng: {error.function_name}</span>)}{error.user_id && (<span>Người dùng: {error.user_id}</span>)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant={getStatusBadgeVariant(error.status)}>
                            {error.status?.toUpperCase() || 'UNKNOWN'}
                          </Badge>
                          {error.status !== 'resolved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateErrorStatus(error.id!, 'resolved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Giải quyết
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(error)}><Eye className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isPaginated && (
                    <SmartPagination
                      currentPage={currentPage}
                      totalCount={filteredErrors.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={goToPage}
                    />
                  )}
                </div>
              ) : ( 
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy lỗi nào phù hợp với bộ lọc.</p>
                </div> 
              )
            ) : ( // Grouped View
              groupedErrors.length > 0 ? (
                <div className="space-y-3">
                  {groupedErrors.map(({ count, latestError }) => (
                    <div key={latestError.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2"><Badge variant="secondary">{count} lần</Badge><Badge className={getSeverityColor(latestError.severity)}>{latestError.severity?.toUpperCase() || 'UNKNOWN'}</Badge><Badge variant="outline">{latestError.error_type}</Badge></div>
                          <h4 className="font-medium text-gray-900 mb-1">{latestError.error_message}</h4>
                          <span className="text-sm text-gray-500">Lần cuối lúc: {new Date(latestError.created_at!).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4"><Button variant="ghost" size="sm" onClick={() => handleViewDetails(latestError)}><Eye className="w-4 h-4 mr-1" />Xem chi tiết</Button></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : ( 
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Không tìm thấy lỗi nào phù hợp với bộ lọc.</p>
                </div> 
              )
            )}
          </CardContent>
        </Card>

        <ErrorDetailsModal error={selectedError} isOpen={isModalOpen} onClose={handleCloseModal} onErrorUpdated={onRefresh} />
      </div>

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa {selectedIds.length} lỗi đã chọn?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Các lỗi này sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}