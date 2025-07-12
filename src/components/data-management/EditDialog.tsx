import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import DateInput from '@/components/DateInput';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  title: string;
  description?: string;
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'password' | 'select' | 'textarea' | 'boolean';
    options?: string[];
    defaultValue?: any;
    schema: z.ZodTypeAny;
  }[];
  initialData?: Record<string, any>;
  isLoading: boolean;
}

export const EditDialog: React.FC<EditDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  title,
  description,
  fields,
  initialData,
  isLoading,
}) => {
  const dynamicSchema = z.object(
    fields.reduce((acc, field) => {
      acc[field.name] = field.schema;
      return acc;
    }, {} as Record<string, z.ZodTypeAny>)
  );

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: initialData || {},
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset(fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || undefined }), {}));
    }
  }, [initialData, form, fields]);

  const onSubmit = (data: any) => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description || "Vui lòng điền thông tin chi tiết."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            {fields.map((field) => (
              <FormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField }) => (
                  <FormItem>
                    <FormLabel>{field.label}</FormLabel>
                    <FormControl>
                      {(() => {
                        switch (field.type) {
                          case 'date':
                            return (
                              <DateInput
                                value={formField.value ? format(new Date(formField.value), 'yyyy-MM-dd') : ''}
                                onChange={(dateString) => formField.onChange(dateString ? parseISO(dateString) : null)}
                                label={field.label}
                              />
                            );
                          case 'select':
                            return (
                              <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={`Chọn ${field.label}`} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {field.options?.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          case 'textarea':
                            return <Textarea {...formField} value={formField.value || ''} />;
                          case 'boolean':
                            return (
                              <div className="flex items-center h-9">
                                <Switch
                                  checked={!!formField.value}
                                  onCheckedChange={formField.onChange}
                                />
                              </div>
                            );
                          default:
                            return <Input type={field.type} {...formField} value={formField.value || ''} />;
                        }
                      })()}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};