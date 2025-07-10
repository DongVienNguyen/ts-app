import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateInput from '@/components/DateInput';
import { EntityConfig } from '@/config/entityConfig';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EntityConfig;
  editingItem: any | null;
  onSave: (data: any) => void;
}

export const EditDialog: React.FC<EditDialogProps> = ({ open, onOpenChange, config, editingItem, onSave }) => {
  const [formData, setFormData] = useState<any>({});
  const isEditing = !!editingItem;

  useEffect(() => {
    if (open) {
      if (editingItem) {
        const formattedItem: any = { ...editingItem };
        config.fields.forEach(field => {
          if (field.type === 'boolean' && formattedItem[field.key] !== undefined) {
            formattedItem[field.key] = formattedItem[field.key] ? 'true' : 'false';
          }
        });
        if (config.entity === 'staff') {
          formattedItem.password = '';
        }
        setFormData(formattedItem);
      } else {
        const initialFormData: any = {};
        config.fields.forEach(field => {
          if (field.type === 'boolean') {
            initialFormData[field.key] = 'false';
          } else {
            initialFormData[field.key] = '';
          }
        });
        if (config.entity === 'staff') {
          initialFormData.password = '123456';
        }
        setFormData(initialFormData);
      }
    }
  }, [open, editingItem, config]);

  const handleSaveClick = () => {
    onSave(formData);
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Chỉnh sửa ${config.name}` : `Thêm mới ${config.name}`}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Chỉnh sửa thông tin ${config.name} tại đây.` : `Thêm mới một ${config.name} vào hệ thống.`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {config.fields.map((field) => (
            <div key={field.key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.key} className="text-right">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
              {field.type === 'select' || field.type === 'boolean' ? (
                <Select
                  value={formData[field.key]?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, [field.key]: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={`Chọn ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'true' ? 'Có' : option === 'false' ? 'Không' : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'date' ? (
                <DateInput
                  value={formData[field.key] || ''}
                  onChange={(date) => setFormData({ ...formData, [field.key]: date })}
                  className="col-span-3"
                />
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="col-span-3 border rounded-md p-2"
                />
              ) : (
                <Input
                  id={field.key}
                  type={config.entity === 'staff' && field.key === 'password' ? 'password' : field.type}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="col-span-3"
                  placeholder={config.entity === 'staff' && field.key === 'password' && editingItem ? 'Để trống nếu không muốn thay đổi' : ''}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSaveClick}>Lưu</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};