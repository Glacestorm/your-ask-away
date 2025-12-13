import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IsochroneRequest {
  latitude: number;
  longitude: number;
  profile?: 'driving' | 'walking' | 'cycling';
  contours_minutes?: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!MAPBOX_TOKEN) {
      throw new Error('MAPBOX_ACCESS_TOKEN not configured');
    }

    const { 
      latitude, 
      longitude, 
      profile = 'driving',
      contours_minutes = [5, 10, 15] 
    }: IsochroneRequest = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating isochrone for ${latitude},${longitude} with profile ${profile}`);

    const contoursParam = contours_minutes.join(',');
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${longitude},${latitude}?contours_minutes=${contoursParam}&polygons=true&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox Isochrone API error:', errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    // Add metadata to the response
    const result = {
      success: true,
      center: { latitude, longitude },
      profile,
      contours_minutes,
      geojson: data,
      features: data.features?.map((feature: any, index: number) => ({
        minutes: contours_minutes[index],
        area_km2: calculatePolygonArea(feature.geometry.coordinates[0]),
        color: getIsochroneColor(index),
      })) || []
    };

    console.log(`Isochrone calculated: ${contours_minutes.length} contours`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating isochrone:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to calculate approximate polygon area in km²
function calculatePolygonArea(coordinates: number[][]): number {
  if (!coordinates || coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    area += (lon2 - lon1) * (lat1 + lat2);
  }
  
  // Convert to approximate km² (rough estimation)
  return Math.abs(area) * 111 * 111 / 2;
}

// Helper function to get color for isochrone contour
function getIsochroneColor(index: number): string {
  const colors = ['#00ff00', '#ffff00', '#ff9900', '#ff0000', '#990000'];
  return colors[index % colors.length];
}
