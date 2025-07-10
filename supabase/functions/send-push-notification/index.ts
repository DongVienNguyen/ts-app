// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import webpush from 'npm:web-push@3.6.7';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-system-operation',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, payload } = await req.json();

    if (!username || !payload) {
      return new Response(JSON.stringify({ error: 'username and payload are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.error('VAPID keys are not configured in environment variables.');
        return new Response(JSON.stringify({ error: 'Push notifications are not configured on the server.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('username', username);

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No push subscriptions found for user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const notificationPayload = JSON.stringify(payload);
    const sendPromises = subscriptions.map((s: any) => 
      webpush.sendNotification(s.subscription, notificationPayload)
        .catch(async (err: any) => {
          // If a subscription is no longer valid, remove it from the database
          if (err.statusCode === 410) {
            console.log('Subscription expired or invalid, removing from DB:', s.subscription.endpoint);
            await supabaseAdmin
              .from('push_subscriptions')
              .delete()
              .eq('subscription->>endpoint', s.subscription.endpoint);
          } else {
            console.error('Failed to send push notification:', err);
          }
        })
    );

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, message: `Push notifications sent to ${subscriptions.length} endpoints.` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});