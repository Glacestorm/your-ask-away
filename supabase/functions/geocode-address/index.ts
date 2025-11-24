import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
