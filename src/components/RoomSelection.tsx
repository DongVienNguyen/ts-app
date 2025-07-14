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
  const rooms = ['QLN', 'CMT8', 'NS', 'ĐS', 'LĐH', 'DVKH'];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        <Building className="w-4 h-4" />
        <span>Tài sản của phòng</span>
      </Label>
      <Select value={selectedRoom} onValueChange={onRoomChange}>
        <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500">
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