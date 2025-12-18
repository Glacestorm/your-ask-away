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

    const { contentId, contentType, action, scheduledAt } = await req.json();

    if (!contentId || !contentType || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tableName = contentType === 'page' ? 'cms_pages' : 'cms_posts';
    const now = new Date().toISOString();

    let updateData: Record<string, any> = {};

    if (action === 'publish') {
      updateData = {
        status: 'published',
        published_at: scheduledAt || now,
        updated_at: now
      };
    } else if (action === 'unpublish') {
      updateData = {
        status: 'draft',
        published_at: null,
        updated_at: now
      };
    } else if (action === 'schedule') {
      updateData = {
        status: 'scheduled',
        published_at: scheduledAt,
        updated_at: now
      };
    } else if (action === 'archive') {
      updateData = {
        status: 'archived',
        updated_at: now
      };
    }

    const { data, error } = await (supabase as any)
      .from(tableName)
      .update(updateData)
      .eq('id', contentId)
      .select()
      .single();

    if (error) throw error;

    // Log audit
    await (supabase as any).from('cms_audit_log').insert({
      action: `content_${action}`,
      entity_type: contentType,
      entity_id: contentId,
      new_value: updateData
    });

    console.log(`Content ${contentId} ${action}ed successfully`);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error publishing content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
