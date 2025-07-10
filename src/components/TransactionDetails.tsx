import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock } from 'lucide-react';
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
    { value: 'sang', label: 'Sáng' },
    { value: 'chieu', label: 'Chiều' },
    { value: 'toi', label: 'Tối' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span>Buổi và ngày lấy TS</span>
          </Label>
          <Select 
            value={formData.parts_day} 
            onValueChange={(value) => setFormData({ ...formData, parts_day: value })}
          >
            <SelectTrigger>
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
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium text-gray-900 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Ngày</span>
          </Label>
          <Input
            type="date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            min={disabledBeforeDate.toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium text-gray-900">
          Ghi chú (tùy chọn)
        </Label>
        <Input
          placeholder="Nhập ghi chú nếu có..."
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
        />
      </div>
    </div>
  );
};

export default TransactionDetails;