import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getNextWorkingDay, getMorningTargetDate } from '@/utils/dateUtils';

interface DailyReportFiltersProps {
  filterType: string;
  setFilterType: (value: string) => void;
  customFilters: { start: string; end: string; parts_day: string; };
  setCustomFilters: (value: any) => void;
}

const DailyReportFilters: React.FC<DailyReportFiltersProps> = ({
  filterType,
  setFilterType,
  customFilters,
  setCustomFilters,
}) => {
  const dateStrings = useMemo(() => {
    const now = new Date();
    return {
      todayFormatted: format(now, 'dd/MM/yyyy'),
      nextWorkingDayFormatted: format(getNextWorkingDay(now), 'dd/MM/yyyy'),
      morningDateFormatted: format(getMorningTargetDate(), 'dd/MM/yyyy'),
    };
  }, []);

  return (
    <Card className="border-0 shadow-xl shadow-slate-100/50">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Bộ lọc danh sách cần xem:
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <RadioGroup value={filterType} onValueChange={setFilterType} className="mb-4 space-y-2">
          <div className="flex items-center space-x-2"><RadioGroupItem value="morning" id="morning" /><Label htmlFor="morning">Sáng ngày ({dateStrings.morningDateFormatted})</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="qln_pgd_next_day" id="qln_pgd_next_day" /><Label htmlFor="qln_pgd_next_day">QLN Sáng & PGD trong ngày ({dateStrings.morningDateFormatted})</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="afternoon" id="afternoon" /><Label htmlFor="afternoon">Chiều ngày ({dateStrings.nextWorkingDayFormatted})</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="today" id="today" /><Label htmlFor="today">Trong ngày hôm nay ({dateStrings.todayFormatted})</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="next_day" id="next_day" /><Label htmlFor="next_day">Trong ngày kế tiếp ({dateStrings.nextWorkingDayFormatted})</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="custom" id="custom" /><Label htmlFor="custom">Tùy chọn khoảng thời gian</Label></div>
        </RadioGroup>

        {filterType === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
            <div className="space-y-2">
              <Label>Buổi</Label>
              <Select value={customFilters.parts_day} onValueChange={(v) => setCustomFilters({...customFilters, parts_day: v})}>
                <SelectTrigger><SelectValue placeholder="Chọn buổi" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Sáng">Sáng</SelectItem>
                  <SelectItem value="Chiều">Chiều</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Từ ngày</Label>
              <Input type="date" value={customFilters.start} onChange={(e) => setCustomFilters({...customFilters, start: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Đến ngày</Label>
              <Input type="date" value={customFilters.end} onChange={(e) => setCustomFilters({...customFilters, end: e.target.value})} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyReportFilters;