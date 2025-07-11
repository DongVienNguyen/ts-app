import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { OtherAsset } from '@/types/asset';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import DateInput from './DateInput';
import { format, parseISO } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(1, 'Tên tài sản không được để trống'),
  deposit_date: z.date().optional().nullable(),
  depositor: z.string().optional().nullable(),
  deposit_receiver: z.string().optional().nullable(),
  withdrawal_date: z.date().optional().nullable(),
  withdrawal_deliverer: z.string().optional().nullable(),
  withdrawal_receiver: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type OtherAssetFormValues = z.infer<typeof formSchema>;

interface OtherAssetFormProps {
  asset?: OtherAsset | TablesInsert<'other_assets'> | null; // Cập nhật kiểu dữ liệu tại đây
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OtherAssetFormValues, id?: string) => void;
  isLoading: boolean;
}

export const OtherAssetForm: React.FC<OtherAssetFormProps> = ({ asset, isOpen, onClose, onSave, isLoading }) => {
  const form = useForm<OtherAssetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || '',
      deposit_date: asset?.deposit_date ? new Date(asset.deposit_date) : null,
      depositor: asset?.depositor || '',
      deposit_receiver: asset?.deposit_receiver || '',
      withdrawal_date: asset?.withdrawal_date ? new Date(asset.withdrawal_date) : null,
      withdrawal_deliverer: asset?.withdrawal_deliverer || '',
      withdrawal_receiver: asset?.withdrawal_receiver || '',
      notes: asset?.notes || '',
    },
  });

  const onSubmit = (data: OtherAssetFormValues) => {
    onSave(data, asset?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{asset ? 'Chỉnh sửa' : 'Thêm'} Tài sản khác</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho tài sản. Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên tài sản</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Hộ chiếu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="deposit_date"
                render={({ field }) => (
                  <DateInput
                    label="Ngày gửi"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(dateString) => field.onChange(dateString ? parseISO(dateString) : null)}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="depositor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người gửi</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deposit_receiver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người nhận giữ</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="withdrawal_date"
                render={({ field }) => (
                  <DateInput
                    label="Ngày lấy"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(dateString) => field.onChange(dateString ? parseISO(dateString) : null)}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="withdrawal_deliverer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người giao trả</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="withdrawal_receiver"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người nhận lại</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Thêm ghi chú nếu cần" {...field} value={field.value || ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};