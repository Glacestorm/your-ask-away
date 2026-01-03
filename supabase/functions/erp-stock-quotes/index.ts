import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockQuote {
  symbol: string;
  name: string;
  isin?: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap?: number;
  updatedAt: string;
}

// Simulated market data for demo (in production would use Alpha Vantage, Yahoo Finance, etc.)
const DEMO_STOCKS: Record<string, StockQuote> = {
  'SAN.MC': {
    symbol: 'SAN.MC', name: 'Banco Santander', isin: 'ES0113900J37',
    exchange: 'BME', currency: 'EUR', price: 4.52, change: 0.08, changePercent: 1.80,
    volume: 45000000, high: 4.55, low: 4.42, open: 4.44, previousClose: 4.44,
    marketCap: 72000000000, updatedAt: new Date().toISOString()
  },
  'BBVA.MC': {
    symbol: 'BBVA.MC', name: 'Banco Bilbao Vizcaya', isin: 'ES0113211835',
    exchange: 'BME', currency: 'EUR', price: 9.85, change: 0.15, changePercent: 1.55,
    volume: 18000000, high: 9.92, low: 9.68, open: 9.70, previousClose: 9.70,
    marketCap: 58000000000, updatedAt: new Date().toISOString()
  },
  'ITX.MC': {
    symbol: 'ITX.MC', name: 'Inditex', isin: 'ES0148396007',
    exchange: 'BME', currency: 'EUR', price: 45.20, change: -0.35, changePercent: -0.77,
    volume: 4500000, high: 45.80, low: 45.10, open: 45.55, previousClose: 45.55,
    marketCap: 140000000000, updatedAt: new Date().toISOString()
  },
  'TEF.MC': {
    symbol: 'TEF.MC', name: 'Telefónica', isin: 'ES0178430E18',
    exchange: 'BME', currency: 'EUR', price: 4.12, change: 0.02, changePercent: 0.49,
    volume: 22000000, high: 4.15, low: 4.08, open: 4.10, previousClose: 4.10,
    marketCap: 23000000000, updatedAt: new Date().toISOString()
  },
  'IBE.MC': {
    symbol: 'IBE.MC', name: 'Iberdrola', isin: 'ES0144580Y14',
    exchange: 'BME', currency: 'EUR', price: 12.45, change: 0.22, changePercent: 1.80,
    volume: 12000000, high: 12.52, low: 12.20, open: 12.23, previousClose: 12.23,
    marketCap: 80000000000, updatedAt: new Date().toISOString()
  },
  'AAPL': {
    symbol: 'AAPL', name: 'Apple Inc.', isin: 'US0378331005',
    exchange: 'NASDAQ', currency: 'USD', price: 195.50, change: 2.30, changePercent: 1.19,
    volume: 55000000, high: 196.20, low: 193.80, open: 194.00, previousClose: 193.20,
    marketCap: 3000000000000, updatedAt: new Date().toISOString()
  },
  'MSFT': {
    symbol: 'MSFT', name: 'Microsoft Corporation', isin: 'US5949181045',
    exchange: 'NASDAQ', currency: 'USD', price: 415.20, change: 5.80, changePercent: 1.42,
    volume: 22000000, high: 417.50, low: 410.00, open: 411.00, previousClose: 409.40,
    marketCap: 3100000000000, updatedAt: new Date().toISOString()
  },
  'GOOGL': {
    symbol: 'GOOGL', name: 'Alphabet Inc.', isin: 'US02079K3059',
    exchange: 'NASDAQ', currency: 'USD', price: 175.80, change: 1.20, changePercent: 0.69,
    volume: 18000000, high: 176.50, low: 174.20, open: 175.00, previousClose: 174.60,
    marketCap: 2200000000000, updatedAt: new Date().toISOString()
  },
};

// Search stocks by symbol or name
function searchStocks(query: string): StockQuote[] {
  const normalizedQuery = query.toLowerCase();
  return Object.values(DEMO_STOCKS).filter(stock => 
    stock.symbol.toLowerCase().includes(normalizedQuery) ||
    stock.name.toLowerCase().includes(normalizedQuery) ||
    (stock.isin && stock.isin.toLowerCase().includes(normalizedQuery))
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, query, company_id } = await req.json();
    
    console.log(`[erp-stock-quotes] Action: ${action}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'get_quotes': {
        if (!symbols || !Array.isArray(symbols)) {
          throw new Error('symbols array is required');
        }
        
        const quotes = symbols
          .map(symbol => DEMO_STOCKS[symbol.toUpperCase()])
          .filter(Boolean);
        
        return new Response(JSON.stringify({
          success: true,
          data: quotes
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'search': {
        if (!query) {
          throw new Error('query is required for search');
        }
        
        const results = searchStocks(query);
        
        return new Response(JSON.stringify({
          success: true,
          data: results
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_watchlist': {
        if (!company_id) {
          throw new Error('company_id is required');
        }
        
        // Fetch watchlist symbols
        const { data: watchlist, error: fetchError } = await supabase
          .from('erp_market_stock_watchlist')
          .select('symbol')
          .eq('company_id', company_id)
          .eq('is_active', true);
        
        if (fetchError) throw fetchError;
        
        if (!watchlist || watchlist.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            data: [],
            message: 'No stocks in watchlist'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Get quotes for watchlist
        const quotes = watchlist
          .map(w => DEMO_STOCKS[w.symbol.toUpperCase()])
          .filter(Boolean);
        
        // Update watchlist with latest prices
        for (const quote of quotes) {
          await supabase
            .from('erp_market_stock_watchlist')
            .update({
              last_price: quote.price,
              price_change: quote.change,
              price_change_pct: quote.changePercent,
              day_high: quote.high,
              day_low: quote.low,
              volume: quote.volume,
              market_cap: quote.marketCap,
              price_updated_at: new Date().toISOString()
            })
            .eq('company_id', company_id)
            .eq('symbol', quote.symbol);
        }
        
        return new Response(JSON.stringify({
          success: true,
          data: quotes,
          updated_count: quotes.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_market_summary': {
        // Get major indices summary
        const indices = [
          { symbol: 'IBEX35', name: 'IBEX 35', value: 11250.50, change: 85.20, changePercent: 0.76, currency: 'EUR' },
          { symbol: 'DAX', name: 'DAX 40', value: 19450.30, change: 120.50, changePercent: 0.62, currency: 'EUR' },
          { symbol: 'SP500', name: 'S&P 500', value: 5850.20, change: 45.80, changePercent: 0.79, currency: 'USD' },
          { symbol: 'NASDAQ', name: 'NASDAQ 100', value: 20550.80, change: 180.30, changePercent: 0.89, currency: 'USD' },
          { symbol: 'FTSE', name: 'FTSE 100', value: 8250.40, change: -15.20, changePercent: -0.18, currency: 'GBP' },
        ];
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            indices,
            updatedAt: new Date().toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[erp-stock-quotes] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
