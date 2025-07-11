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

// Define a generic schema for editing, allowing dynamic fields
const editSchema = z.object({
  id: z.string().optional(), // ID is optional for new entries
  field: z.string().min(1, 'Trường không được để trống'),
  value: z.any(), // Value can be anything, will be validated dynamically
});

interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  title: string;
  description?: string; // Optional description for the dialog
  fields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'email' | 'password';
    defaultValue?: any;
    schema: z.ZodTypeAny; // Zod schema for individual field validation
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
  // Dynamically create a Zod schema based on the 'fields' prop
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
      // Reset form with initial data when it changes
      form.reset(initialData);
    } else {
      // Reset form to empty if no initial data (e.g., for new entry)
      form.reset(fields.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue || '' }), {}));
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
          {/* Always render DialogDescription, provide a default if description is not given */}
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
                      {field.type === 'date' ? (
                        <DateInput
                          value={formField.value ? format(formField.value, 'yyyy-MM-dd') : ''}
                          onChange={(dateString) => formField.onChange(dateString ? parseISO(dateString) : null)}
                          label={field.label}
                        />
                      ) : (
                        <Input
                          type={field.type}
                          {...formField}
                          value={formField.value || ''}
                        />
                      )}
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