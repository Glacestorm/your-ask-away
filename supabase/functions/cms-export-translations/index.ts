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

    const { format = 'json', locale, namespace } = await req.json();

    // Build query
    let query = (supabase as any).from('cms_translations').select('*');
    
    if (locale) {
      query = query.eq('locale', locale);
    }
    if (namespace) {
      query = query.eq('namespace', namespace);
    }

    const { data: translations, error } = await query.order('translation_key');

    if (error) throw error;

    let exportData: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      // Generate CSV
      const headers = ['key', 'locale', 'namespace', 'value', 'is_reviewed'];
      const rows = translations.map((t: any) => [
        t.translation_key,
        t.locale,
        t.namespace,
        `"${(t.value || '').replace(/"/g, '""')}"`,
        t.is_reviewed
      ]);
      
      exportData = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      contentType = 'text/csv';
      filename = `translations_${locale || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      // Generate JSON grouped by locale
      const grouped: Record<string, Record<string, string>> = {};
      
      for (const t of translations) {
        if (!grouped[t.locale]) {
          grouped[t.locale] = {};
        }
        grouped[t.locale][t.translation_key] = t.value || '';
      }
      
      exportData = JSON.stringify(grouped, null, 2);
      contentType = 'application/json';
      filename = `translations_${locale || 'all'}_${new Date().toISOString().split('T')[0]}.json`;
    }

    console.log(`Exported ${translations.length} translations in ${format} format`);

    return new Response(exportData, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      },
    });
  } catch (error: any) {
    console.error('Error exporting translations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
