import React, { useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OptimisedTable from '@/components/OptimizedTable';
import DateInput from '@/components/DateInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { EntityConfig, entityConfig } from '@/config/entityConfig';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';

interface DataManagementTabProps {
  activeTab: string;
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  data: any[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onExportCSV: () => void;
  onImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  onFileSelectForImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startImportProcess: (file: File) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBulkDeleteTransactions: () => void;
  onToggleStaffLock: (staff: any) => void;
  onSort: (columnKey: string) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  config: EntityConfig;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  editingItem: any;
  handleSave: (formData: any) => void;
}

const DataManagementTab: React.FC<DataManagementTabProps> = ({
  activeTab,
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  data,
  totalCount = 0, // Added default value here
  currentPage,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onExportCSV,
  onImportClick,
  restoreInputRef,
  onFileSelectForImport,
  startImportProcess,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onBulkDeleteTransactions,
  onToggleStaffLock,
  onSort,
  sortColumn,
  sortDirection,
  filters,
  onFilterChange,
  config,
  dialogOpen,
  setDialogOpen,
  editingItem,
  handleSave,
}) => {

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Không tìm thấy cấu hình cho thực thể đã chọn.
        </AlertDescription>
      </Alert>
    );
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelectForImport(event);
    const file = event.target.files?.[0];
    if (file) {
      startImportProcess(file);
    }
  };

  const columnsWithActions = [
    ...config.fields,
    {
      key: 'actions',
      label: 'Hành động',
      render: (_: any, item: any) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(item)}>Sửa</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(item)}>Xóa</Button>
          {selectedEntity === 'staff' && (
            <Button
              variant={item.account_status === 'locked' ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => onToggleStaffLock(item)}
            >
              {item.account_status === 'locked' ? 'Mở khóa' : 'Khóa'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý dữ liệu</CardTitle>
        <CardDescription>Xem và quản lý dữ liệu cho các thực thể khác nhau.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow w-full md:w-auto">
            <Label htmlFor="entity-select">Chọn thực thể</Label>
            <Select value={selectedEntity} onValueChange={onEntityChange}>
              <SelectTrigger id="entity-select" className="w-full">
                <SelectValue placeholder="Chọn một thực thể" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(entityConfig).map((key) => (
                  <SelectItem key={key} value={key}>
                    {entityConfig[key].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-grow w-full md:w-auto">
            <Label htmlFor="search-input">Tìm kiếm</Label>
            <Input
              id="search-input"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0 mt-auto">
            <Button onClick={onAdd}>Thêm mới</Button>
          </div>
        </div>

        {/* Dynamic Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.fields.filter(f => f.filterable).map(field => (
            <div key={field.key}>
              <Label htmlFor={`filter-${field.key}`}>{field.label}</Label>
              {field.type === 'select' && field.options ? (
                <Select
                  value={filters[field.key] || ''}
                  onValueChange={(value) => onFilterChange(field.key, value === '' ? undefined : value)}
                >
                  <SelectTrigger id={`filter-${field.key}`}>
                    <SelectValue placeholder={`Lọc theo ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    {field.options.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'date' ? (
                <DateInput
                  value={filters[field.key] || ''}
                  onChange={(date) => onFilterChange(field.key, date)}
                  placeholder={`Lọc theo ${field.label}`}
                />
              ) : (
                <Input
                  id={`filter-${field.key}`}
                  placeholder={`Lọc theo ${field.label}`}
                  value={filters[field.key] || ''}
                  onChange={(e) => onFilterChange(field.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <span className="ml-4 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <OptimisedTable
            data={data}
            columns={columnsWithActions}
            onSort={onSort}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (currentPage > 1) {
                      onPageChange(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => onPageChange(index + 1)}
                    isActive={currentPage === index + 1}
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (currentPage < totalPages) {
                      onPageChange(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        <div className="flex flex-wrap gap-4 justify-end">
          <Button onClick={onExportCSV}>Xuất CSV</Button>
          <Button onClick={onImportClick}>Nhập dữ liệu</Button>
          <Input
            type="file"
            ref={restoreInputRef}
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
            accept=".zip"
          />
        </div>

        {selectedEntity === 'asset_transactions' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Xóa giao dịch hàng loạt</CardTitle>
              <CardDescription>Xóa tất cả giao dịch trong một khoảng thời gian nhất định.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-grow">
                <Label htmlFor="start-date">Ngày bắt đầu</Label>
                <DateInput
                  id="start-date"
                  value={startDate}
                  onChange={onStartDateChange}
                  placeholder="Chọn ngày bắt đầu"
                />
              </div>
              <div className="flex-grow">
                <Label htmlFor="end-date">Ngày kết thúc</Label>
                <DateInput
                  id="end-date"
                  value={endDate}
                  onChange={onEndDateChange}
                  placeholder="Chọn ngày kết thúc"
                />
              </div>
              <Button onClick={onBulkDeleteTransactions} variant="destructive" className="flex-shrink-0">
                Xóa hàng loạt
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Chỉnh sửa' : 'Thêm mới'} {config.name}</DialogTitle>
              <DialogDescription>
                {editingItem ? 'Chỉnh sửa thông tin' : 'Thêm một bản ghi mới'} cho {config.name}.
              </DialogDescription>
            </DialogHeader>
            {/* Form content will go here, dynamically rendered based on config.fields */}
            {/* For now, a placeholder */}
            <div className="py-4">
              <p>Form chỉnh sửa/thêm mới sẽ được hiển thị tại đây.</p>
              <Button onClick={() => handleSave({})}>Lưu (Placeholder)</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DataManagementTab;