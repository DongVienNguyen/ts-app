import { useState, useEffect } from 'react';
import { CheckCircle, Eye, Filter, List, Layers } from 'lucide-react';
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
import { getSeverityColor } from '@/utils/errorTracking'; // Import directly

interface ErrorListTabProps {
  recentErrors: SystemError[];
  isLoading: boolean;
  onRefresh: () => void;
  initialFilter?: { type: 'severity' | 'status'; value: string } | null; // New prop
  onFilterApplied?: () => void; // New prop
}

const ITEMS_PER_PAGE = 10;

export function ErrorListTab({ recentErrors, isLoading, onRefresh, initialFilter, onFilterApplied }: ErrorListTabProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ErrorFilters>({});
  const [selectedError, setSelectedError] = useState<SystemError | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  useEffect(() => {
    if (initialFilter) {
      setFilters(prevFilters => ({
        ...prevFilters,
        [initialFilter.type]: initialFilter.value,
      }));
      onFilterApplied?.(); // Notify parent that filter has been applied
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

  const filteredErrors = recentErrors.filter(error => {
    if (filters.severity && error.severity !== filters.severity) return false;
    if (filters.status && error.status !== filters.status) return false;
    if (filters.errorType && error.error_type !== filters.errorType) return false;
    
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

  return (
    <div className="space-y-4">
      <ErrorFiltersComponent
        onFiltersChange={setFilters}
        totalErrors={recentErrors.length}
        filteredErrors={filteredErrors.length}
        currentFilters={filters} // Pass current filters to allow ErrorFilters to reset/display them
      />

      {viewMode === 'list' && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md dark:bg-gray-800">
          <span className="text-sm font-medium">
            Đã chọn {selectedIds.length} / {filteredErrors.length} lỗi
          </span>
          <Button size="sm" onClick={handleBulkResolve}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Giải quyết mục đã chọn
          </Button>
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
              <Button variant="outline" size="sm" onClick={onRefresh}>Làm mới</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
          ) : viewMode === 'list' ? (
            filteredErrors.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center p-2 border-b">
                  <Checkbox id="select-all" checked={selectedIds.length > 0 && selectedIds.length === filteredErrors.length} onCheckedChange={(checked) => handleSelectAll(!!checked)} className="mr-4" />
                  <label htmlFor="select-all" className="text-sm font-medium">Chọn tất cả</label>
                </div>
                {paginatedData.map((error) => (
                  <div key={error.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
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
                <SmartPagination
                  currentPage={currentPage}
                  totalCount={filteredErrors.length}
                  pageSize={ITEMS_PER_PAGE}
                  onPageChange={goToPage}
                />
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
  );
}