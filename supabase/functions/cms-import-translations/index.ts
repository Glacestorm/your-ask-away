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

    const { data, format = 'json', overwrite = false } = await req.json();

    if (!data) {
      return new Response(JSON.stringify({ error: 'No data provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let translations: Array<{ key: string; locale: string; value: string; namespace?: string }> = [];

    if (format === 'csv') {
      // Parse CSV
      const lines = data.split('\n').filter((l: string) => l.trim());
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(".*?"|[^,]+)/g) || [];
        const row: Record<string, string> = {};
        headers.forEach((h: string, idx: number) => {
          row[h.trim()] = (values[idx] || '').replace(/^"|"$/g, '').replace(/""/g, '"');
        });
        
        if (row.key && row.locale) {
          translations.push({
            key: row.key,
            locale: row.locale,
            value: row.value || '',
            namespace: row.namespace
          });
        }
      }
    } else {
      // Parse JSON (grouped by locale)
      for (const [locale, keys] of Object.entries(data as Record<string, Record<string, string>>)) {
        for (const [key, value] of Object.entries(keys)) {
          translations.push({ key, locale, value });
        }
      }
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const t of translations) {
      // Check if exists
      const { data: existing } = await (supabase as any)
        .from('cms_translations')
        .select('id')
        .eq('translation_key', t.key)
        .eq('locale', t.locale)
        .single();

      if (existing) {
        if (overwrite) {
          await (supabase as any)
            .from('cms_translations')
            .update({ value: t.value, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          updated++;
        } else {
          skipped++;
        }
      } else {
        await (supabase as any)
          .from('cms_translations')
          .insert({
            translation_key: t.key,
            locale: t.locale,
            value: t.value,
            namespace: t.namespace || 'common',
            is_reviewed: false
          });
        imported++;
      }
    }

    console.log(`Import complete: ${imported} new, ${updated} updated, ${skipped} skipped`);

    return new Response(JSON.stringify({ 
      success: true, 
      imported,
      updated,
      skipped,
      total: translations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error importing translations:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
