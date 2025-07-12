import React, { useMemo } from 'react';
import { Plus, Download, Upload, Trash2, Edit, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import DateInput from '@/components/DateInput';
import TestDataButton from '@/components/TestDataButton';
import { entityConfig } from '@/config/entityConfig';
import OptimizedTable from '@/components/OptimizedTable';

interface DataManagementTabProps {
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredData: any[];
  paginatedData: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  onExportCSV: () => void;
  onImportClick: () => void;
  restoreInputRef: React.RefObject<HTMLInputElement>;
  onRestoreData: (event: React.ChangeEvent<HTMLInputElement>) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onBulkDeleteTransactions: () => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
  filters: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
}

export const DataManagementTab = ({
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  paginatedData,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onAdd,
  onEdit,
  onDelete,
  onExportCSV,
  onImportClick,
  restoreInputRef,
  onRestoreData,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onBulkDeleteTransactions,
  sortColumn,
  sortDirection,
  onSort,
  filters,
  onFilterChange,
  onClearFilters
}: DataManagementTabProps) => {
  const columns = useMemo(() => {
    const config = entityConfig[selectedEntity];
    if (!config) return [];

    const fieldColumns = config.fields.map(field => ({
      key: field.key,
      label: field.label,
      width: 180,
      render: (value: any) => {
        if (field.type === 'date' && value) {
          return new Date(value).toLocaleDateString('vi-VN');
        }
        if (field.type === 'boolean' && typeof value === 'boolean') {
          return value ? 'Có' : 'Không';
        }
        if (selectedEntity === 'staff' && field.key === 'password') {
          return '********';
        }
        return value?.toString() ?? '';
      }
    }));

    const actionsColumn = {
      key: 'actions',
      label: 'Thao tác',
      width: 120,
      render: (_: any, row: any) => (
        <div className="flex justify-end space-x-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)} title="Chỉnh sửa">
            <Edit className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(row)} title="Xóa">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    };

    return [...fieldColumns, actionsColumn];
  }, [selectedEntity, onEdit, onDelete]);

  const filterableFields = useMemo(() => {
    return entityConfig[selectedEntity]?.fields.filter(f => f.filterable) || [];
  }, [selectedEntity]);

  return (
    <div className="mt-6 space-y-6">
      {/* Entity Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn bảng dữ liệu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Select value={selectedEntity} onValueChange={onEntityChange}>
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
          <Button onClick={onAdd} className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
          <Button variant="outline" onClick={onExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button variant="outline" onClick={onImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <input
            type="file"
            ref={restoreInputRef}
            onChange={onRestoreData}
            accept=".zip"
            className="hidden"
          />
          <TestDataButton />
        </CardContent>
      </Card>

      {/* Search & Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm & Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={`Tìm kiếm chung trong ${entityConfig[selectedEntity]?.name}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Accordion type="single" collapsible className="w-full mt-4">
            <AccordionItem value="advanced-filters">
              <AccordionTrigger>Bộ lọc nâng cao</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border-t">
                  {filterableFields.map(field => {
                    if (field.type === 'date') {
                      return (
                        <React.Fragment key={field.key}>
                          <div>
                            <Label>{field.label} (Từ)</Label>
                            <DateInput value={filters[`${field.key}_start`] || ''} onChange={date => onFilterChange(`${field.key}_start`, date)} />
                          </div>
                          <div>
                            <Label>{field.label} (Đến)</Label>
                            <DateInput value={filters[`${field.key}_end`] || ''} onChange={date => onFilterChange(`${field.key}_end`, date)} />
                          </div>
                        </React.Fragment>
                      );
                    }
                    if (field.type === 'boolean' || field.options) {
                      return (
                        <div key={field.key}>
                          <Label>{field.label}</Label>
                          <Select value={filters[field.key] || ''} onValueChange={value => onFilterChange(field.key, value === 'all' ? '' : value)}>
                            <SelectTrigger><SelectValue placeholder={`Lọc theo ${field.label}`} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tất cả</SelectItem>
                              {(field.options || ['true', 'false']).map(option => (
                                <SelectItem key={option} value={option}>{option === 'true' ? 'Có' : option === 'false' ? 'Không' : option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }
                    return (
                      <div key={field.key}>
                        <Label>{field.label}</Label>
                        <Input
                          placeholder={`Lọc theo ${field.label}`}
                          value={filters[field.key] || ''}
                          onChange={e => onFilterChange(field.key, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 pt-2 flex justify-end">
                  <Button variant="ghost" onClick={onClearFilters}>
                    <FilterX className="mr-2 h-4 w-4" /> Xóa bộ lọc
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Bulk Delete for Asset Transactions */}
      {selectedEntity === 'asset_transactions' && (
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle>Xóa hàng loạt (Admin)</CardTitle>
            <p className="text-sm text-gray-600">
              Chọn khoảng thời gian để xóa tất cả các giao dịch trong khoảng đó. Hành động này không thể hoàn tác.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <DateInput value={startDate} onChange={onStartDateChange} />
              </div>
              <div>
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <DateInput value={endDate} onChange={onEndDateChange} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={onBulkDeleteTransactions} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Xóa theo ngày
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {entityConfig[selectedEntity]?.name} (Tổng: {totalCount} bản ghi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedTable
            data={paginatedData}
            columns={columns}
            height={600}
            itemHeight={52}
            onRowClick={onEdit}
            loading={isLoading}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </Button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Tiếp
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};