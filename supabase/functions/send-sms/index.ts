import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone_number: string;
  message: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone_number, message, user_id } = await req.json() as SMSRequest;

    console.log('Sending SMS to:', phone_number);

    // Validate phone number format
    const cleanPhone = phone_number.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      throw new Error('Invalid phone number format');
    }

    // Check for Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    let status = 'pending';
    let providerMessageId = null;
    let errorMessage = null;

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      // Send via Twilio
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append('To', cleanPhone);
        formData.append('From', twilioPhoneNumber);
        formData.append('Body', message);

        const twilioResponse = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const twilioResult = await twilioResponse.json();

        if (twilioResponse.ok) {
          status = 'sent';
          providerMessageId = twilioResult.sid;
          console.log('SMS sent successfully via Twilio:', providerMessageId);
        } else {
          status = 'failed';
          errorMessage = twilioResult.message || 'Twilio error';
          console.error('Twilio error:', twilioResult);
        }
      } catch (twilioError: unknown) {
        status = 'failed';
        errorMessage = twilioError instanceof Error ? twilioError.message : 'Unknown error';
        console.error('Twilio send error:', twilioError);
      }
    } else {
      // Simulate sending (for development/demo)
      console.log('Twilio not configured. Simulating SMS send...');
      status = 'sent';
      providerMessageId = `sim_${Date.now()}`;
    }

    // Log to database
    const { data: smsRecord, error: insertError } = await supabaseClient
      .from('sms_notifications')
      .insert({
        user_id,
        phone_number: cleanPhone,
        message,
        status,
        provider_message_id: providerMessageId,
        error_message: errorMessage,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error logging SMS:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: status === 'sent',
        message_id: providerMessageId,
        status,
        error: errorMessage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('SMS Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
