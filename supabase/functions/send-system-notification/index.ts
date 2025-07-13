import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { Resend } from 'https://esm.sh/resend@3.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemNotificationPayload {
  recipient_username: string;
  title: string;
  message: string;
  notification_type?: string;
  related_data?: any;
}

async function sendEmail(resend: Resend, supabase: SupabaseClient, payload: SystemNotificationPayload) {
  const { data: user, error } = await supabase
    .from('staff')
    .select('email, staff_name')
    .eq('username', payload.recipient_username)
    .single();

  if (error || !user || !user.email) {
    throw new Error(`Không tìm thấy email cho người dùng: ${payload.recipient_username}`);
  }

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: user.email,
    subject: `[THÔNG BÁO HỆ THỐNG] ${payload.title}`,
    html: `
      <p>Chào ${user.staff_name || payload.recipient_username},</p>
      <p>${payload.message}</p>
      <p>Đây là một thông báo tự động từ hệ thống. Vui lòng không trả lời email này.</p>
    `,
  });
}

async function sendPush(supabase: SupabaseClient, payload: SystemNotificationPayload) {
  await supabase.functions.invoke('send-push-notification', {
    body: {
      username: payload.recipient_username,
      payload: {
        title: payload.title,
        body: payload.message,
        tag: payload.notification_type || 'system',
      },
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: SystemNotificationPayload = await req.json();
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // 1. Lưu thông báo vào DB
    await supabaseAdmin.from('notifications').insert({
      ...payload,
      notification_type: payload.notification_type || 'system',
      related_data: { ...payload.related_data, sender: 'Hệ thống' },
    });

    // 2. Gửi Push Notification và Email song song
    await Promise.all([
      sendPush(supabaseAdmin, payload),
      sendEmail(resend, supabaseAdmin, payload)
    ]);

    return new Response(JSON.stringify({ message: "Thông báo hệ thống đã được gửi thành công." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Lỗi trong Edge Function send-system-notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});