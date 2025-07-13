import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'https://esm.sh/resend@3.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Lấy các thông báo chưa xem, được gửi hơn 24 giờ trước và chưa gửi email nhắc nhở
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: notifications, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select(`
        id,
        recipient_username,
        title,
        message,
        related_data,
        staff:recipient_username ( email, staff_name )
      `)
      .eq('is_seen', false)
      .lt('created_at', twentyFourHoursAgo)
      .is('email_reminder_sent_at', null)
      .in('notification_type', ['reply', 'direct_message', 'quick_reply']);

    if (fetchError) throw fetchError;

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: "Không có lời nhắc nào cần gửi." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const emailPromises = notifications.map(async (notification) => {
      const recipient = notification.staff as { email: string; staff_name: string };
      if (!recipient || !recipient.email) {
        console.warn(`Bỏ qua thông báo ${notification.id} do không có email người nhận.`);
        return;
      }

      const sender = (notification.related_data as any)?.sender || 'một người dùng';

      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: recipient.email,
        subject: `[NHẮC NHỞ] Bạn có tin nhắn mới chưa đọc từ ${sender}`,
        html: `
          <p>Chào ${recipient.staff_name || recipient.username},</p>
          <p>Bạn có một tin nhắn mới chưa đọc từ <strong>${sender}</strong> đã được gửi hơn 24 giờ trước.</p>
          <p><strong>Nội dung:</strong> ${notification.message}</p>
          <p>Vui lòng đăng nhập vào hệ thống để xem và trả lời.</p>
        `,
      });

      // Đánh dấu là đã gửi email nhắc nhở
      await supabaseAdmin
        .from('notifications')
        .update({ email_reminder_sent_at: new Date().toISOString() })
        .eq('id', notification.id);
    });

    await Promise.all(emailPromises);

    return new Response(JSON.stringify({ message: `Đã xử lý và gửi ${notifications.length} email nhắc nhở.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Lỗi trong Edge Function send-delayed-reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});