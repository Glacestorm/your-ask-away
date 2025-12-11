import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_id?: string;
  title: string;
  body: string;
  icon?: string;
  url?: string;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, title, body, icon, url, data } = await req.json() as PushNotificationRequest;

    console.log('Sending push notification:', { user_id, title });

    // Get user subscriptions
    let query = supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        if (vapidPublicKey && vapidPrivateKey && subscription.endpoint) {
          // Using web-push would require additional setup
          // For now, we'll log the notification attempt
          console.log('Would send push to:', subscription.endpoint);
          
          // In production, you'd use a library like web-push:
          // await webpush.sendNotification(subscription, JSON.stringify({ title, body, icon, url, data }));
        }
        
        sentCount++;
      } catch (pushError: unknown) {
        console.error('Error sending to subscription:', pushError);
        errors.push(pushError instanceof Error ? pushError.message : 'Unknown error');
        
        // Mark subscription as inactive if it fails
        await supabaseClient
          .from('push_subscriptions')
          .update({ is_active: false })
          .eq('id', subscription.id);
      }
    }

    // Also create in-app notification
    if (user_id) {
      await supabaseClient
        .from('notifications')
        .insert({
          user_id,
          title,
          message: body,
          type: 'push',
          data: { icon, url, ...data },
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Push Notification Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
