import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  address: string;
  parroquia?: string;
}

interface GeocodeResponse {
  latitude: number | null;
  longitude: number | null;
  error?: string;
}

const RATE_LIMIT_REQUESTS = 100; // requests per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function checkRateLimit(supabase: any, userId: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Get current request count
  const { data, error } = await supabase
    .from('geocode_rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .gte('window_start', windowStart)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Rate limit check error:', error);
    return true; // Allow on error
  }
  
  if (data && data.request_count >= RATE_LIMIT_REQUESTS) {
    return false; // Rate limited
  }
  
  // Upsert rate limit record
  const { error: upsertError } = await supabase
    .from('geocode_rate_limits')
    .upsert({
      user_id: userId,
      request_count: (data?.request_count || 0) + 1,
      window_start: data ? undefined : new Date().toISOString()
    }, { onConflict: 'user_id' });
  
  if (upsertError) {
    console.error('Rate limit upsert error:', upsertError);
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }
    
    // Check rate limit
    const allowed = await checkRateLimit(supabase, userId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ 
          latitude: null, 
          longitude: null, 
          error: 'Rate limit exceeded. Please try again later.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }
    
    const { address, parroquia }: GeocodeRequest = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ latitude: null, longitude: null, error: 'Address is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Construir query de búsqueda incluyendo parroquia si está disponible
    const searchQuery = parroquia 
      ? `${address}, ${parroquia}, Andorra`
      : `${address}, Andorra`;

    // Usar Nominatim de OpenStreetMap (gratuito)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'GestorApp/1.0' // Nominatim requiere User-Agent
      }
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return new Response(
        JSON.stringify({ 
          latitude: null, 
          longitude: null, 
          error: 'Geocoding service unavailable' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const result: GeocodeResponse = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // Si no se encuentra, intentar solo con Andorra para obtener coordenadas por defecto
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=Andorra&limit=1`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': 'GestorApp/1.0'
        }
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          return new Response(
            JSON.stringify({
              latitude: parseFloat(fallbackData[0].lat),
              longitude: parseFloat(fallbackData[0].lon),
              error: 'Address not found, using default Andorra coordinates'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          latitude: null, 
          longitude: null, 
          error: 'Address not found' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ 
        latitude: null, 
        longitude: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
