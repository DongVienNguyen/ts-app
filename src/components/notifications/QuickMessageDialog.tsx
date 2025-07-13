import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronsUpDown, Check, Send, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Staff {
  username: string;
  staff_name: string | null;
}

const messageSchema = z.object({
  recipient: z.string().min(1, 'Vui lòng chọn người nhận'),
  message: z.string().min(1, 'Nội dung tin nhắn không được để trống').max(500, 'Nội dung không quá 500 ký tự'),
});

type MessageFormData = z.infer<typeof messageSchema>;

interface QuickMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function QuickMessageDialog({ isOpen, onOpenChange }: QuickMessageDialogProps) {
  const { user } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery<Staff[]>({
    queryKey: ['staffList'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff').select('username, staff_name');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: isOpen,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: { recipient: '', message: '' },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (values: MessageFormData) => {
      if (!user) throw new Error('Bạn phải đăng nhập để gửi tin nhắn.');
      
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          recipient_username: values.recipient,
          title: `Tin nhắn từ ${user.staff_name || user.username}`,
          message: values.message,
          notification_type: 'direct_message',
          related_data: { sender: user.username },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
    },
  });

  const onSubmit = (values: MessageFormData) => {
    onOpenChange(false);

    sendMessageMutation.mutate(values, {
      onSuccess: (newNotification) => {
        reset();
        toast.info('Message sent.', {
          duration: 6000,
          action: {
            label: 'Undo',
            onClick: async () => {
              await supabase.from('notifications').delete().eq('id', newNotification.id);
              queryClient.invalidateQueries({ queryKey: ['notifications_conversations'] });
              toast.warning('Sending message has been undone.');
            },
          },
        });
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>New</DialogTitle>
            <DialogDescription>Compose and send a direct message to a staff member.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">Người nhận</Label>
              <Controller
                name="recipient"
                control={control}
                render={({ field }) => (
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={popoverOpen}
                        className="w-full justify-between"
                      >
                        {field.value
                          ? staffList.find((staff) => staff.username === field.value)?.staff_name || field.value
                          : 'Chọn người nhận...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[440px] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm nhân viên..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy nhân viên.</CommandEmpty>
                          <CommandGroup>
                            {isLoadingStaff ? (
                              <CommandItem>Đang tải...</CommandItem>
                            ) : (
                              staffList.map((staff) => (
                                <CommandItem
                                  key={staff.username}
                                  value={staff.staff_name || staff.username}
                                  onSelect={() => {
                                    field.onChange(staff.username);
                                    setPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === staff.username ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {staff.staff_name} ({staff.username})
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.recipient && <p className="text-sm text-red-500">{errors.recipient.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Nội dung</Label>
              <Controller
                name="message"
                control={control}
                render={({ field }) => (
                  <Textarea id="message" placeholder="Nhập nội dung tin nhắn của bạn ở đây..." {...field} />
                )}
              />
              {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => reset()}>
              <Eraser className="mr-2 h-4 w-4" />
              Xóa
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              Gửi tin nhắn
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}