import { Building } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RoomSelectionProps {
  selectedRoom: string;
  onRoomChange: (value: string) => void;
}

const RoomSelection = ({ selectedRoom, onRoomChange }: RoomSelectionProps) => {
  return (
    <div className="space-y-4">
      <Label className="flex items-center text-base font-semibold">
        <Building className="w-5 h-5 mr-2 text-green-600" />
        Tài sản của phòng
      </Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select value={selectedRoom} onValueChange={onRoomChange}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn phòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="QLN">QLN</SelectItem>
            <SelectItem value="CMT8">CMT8</SelectItem>
            <SelectItem value="NS">NS</SelectItem>
            <SelectItem value="ĐS">ĐS</SelectItem>
            <SelectItem value="LĐH">LĐH</SelectItem>
            <SelectItem value="DVKH">DVKH</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RoomSelection;