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

    const { contentId, contentType, previewToken } = await req.json();

    if (!contentId || !contentType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tableName = contentType === 'page' ? 'cms_pages' : 'cms_posts';

    // Get content including drafts
    const { data: content, error } = await (supabase as any)
      .from(tableName)
      .select('*')
      .eq('id', contentId)
      .single();

    if (error) throw error;

    // Get latest revision if exists
    let latestRevision = null;
    if (contentType === 'page') {
      const { data: revision } = await (supabase as any)
        .from('cms_page_revisions')
        .select('*')
        .eq('page_id', contentId)
        .order('revision_number', { ascending: false })
        .limit(1)
        .single();
      latestRevision = revision;
    }

    // Generate preview token for secure access
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Build preview data
    const previewData = {
      ...content,
      latestRevision,
      previewToken: token,
      previewExpiresAt: expiresAt,
      isPreview: true
    };

    console.log(`Preview generated for ${contentType} ${contentId}`);

    return new Response(JSON.stringify({ success: true, preview: previewData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating preview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
