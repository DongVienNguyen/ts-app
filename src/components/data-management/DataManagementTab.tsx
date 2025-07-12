import { Plus, Download, Upload, Trash2, Edit, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DateInput from '@/components/DateInput';
import TestDataButton from '@/components/TestDataButton';
import { entityConfig } from '@/config/entityConfig';

interface DataManagementTabProps {
  selectedEntity: string;
  onEntityChange: (entity: string) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filteredData: any[];
  paginatedData: any[];
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
}

export const DataManagementTab = ({
  selectedEntity,
  onEntityChange,
  isLoading,
  searchTerm,
  onSearchChange,
  filteredData,
  paginatedData,
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
  onBulkDeleteTransactions
}: DataManagementTabProps) => {
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

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm trong bảng dữ liệu</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder={`Tìm kiếm trong ${entityConfig[selectedEntity]?.name}...`}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
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
            {entityConfig[selectedEntity]?.name} (Tổng: {filteredData.length} bản ghi)
          </CardTitle>
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
                              {/* Removed staff lock/unlock button */}
                              <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Chỉnh sửa">
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onDelete(item)} title="Xóa">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};