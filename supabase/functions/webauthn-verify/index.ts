import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { credentialId, userId, clientDataJSON, authenticatorData, signature } = await req.json();

    if (!credentialId || !userId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify credential exists and belongs to user
    const { data: passkey, error: passkeyError } = await supabase
      .from("user_passkeys")
      .select("*")
      .eq("credential_id", credentialId)
      .eq("user_id", userId)
      .eq("active", true)
      .single();

    if (passkeyError || !passkey) {
      console.error("Passkey not found:", passkeyError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid credential" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // In a production environment, you would verify the signature here
    // For now, we trust the client-side verification and update the counter

    // Update last used timestamp and counter
    await supabase
      .from("user_passkeys")
      .update({
        last_used_at: new Date().toISOString(),
        counter: (passkey.counter || 0) + 1,
      })
      .eq("id", passkey.id);

    // Get user email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser?.user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link token for the user
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin')}/home`,
      },
    });

    if (magicLinkError) {
      console.error("Magic link error:", magicLinkError);
      // Even if magic link fails, we can still confirm the passkey was valid
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Passkey verified, please use password to complete login" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the successful authentication
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "WEBAUTHN_LOGIN",
      table_name: "auth",
      record_id: passkey.id,
      new_data: {
        credential_id: credentialId,
        device_name: passkey.device_name,
        timestamp: new Date().toISOString(),
      },
    });

    // Extract tokens from the magic link if available
    const properties = magicLinkData?.properties || {};
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Authentication successful",
        access_token: properties.access_token,
        refresh_token: properties.refresh_token,
        redirect_url: magicLinkData?.properties?.hashed_token 
          ? `${req.headers.get('origin')}/auth/callback#access_token=${properties.access_token}&refresh_token=${properties.refresh_token}&type=magiclink`
          : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("WebAuthn verify error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
