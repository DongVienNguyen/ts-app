import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';

const replySchema = z.object({
  message: z.string().min(1, 'Nội dung không được để trống'),
});

type ReplyFormValues = z.infer<typeof replySchema>;

interface ConversationReplyProps {
  onSendReply: (data: ReplyFormValues) => void;
  isReplying: boolean;
}

export const ConversationReply: React.FC<ConversationReplyProps> = ({ onSendReply, isReplying }) => {
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = (data: ReplyFormValues) => {
    onSendReply(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2 pt-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea
                  placeholder="Nhập tin nhắn trả lời..."
                  className="bg-white resize-none"
                  rows={1}
                  {...field}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isReplying} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
};