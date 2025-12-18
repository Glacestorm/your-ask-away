import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { configType, config } = await req.json();

    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    switch (configType) {
      case 'site_settings':
        if (!config.site_name?.trim()) {
          result.errors.push('Site name is required');
        }
        if (config.contact_email && !config.contact_email.includes('@')) {
          result.errors.push('Invalid contact email format');
        }
        if (config.external_scripts) {
          for (const script of config.external_scripts) {
            if (script.src && !script.src.startsWith('https://')) {
              result.warnings.push(`Script "${script.name}" should use HTTPS`);
            }
          }
        }
        break;

      case 'theme':
        if (!config.theme_name?.trim()) {
          result.errors.push('Theme name is required');
        }
        if (!config.color_palette || Object.keys(config.color_palette).length === 0) {
          result.errors.push('Color palette is required');
        }
        if (config.color_palette) {
          for (const [key, value] of Object.entries(config.color_palette)) {
            if (typeof value === 'string' && !value.match(/^#[0-9A-Fa-f]{6}$/)) {
              result.warnings.push(`Color "${key}" may not be a valid hex color`);
            }
          }
        }
        break;

      case 'navigation':
        if (!config.menu_location) {
          result.errors.push('Menu location is required');
        }
        if (config.items) {
          for (const item of config.items) {
            if (!item.label) {
              result.errors.push('Navigation item label is required');
            }
            if (item.url && item.is_external && !item.url.startsWith('http')) {
              result.warnings.push(`External link "${item.label}" should start with http(s)`);
            }
          }
        }
        break;

      case 'feature_flag':
        if (!config.flag_key?.trim()) {
          result.errors.push('Flag key is required');
        }
        if (config.flag_key && !/^[a-z][a-z0-9_]*$/.test(config.flag_key)) {
          result.errors.push('Flag key must be lowercase alphanumeric with underscores');
        }
        if (config.rollout_percentage !== undefined) {
          if (config.rollout_percentage < 0 || config.rollout_percentage > 100) {
            result.errors.push('Rollout percentage must be between 0 and 100');
          }
        }
        if (config.start_date && config.end_date) {
          if (new Date(config.start_date) >= new Date(config.end_date)) {
            result.errors.push('End date must be after start date');
          }
        }
        break;

      case 'dashboard_layout':
        if (!config.layout_name?.trim()) {
          result.errors.push('Layout name is required');
        }
        if (config.widgets) {
          const widgetIds = config.widgets.map((w: any) => w.id);
          const duplicates = widgetIds.filter((id: string, index: number) => widgetIds.indexOf(id) !== index);
          if (duplicates.length > 0) {
            result.errors.push(`Duplicate widget IDs: ${duplicates.join(', ')}`);
          }
        }
        break;

      case 'email_template':
        if (!config.template_key?.trim()) {
          result.errors.push('Template key is required');
        }
        if (!config.subject) {
          result.errors.push('Email subject is required');
        }
        if (!config.html_content) {
          result.errors.push('Email HTML content is required');
        }
        if (config.variables) {
          const htmlVars = (config.html_content?.en || '').match(/\{\{(\w+)\}\}/g) || [];
          for (const varName of config.variables) {
            if (!htmlVars.includes(`{{${varName}}}`)) {
              result.warnings.push(`Variable "${varName}" not used in template`);
            }
          }
        }
        break;

      default:
        result.warnings.push(`Unknown config type: ${configType}`);
    }

    result.valid = result.errors.length === 0;

    console.log(`Config validation for ${configType}: ${result.valid ? 'PASSED' : 'FAILED'}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error validating config:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
