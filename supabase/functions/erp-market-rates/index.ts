import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateData {
  rate_code: string;
  currency: string;
  tenor: string;
  rate_value: number;
  rate_date: string;
  source: string;
}

// Simulated rates data (in production would fetch from ECB, Federal Reserve, etc.)
const CURRENT_RATES: RateData[] = [
  // EURIBOR (EUR)
  { rate_code: 'euribor_1m', currency: 'EUR', tenor: '1M', rate_value: 3.125, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  { rate_code: 'euribor_3m', currency: 'EUR', tenor: '3M', rate_value: 3.245, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  { rate_code: 'euribor_6m', currency: 'EUR', tenor: '6M', rate_value: 3.387, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  { rate_code: 'euribor_12m', currency: 'EUR', tenor: '12M', rate_value: 3.456, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  { rate_code: 'ecb_main', currency: 'EUR', tenor: 'MAIN', rate_value: 4.50, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  { rate_code: 'ecb_deposit', currency: 'EUR', tenor: 'DEP', rate_value: 4.00, rate_date: new Date().toISOString().split('T')[0], source: 'ECB' },
  
  // SOFR (USD)
  { rate_code: 'sofr_overnight', currency: 'USD', tenor: 'ON', rate_value: 5.33, rate_date: new Date().toISOString().split('T')[0], source: 'FED' },
  { rate_code: 'sofr_1m', currency: 'USD', tenor: '1M', rate_value: 5.34, rate_date: new Date().toISOString().split('T')[0], source: 'FED' },
  { rate_code: 'sofr_3m', currency: 'USD', tenor: '3M', rate_value: 5.35, rate_date: new Date().toISOString().split('T')[0], source: 'FED' },
  { rate_code: 'fed_funds', currency: 'USD', tenor: 'TARGET', rate_value: 5.50, rate_date: new Date().toISOString().split('T')[0], source: 'FED' },
  
  // SONIA (GBP)
  { rate_code: 'sonia_overnight', currency: 'GBP', tenor: 'ON', rate_value: 5.20, rate_date: new Date().toISOString().split('T')[0], source: 'BOE' },
  { rate_code: 'sonia_1m', currency: 'GBP', tenor: '1M', rate_value: 5.21, rate_date: new Date().toISOString().split('T')[0], source: 'BOE' },
  { rate_code: 'sonia_3m', currency: 'GBP', tenor: '3M', rate_value: 5.23, rate_date: new Date().toISOString().split('T')[0], source: 'BOE' },
  { rate_code: 'boe_rate', currency: 'GBP', tenor: 'MAIN', rate_value: 5.25, rate_date: new Date().toISOString().split('T')[0], source: 'BOE' },
  
  // CHF
  { rate_code: 'saron_overnight', currency: 'CHF', tenor: 'ON', rate_value: 1.70, rate_date: new Date().toISOString().split('T')[0], source: 'SNB' },
  { rate_code: 'snb_rate', currency: 'CHF', tenor: 'MAIN', rate_value: 1.75, rate_date: new Date().toISOString().split('T')[0], source: 'SNB' },
];

// Historical rate trends (last 12 months simulation)
function generateHistoricalRates(rateCode: string, currentValue: number): Array<{ date: string; value: number }> {
  const history = [];
  const today = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);
    
    // Simulate some variation
    const variation = (Math.random() - 0.5) * 0.5;
    const historicalValue = Math.max(0, currentValue - (i * 0.1) + variation);
    
    history.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(historicalValue * 1000) / 1000
    });
  }
  
  return history;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, currency, rate_code } = await req.json();
    
    console.log(`[erp-market-rates] Action: ${action}, Currency: ${currency}`);

    switch (action) {
      case 'get_all_rates': {
        // Filter by currency if provided
        const rates = currency 
          ? CURRENT_RATES.filter(r => r.currency === currency)
          : CURRENT_RATES;
        
        return new Response(JSON.stringify({
          success: true,
          data: rates,
          updated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_rate_history': {
        if (!rate_code) {
          throw new Error('rate_code is required for history');
        }
        
        const currentRate = CURRENT_RATES.find(r => r.rate_code === rate_code);
        if (!currentRate) {
          throw new Error(`Rate ${rate_code} not found`);
        }
        
        const history = generateHistoricalRates(rate_code, currentRate.rate_value);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            rate: currentRate,
            history
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_central_bank_rates': {
        const centralBankRates = CURRENT_RATES.filter(r => 
          ['ecb_main', 'ecb_deposit', 'fed_funds', 'boe_rate', 'snb_rate'].includes(r.rate_code)
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: centralBankRates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_reference_rates': {
        // Get common reference rates used in variable rate loans
        const referenceRates = CURRENT_RATES.filter(r => 
          r.rate_code.startsWith('euribor_') || 
          r.rate_code.startsWith('sofr_') ||
          r.rate_code.startsWith('sonia_')
        );
        
        return new Response(JSON.stringify({
          success: true,
          data: referenceRates
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[erp-market-rates] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
