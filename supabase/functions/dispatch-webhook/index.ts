import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCronOrServiceAuth, corsHeaders } from "../_shared/cron-auth.ts";

interface WebhookPayload {
  notification_id: string;
  channel_name: string;
  event_type: string;
  title: string;
  message: string;
  severity: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret_key: string | null;
  headers: Record<string, string>;
  retry_config: {
    max_retries: number;
    retry_delay_ms: number;
  };
  events: string[];
  failure_count: number;
}

const generateSignature = async (payload: string, secret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

const dispatchWebhook = async (
  webhook: Webhook,
  payload: WebhookPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ success: boolean; status?: number; error?: string; duration_ms: number }> => {
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": payload.event_type,
    "X-Webhook-Timestamp": payload.timestamp,
    ...(webhook.headers || {}),
  };

  // Add HMAC signature if secret is configured
  if (webhook.secret_key) {
    const signature = await generateSignature(payloadString, webhook.secret_key);
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  let retryCount = 0;
  const maxRetries = webhook.retry_config?.max_retries || 3;
  const retryDelay = webhook.retry_config?.retry_delay_ms || 1000;

  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
      });

      const duration_ms = Date.now() - startTime;
      const responseBody = await response.text();

      // Log the delivery attempt
      await supabase.from("webhook_delivery_logs").insert({
        webhook_id: webhook.id,
        notification_id: payload.notification_id,
        payload: payload as unknown as Record<string, unknown>,
        response_status: response.status,
        response_body: responseBody.substring(0, 1000),
        duration_ms,
        success: response.ok,
        retry_count: retryCount,
        error_message: response.ok ? null : `HTTP ${response.status}`,
      } as Record<string, unknown>);

      if (response.ok) {
        // Update webhook last_triggered_at and reset failure count
        await supabase
          .from("notification_webhooks")
          .update({ 
            last_triggered_at: new Date().toISOString(),
            failure_count: 0 
          } as Record<string, unknown>)
          .eq("id", webhook.id);

        return { success: true, status: response.status, duration_ms };
      }

      // Non-retryable status codes
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { 
          success: false, 
          status: response.status, 
          error: `Client error: ${response.status}`,
          duration_ms 
        };
      }

      // Retryable error
      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      }
    } catch (error) {
      const duration_ms = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Log failed attempt
      await supabase.from("webhook_delivery_logs").insert({
        webhook_id: webhook.id,
        notification_id: payload.notification_id,
        payload: payload as unknown as Record<string, unknown>,
        duration_ms,
        success: false,
        retry_count: retryCount,
        error_message: errorMessage,
      } as Record<string, unknown>);

      retryCount++;
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
      } else {
        // Update failure count
        await supabase
          .from("notification_webhooks")
          .update({ failure_count: (webhook.failure_count || 0) + 1 } as Record<string, unknown>)
          .eq("id", webhook.id);

        return { success: false, error: errorMessage, duration_ms };
      }
    }
  }

  return { success: false, error: "Max retries exceeded", duration_ms: Date.now() - startTime };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  const authResult = validateCronOrServiceAuth(req);
  if (!authResult.valid) {
    console.error("Authentication failed:", authResult.error);
    return new Response(JSON.stringify({ error: authResult.error }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { notification_id, channel_name, event_type } = await req.json();

    console.log(`Dispatching webhooks for notification ${notification_id}, channel: ${channel_name}, event: ${event_type}`);

    // Get notification details
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (notifError || !notification) {
      throw new Error(`Notification not found: ${notification_id}`);
    }

    // Get channel ID
    const { data: channel } = await supabase
      .from("notification_channels")
      .select("id")
      .eq("channel_name", channel_name)
      .single();

    if (!channel) {
      console.log(`No channel found for: ${channel_name}`);
      return new Response(JSON.stringify({ dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active webhooks for this channel
    const { data: webhooks, error: webhookError } = await supabase
      .from("notification_webhooks")
      .select("*")
      .eq("channel_id", channel.id)
      .eq("is_active", true);

    if (webhookError) {
      throw webhookError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log(`No webhooks configured for channel: ${channel_name}`);
      return new Response(JSON.stringify({ dispatched: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter webhooks by event type
    const matchingWebhooks = webhooks.filter((wh) => 
      (wh.events as string[]).includes("*") || (wh.events as string[]).includes(event_type)
    );

    console.log(`Found ${matchingWebhooks.length} matching webhooks`);

    // Prepare payload
    const payload: WebhookPayload = {
      notification_id,
      channel_name,
      event_type: notification.event_type || event_type,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      metadata: notification.metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Dispatch to all matching webhooks in parallel
    const results = await Promise.all(
      matchingWebhooks.map((webhook) => 
        dispatchWebhook(webhook as unknown as Webhook, payload, supabaseUrl, supabaseServiceKey)
      )
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`Dispatched ${successCount}/${matchingWebhooks.length} webhooks successfully`);

    return new Response(
      JSON.stringify({
        dispatched: matchingWebhooks.length,
        successful: successCount,
        results: results.map((r, i) => ({
          webhook_id: matchingWebhooks[i].id,
          webhook_name: matchingWebhooks[i].name,
          ...r,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error dispatching webhooks:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
