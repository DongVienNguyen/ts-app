import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface TransactionTypeSelectionProps {
  selectedType: string;
  onTypeChange: (value: string) => void;
}

const TransactionTypeSelection: React.FC<TransactionTypeSelectionProps> = ({ selectedType, onTypeChange }) => {
  return (
    <div className="space-y-2">
      <Label>Loại tác nghiệp Xuất/Mượn/Thay bìa</Label>
      <Select
        value={selectedType}
        onValueChange={onTypeChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Chọn loại tác nghiệp" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Xuất kho">Xuất kho</SelectItem>
          <SelectItem value="Mượn TS">Mượn TS</SelectItem>
          <SelectItem value="Thay bìa">Thay bìa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TransactionTypeSelection;