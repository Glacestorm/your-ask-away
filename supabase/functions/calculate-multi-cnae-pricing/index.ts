import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PricingRequest {
  cnae_codes: string[];
  company_turnover?: number;
  company_id?: string;
}

interface CNAEPriceResult {
  cnae_code: string;
  base_price: number;
  turnover_tier: string;
  tier_multiplier: number;
  volume_discount_pct: number;
  bundle_discount_pct: number;
  final_price: number;
  complexity_tier: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { cnae_codes, company_turnover, company_id }: PricingRequest = await req.json();

    if (!cnae_codes || cnae_codes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'cnae_codes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing CNAEs for the company if provided
    let existingCnaesCount = 0;
    if (company_id) {
      const { count } = await supabase
        .from('company_cnaes')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company_id);
      existingCnaesCount = count || 0;
    }

    // Calculate price for each CNAE
    const priceResults: CNAEPriceResult[] = [];
    let totalBasePrice = 0;
    let totalFinalPrice = 0;

    for (let i = 0; i < cnae_codes.length; i++) {
      const cnaeCode = cnae_codes[i];
      const { data, error } = await supabase.rpc('calculate_cnae_price', {
        p_cnae_code: cnaeCode,
        p_company_turnover: company_turnover || null,
        p_existing_cnaes: existingCnaesCount + i
      });

      if (error) {
        console.error(`Error calculating price for ${cnaeCode}:`, error);
        continue;
      }

      const result = data as CNAEPriceResult;
      priceResults.push(result);
      totalBasePrice += result.base_price;
      totalFinalPrice += result.final_price;
    }

    // Find applicable bundles
    const { data: bundles } = await supabase.rpc('find_applicable_bundles', {
      p_cnae_codes: cnae_codes
    });

    // Calculate best bundle discount if any
    let bestBundle = null;
    let bundleDiscount = 0;
    if (bundles && bundles.length > 0) {
      bestBundle = bundles[0];
      bundleDiscount = bestBundle.discount_percentage;
      
      // Apply bundle discount to final price
      totalFinalPrice = totalFinalPrice * (1 - bundleDiscount / 100);
    }

    // Calculate volume discount
    const totalCnaes = existingCnaesCount + cnae_codes.length;
    let volumeDiscountTier = 'none';
    if (totalCnaes >= 10) volumeDiscountTier = 'enterprise';
    else if (totalCnaes >= 5) volumeDiscountTier = 'professional';
    else if (totalCnaes >= 2) volumeDiscountTier = 'standard';

    // Prepare response
    const response = {
      summary: {
        total_cnaes: cnae_codes.length,
        existing_cnaes: existingCnaesCount,
        total_base_price: Math.round(totalBasePrice * 100) / 100,
        total_final_price: Math.round(totalFinalPrice * 100) / 100,
        total_savings: Math.round((totalBasePrice - totalFinalPrice) * 100) / 100,
        savings_percentage: Math.round((1 - totalFinalPrice / totalBasePrice) * 10000) / 100,
        volume_discount_tier: volumeDiscountTier,
        bundle_applied: bestBundle ? {
          name: bestBundle.bundle_name,
          discount: bestBundle.discount_percentage,
          matching_cnaes: bestBundle.matching_cnaes
        } : null
      },
      details: priceResults,
      available_bundles: bundles || [],
      recommendations: generateRecommendations(priceResults, bundles, totalCnaes)
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in calculate-multi-cnae-pricing:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateRecommendations(
  priceResults: CNAEPriceResult[],
  bundles: any[],
  totalCnaes: number
): string[] {
  const recommendations: string[] = [];

  // Volume discount recommendation
  if (totalCnaes < 2) {
    recommendations.push('Añade un segundo CNAE para obtener un 10% de descuento por volumen.');
  } else if (totalCnaes < 5) {
    recommendations.push(`Con ${5 - totalCnaes} CNAEs más alcanzarás el descuento Professional (25%).`);
  } else if (totalCnaes < 10) {
    recommendations.push(`Con ${10 - totalCnaes} CNAEs más alcanzarás el descuento Enterprise (30%).`);
  }

  // Bundle recommendations
  if (bundles && bundles.length > 0) {
    const bestBundle = bundles[0];
    if (bestBundle.match_count < bestBundle.cnae_codes?.length) {
      recommendations.push(
        `Completa el ${bestBundle.bundle_name} para maximizar tu descuento del ${bestBundle.discount_percentage}%.`
      );
    }
  }

  // Complexity tier recommendations
  const enterpriseCnaes = priceResults.filter(p => p.complexity_tier === 'enterprise');
  if (enterpriseCnaes.length > 0) {
    recommendations.push(
      `Tienes ${enterpriseCnaes.length} CNAE(s) enterprise. Considera el Pack Holding Diversificado para mejor precio.`
    );
  }

  return recommendations;
}
