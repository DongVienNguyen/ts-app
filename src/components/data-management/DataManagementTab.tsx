import React from 'react';
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
import OptimisedTable from '@/components/OptimizedTable';
import DateInput from '@/components/DateInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { EntityConfig, entityConfig } from '@/config/entityConfig';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from '@/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FilterOperator, FilterState } from '@/hooks/useDataManagement/types';

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
  filters: Record<string, FilterState>; // Updated type
  onFilterChange: (key: string, value: any, operator?: FilterOperator) => void; // Updated signature
  clearFilters: () => void;
  config: EntityConfig;
  selectedRows: Record<string, boolean>;
  onRowSelect: (rowId: string) => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  onExportSelectedCSV: () => void;
}

const DataManagementTab: React.FC<DataManagementTabProps> = ({
  activeTab,
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  data,
  totalCount = 0,
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
  clearFilters,
  config,
  selectedRows,
  onRowSelect,
  onSelectAll,
  onBulkDelete,
  onExportSelectedCSV,
}) => {
  const selectedCount = Object.keys(selectedRows).length;

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
      width: 180,
      render: (_: any, item: any) => (
        <div className="flex gap-2 justify-start">
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
          <div className="flex-shrink-0 mt-auto flex items-center gap-2">
            {selectedCount > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Hành động ({selectedCount})
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onExportSelectedCSV}>
                    Xuất các mục đã chọn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onBulkDelete} className="text-red-600 focus:text-white focus:bg-red-600">
                    Xóa các mục đã chọn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
                  value={filters[field.key]?.value || ''}
                  onValueChange={(value) => onFilterChange(field.key, value === '' ? undefined : value, 'eq')}
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
                  value={filters[field.key]?.value || ''}
                  onChange={(date) => onFilterChange(field.key, date, 'eq')}
                  placeholder={`Lọc theo ${field.label}`}
                />
              ) : field.type === 'boolean' ? (
                <Select
                  value={filters[field.key]?.value === true ? 'true' : filters[field.key]?.value === false ? 'false' : ''}
                  onValueChange={(value) => onFilterChange(field.key, value === 'true' ? true : value === 'false' ? false : undefined, 'is')}
                >
                  <SelectTrigger id={`filter-${field.key}`}>
                    <SelectValue placeholder={`Lọc theo ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tất cả</SelectItem>
                    <SelectItem value="true">Có</SelectItem>
                    <SelectItem value="false">Không</SelectItem>
                  </SelectContent>
                </Select>
              ) : ( // For text, number, email types
                <div className="flex space-x-2">
                  <Select
                    value={filters[field.key]?.operator || (field.type === 'text' || field.type === 'email' ? 'ilike' : 'eq')}
                    onValueChange={(op) => onFilterChange(field.key, filters[field.key]?.value || '', op as FilterOperator)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.type === 'text' || field.type === 'email') && (
                        <>
                          <SelectItem value="ilike">Chứa</SelectItem>
                          <SelectItem value="eq">Chính xác</SelectItem>
                        </>
                      )}
                      {field.type === 'number' && (
                        <>
                          <SelectItem value="eq">Bằng</SelectItem>
                          <SelectItem value="gt">Lớn hơn</SelectItem>
                          <SelectItem value="lt">Nhỏ hơn</SelectItem>
                          <SelectItem value="gte">Lớn hơn hoặc bằng</SelectItem>
                          <SelectItem value="lte">Nhỏ hơn hoặc bằng</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    id={`filter-${field.key}`}
                    placeholder={`Lọc theo ${field.label}`}
                    value={filters[field.key]?.value || ''}
                    onChange={(e) => onFilterChange(field.key, e.target.value, filters[field.key]?.operator)}
                    className="flex-grow"
                  />
                </div>
              )}
            </div>
          ))}
          {Object.keys(filters).length > 0 && (
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Xóa bộ lọc
              </Button>
            </div>
          )}
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
            selectable
            selectedRows={selectedRows}
            onRowSelect={onRowSelect}
            onSelectAll={onSelectAll}
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
      </CardContent>
    </Card>
  );
};

export default DataManagementTab;