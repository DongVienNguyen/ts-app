import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { AssetEntryFormState } from '@/types/assetEntryFormState';

interface TransactionDetailsProps {
  formData: AssetEntryFormState;
  setFormData: (data: AssetEntryFormState) => void;
  disabledBeforeDate: Date;
}

const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  formData,
  setFormData,
  disabledBeforeDate,
}) => {
  const timeSlots = [
    { value: 'Sáng', label: 'Sáng' },
    { value: 'Chiều', label: 'Chiều' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Buổi và ngày lấy TS
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select 
          value={formData.parts_day} 
          onValueChange={(value) => setFormData({ ...formData, parts_day: value })}
        >
          <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
            <SelectValue placeholder="Chọn buổi" />
          </SelectTrigger>
          <SelectContent>
            {timeSlots.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={formData.transaction_date}
          onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
          min={disabledBeforeDate.toISOString().split('T')[0]}
          className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
    </div>
  );
};

export default TransactionDetails;