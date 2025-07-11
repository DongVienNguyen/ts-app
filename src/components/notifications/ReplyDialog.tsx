import React from 'react';
import { useForm } from 'react-hook-form';
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
import { Notification } from '@/types/asset'; // Now correctly imported

const replySchema = z.object({
  subject: z.string().min(1, 'Tiêu đề không được để trống'),
  message: z.string().min(1, 'Nội dung không được để trống'),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface ReplyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSendReply: (data: ReplyFormValues) => void; // Changed from onSend
  // onQuickAction: (action: string) => void; // Removed as it's not used
  notification: Notification;
  isReplying: boolean; // Added
  isQuickActioning: boolean; // Added
}

export const ReplyDialog: React.FC<ReplyDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSendReply, // Changed
  // onQuickAction, // Removed
  notification, 
  isReplying, // Added
  isQuickActioning // Added
}) => {
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      subject: `Re: ${notification.title}`,
      message: '',
    },
  });

  const onSubmit = (data: ReplyFormValues) => {
    onSendReply(data); // Changed
  };

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        subject: `Re: ${notification.title}`,
        message: '',
      });
    }
  }, [isOpen, notification.title, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Trả lời thông báo</DialogTitle>
          <DialogDescription>
            Gửi phản hồi cho thông báo từ "{notification.recipient_username}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tiêu đề</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isReplying || isQuickActioning}>
                Hủy
              </Button>
              <Button type="submit" disabled={isReplying || isQuickActioning}>
                {isReplying ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};