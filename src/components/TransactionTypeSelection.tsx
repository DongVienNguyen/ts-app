import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft } from 'lucide-react';

interface TransactionTypeSelectionProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const TransactionTypeSelection: React.FC<TransactionTypeSelectionProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const transactionTypes = [
    { value: 'xuat', label: 'Xuất' },
    { value: 'muon', label: 'Mượn' },
    { value: 'thay_bia', label: 'Thay bìa' },
  ];

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium text-gray-900 flex items-center space-x-2">
        <ArrowRightLeft className="w-4 h-4 text-blue-600" />
        <span>Loại tác nghiệp Xuất/Mượn/Thay bìa</span>
      </Label>
      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chọn loại tác nghiệp" />
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