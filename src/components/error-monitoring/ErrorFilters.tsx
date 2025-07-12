import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ErrorFiltersProps {
  onFiltersChange: (filters: ErrorFilters) => void;
  totalErrors: number;
  filteredErrors: number;
}

export interface ErrorFilters {
  severity?: string;
  status?: string;
  errorType?: string;
  dateRange?: DateRange;
  searchTerm?: string;
}

export function ErrorFilters({ onFiltersChange, totalErrors, filteredErrors }: ErrorFiltersProps) {
  const [filters, setFilters] = useState<ErrorFilters>({});

  const updateFilter = (key: keyof ErrorFilters, value: string | DateRange | undefined) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value as any;
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
          <div className="lg:col-span-2">
            <Input
              placeholder="Tìm kiếm lỗi..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>

          {/* Severity Filter */}
          <div>
            <Select value={filters.severity || 'all'} onValueChange={(value) => updateFilter('severity', value === 'all' ? undefined : value)}>
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
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
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

          {/* Date Range Filter */}
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "dd/MM/y")} -{" "}
                        {format(filters.dateRange.to, "dd/MM/y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "dd/MM/y")
                    )
                  ) : (
                    <span>Chọn khoảng ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(range) => updateFilter('dateRange', range)}
                  numberOfMonths={2}
                  locale={vi}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center space-x-2 mt-4 flex-wrap gap-y-2">
            <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              let displayValue: string;
              if (key === 'dateRange' && typeof value === 'object') {
                const range = value as DateRange;
                displayValue = `${range.from ? format(range.from, 'dd/MM/y') : ''}${range.to ? ` - ${format(range.to, 'dd/MM/y')}` : ''}`;
              } else {
                displayValue = String(value);
              }
              return (
                <Badge key={key} variant="outline" className="flex items-center space-x-1">
                  <span>{key}: {displayValue}</span>
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter(key as keyof ErrorFilters, undefined)}
                  />
                </Badge>
              );
            })}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Xóa tất cả
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}