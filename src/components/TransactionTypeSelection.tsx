import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionTypeSelectionProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const TransactionTypeSelection: React.FC<TransactionTypeSelectionProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const transactionTypes = [
    { value: 'Xuất kho', label: 'Xuất kho' },
    { value: 'Mượn TS', label: 'Mượn TS' },
    { value: 'Thay bìa', label: 'Thay bìa' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700">Loại tác nghiệp Xuất/Mượn/Thay bìa</Label>
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder="Chọn Mượn/Xuất TS/Thay bìa" />
        </SelectTrigger>
        <SelectContent>
          {transactionTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TransactionTypeSelection;