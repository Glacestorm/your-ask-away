import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestRequest {
  current_cnaes: string[];
  company_sector?: string;
  company_turnover?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { current_cnaes, company_sector, company_turnover }: SuggestRequest = await req.json();

    if (!current_cnaes || current_cnaes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'current_cnaes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all available bundles
    const { data: allBundles } = await supabase
      .from('cnae_bundles')
      .select('*')
      .eq('is_active', true)
      .order('discount_percentage', { ascending: false });

    // Get pricing info for current CNAEs
    const { data: currentPricing } = await supabase
      .from('cnae_pricing')
      .select('*')
      .in('cnae_code', current_cnaes);

    // Identify sectors of current CNAEs
    const currentSectors = new Set(currentPricing?.map(p => p.sector_category) || []);

    // Find bundles that include at least one current CNAE
    const relevantBundles = (allBundles || []).filter(bundle => {
      const matchingCnaes = bundle.cnae_codes.filter((code: string) => current_cnaes.includes(code));
      return matchingCnaes.length > 0;
    });

    // For each relevant bundle, identify missing CNAEs to complete it
    const suggestions = relevantBundles.map(bundle => {
      const matchingCnaes = bundle.cnae_codes.filter((code: string) => current_cnaes.includes(code));
      const missingCnaes = bundle.cnae_codes.filter((code: string) => !current_cnaes.includes(code));
      const completionPercentage = (matchingCnaes.length / bundle.cnae_codes.length) * 100;

      return {
        bundle_id: bundle.id,
        bundle_name: bundle.bundle_name,
        bundle_description: bundle.bundle_description,
        discount_percentage: bundle.discount_percentage,
        matching_cnaes: matchingCnaes,
        missing_cnaes: missingCnaes,
        completion_percentage: Math.round(completionPercentage),
        is_complete: missingCnaes.length === 0,
        min_cnaes_required: bundle.min_cnaes_required,
        qualifies_for_discount: matchingCnaes.length >= bundle.min_cnaes_required
      };
    });

    // Get pricing for missing CNAEs
    const allMissingCnaes = [...new Set(suggestions.flatMap(s => s.missing_cnaes))];
    const { data: missingPricing } = await supabase
      .from('cnae_pricing')
      .select('*')
      .in('cnae_code', allMissingCnaes);

    // Calculate potential savings for completing bundles
    const enhancedSuggestions = suggestions.map(suggestion => {
      const missingPrices = (missingPricing || [])
        .filter(p => suggestion.missing_cnaes.includes(p.cnae_code));
      
      const totalMissingCost = missingPrices.reduce((sum, p) => sum + p.base_price, 0);
      const potentialSavings = totalMissingCost * (suggestion.discount_percentage / 100);

      return {
        ...suggestion,
        missing_cnaes_cost: totalMissingCost,
        potential_savings: Math.round(potentialSavings),
        roi_ratio: totalMissingCost > 0 ? Math.round((potentialSavings / totalMissingCost) * 100) / 100 : 0
      };
    });

    // Sort by qualification status and potential savings
    enhancedSuggestions.sort((a, b) => {
      if (a.qualifies_for_discount !== b.qualifies_for_discount) {
        return a.qualifies_for_discount ? -1 : 1;
      }
      return b.potential_savings - a.potential_savings;
    });

    // Generate AI-style recommendations
    const recommendations = generateAIRecommendations(
      current_cnaes,
      currentSectors,
      enhancedSuggestions,
      company_turnover
    );

    return new Response(
      JSON.stringify({
        current_cnaes,
        current_sectors: Array.from(currentSectors),
        bundle_suggestions: enhancedSuggestions,
        complementary_cnaes: findComplementaryCnaes(currentSectors, allMissingCnaes, missingPricing || []),
        ai_recommendations: recommendations
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suggest-cnae-bundles:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function findComplementaryCnaes(
  currentSectors: Set<string>,
  missingCnaes: string[],
  missingPricing: any[]
): any[] {
  // Find CNAEs from same sectors that would provide synergies
  const complementary = missingPricing
    .filter(p => currentSectors.has(p.sector_category))
    .map(p => ({
      cnae_code: p.cnae_code,
      sector: p.sector_category,
      base_price: p.base_price,
      complexity_tier: p.complexity_tier,
      features: p.includes_features
    }))
    .slice(0, 5);

  return complementary;
}

function generateAIRecommendations(
  currentCnaes: string[],
  currentSectors: Set<string>,
  suggestions: any[],
  turnover?: number
): string[] {
  const recommendations: string[] = [];

  // Check for immediate bundle qualification
  const qualifyingBundles = suggestions.filter(s => s.qualifies_for_discount);
  if (qualifyingBundles.length > 0) {
    const best = qualifyingBundles[0];
    recommendations.push(
      `🎯 Ya calificas para el "${best.bundle_name}" con ${best.discount_percentage}% de descuento.`
    );
  }

  // Suggest completing nearly-complete bundles
  const nearComplete = suggestions.filter(s => 
    !s.is_complete && s.completion_percentage >= 50 && s.missing_cnaes.length <= 2
  );
  if (nearComplete.length > 0) {
    const best = nearComplete[0];
    recommendations.push(
      `📈 Añade ${best.missing_cnaes.length} CNAE(s) para completar "${best.bundle_name}" y ahorrar ${best.potential_savings}€.`
    );
  }

  // Multi-sector holding recommendation
  if (currentSectors.size >= 3) {
    recommendations.push(
      `🏢 Con actividad en ${currentSectors.size} sectores, considera el Pack Holding Diversificado para descuento del 35%.`
    );
  }

  // Turnover-based recommendation
  if (turnover && turnover > 10000000) {
    recommendations.push(
      `💼 Con tu facturación, los CNAEs enterprise ofrecen mejor valor por las funcionalidades incluidas.`
    );
  }

  // General volume recommendation
  if (currentCnaes.length < 3) {
    recommendations.push(
      `🚀 Expande a 3+ CNAEs para desbloquear descuentos por volumen adicionales (hasta 35%).`
    );
  }

  return recommendations;
}
