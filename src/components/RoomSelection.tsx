import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from 'lucide-react';

interface RoomSelectionProps {
  selectedRoom: string;
  onRoomChange: (room: string) => void;
}

const RoomSelection: React.FC<RoomSelectionProps> = ({
  selectedRoom,
  onRoomChange,
}) => {
  const rooms = [
    'A101', 'A102', 'A103', 'A104', 'A105',
    'B101', 'B102', 'B103', 'B104', 'B105',
    'C101', 'C102', 'C103', 'C104', 'C105',
    'D101', 'D102', 'D103', 'D104', 'D105',
    'Phòng họp 1', 'Phòng họp 2', 'Phòng họp 3',
    'Kho tài sản', 'Phòng IT', 'Phòng kế toán'
  ];

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium text-gray-900 flex items-center space-x-2">
        <Building className="w-4 h-4 text-green-600" />
        <span>Tài sản của phòng</span>
      </Label>
      <Select value={selectedRoom} onValueChange={onRoomChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Chọn phòng" />
        </SelectTrigger>
        <SelectContent>
          {rooms.map((room) => (
            <SelectItem key={room} value={room}>
              {room}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RoomSelection;