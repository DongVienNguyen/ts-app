import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface ErrorFiltersProps {
  onFiltersChange: (filters: ErrorFilters) => void;
  totalErrors: number;
  filteredErrors: number;
}

export interface ErrorFilters {
  severity?: string;
  status?: string;
  errorType?: string;
  dateRange?: string;
  searchTerm?: string;
}

export function ErrorFilters({ onFiltersChange, totalErrors, filteredErrors }: ErrorFiltersProps) {
  const [filters, setFilters] = useState<ErrorFilters>({});

  const updateFilter = (key: keyof ErrorFilters, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const activeFiltersCount = Object.keys(filters).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Bộ lọc</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {filteredErrors} / {totalErrors} lỗi
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Tìm kiếm lỗi..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>

          {/* Severity Filter */}
          <div>
            <Select value={filters.severity || 'all'} onValueChange={(value) => updateFilter('severity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Type Filter */}
          <div>
            <Select value={filters.errorType || 'all'} onValueChange={(value) => updateFilter('errorType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Loại lỗi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="TypeError">TypeError</SelectItem>
                <SelectItem value="ReferenceError">ReferenceError</SelectItem>
                <SelectItem value="NetworkError">NetworkError</SelectItem>
                <SelectItem value="ValidationError">ValidationError</SelectItem>
                <SelectItem value="AuthError">AuthError</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <Select value={filters.dateRange || 'all'} onValueChange={(value) => updateFilter('dateRange', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="1h">1 giờ qua</SelectItem>
                <SelectItem value="24h">24 giờ qua</SelectItem>
                <SelectItem value="7d">7 ngày qua</SelectItem>
                <SelectItem value="30d">30 ngày qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
            {Object.entries(filters).map(([key, value]) => (
              <Badge key={key} variant="outline" className="flex items-center space-x-1">
                <span>{key}: {value}</span>
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter(key as keyof ErrorFilters, undefined)}
                />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Xóa tất cả
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}