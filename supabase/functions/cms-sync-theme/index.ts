import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { themeId, targetUsers, forceRefresh = false } = await req.json();

    if (!themeId) {
      return new Response(JSON.stringify({ error: 'Theme ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get theme data
    const { data: theme, error: themeError } = await (supabase as any)
      .from('cms_themes')
      .select('*')
      .eq('id', themeId)
      .single();

    if (themeError) throw themeError;

    // Set as active theme
    await (supabase as any)
      .from('cms_themes')
      .update({ is_active: false })
      .neq('id', themeId);

    await (supabase as any)
      .from('cms_themes')
      .update({ is_active: true })
      .eq('id', themeId);

    // Store theme sync event for realtime subscribers
    const syncEvent = {
      type: 'theme_sync',
      theme_id: themeId,
      theme_name: theme.theme_name,
      color_palette: theme.color_palette,
      is_dark_mode: theme.is_dark_mode,
      force_refresh: forceRefresh,
      synced_at: new Date().toISOString()
    };

    // Update site settings with active theme
    await (supabase as any)
      .from('cms_site_settings')
      .upsert({
        setting_key: 'active_theme',
        setting_value: syncEvent,
        label: 'Active Theme',
        category: 'theme',
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });

    // Log audit
    await (supabase as any).from('cms_audit_log').insert({
      action: 'theme_synced',
      entity_type: 'theme',
      entity_id: themeId,
      entity_name: theme.theme_name,
      new_value: syncEvent
    });

    console.log(`Theme ${theme.theme_name} synced to all users`);

    return new Response(JSON.stringify({ 
      success: true, 
      theme: theme.theme_name,
      syncedAt: syncEvent.synced_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error syncing theme:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
