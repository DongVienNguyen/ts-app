import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DateInput from '@/components/DateInput';

interface StatisticsHeaderProps {
  isBackingUp: boolean;
  isLoading: boolean;
  onBackup: () => void;
  filters: {
    startDate: string;
    endDate: string;
    selectedType: string;
    comparisonEnabled: boolean;
    transactionTypes: string[];
  };
  setters: {
    setStartDate: (date: string) => void;
    setEndDate: (date: string) => void;
    setSelectedType: (type: string) => void;
    setComparisonEnabled: (enabled: boolean) => void;
  };
}

export const StatisticsHeader: React.FC<StatisticsHeaderProps> = ({ isBackingUp, isLoading, onBackup, filters, setters }) => {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <Button onClick={onBackup} disabled={isBackingUp || isLoading}>
        <Download className="mr-2 h-4 w-4" /> {isBackingUp ? 'Đang sao lưu...' : 'Sao lưu toàn bộ dữ liệu'}
      </Button>
      <div className="flex-grow" />
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex items-center space-x-2 self-end">
          <Switch id="comparison-mode" checked={filters.comparisonEnabled} onCheckedChange={setters.setComparisonEnabled} />
          <Label htmlFor="comparison-mode">So sánh kỳ trước</Label>
        </div>
        <div>
          <Label>Loại giao dịch</Label>
          <Select value={filters.selectedType} onValueChange={setters.setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {filters.transactionTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="stats-start-date">Từ ngày</Label>
          <DateInput id="stats-start-date" value={filters.startDate} onChange={setters.setStartDate} />
        </div>
        <div>
          <Label htmlFor="stats-end-date">Đến ngày</Label>
          <DateInput id="stats-end-date" value={filters.endDate} onChange={setters.setEndDate} />
        </div>
      </div>
    </div>
  );
};