import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ElevationRequest {
  coordinates: Array<{ latitude: number; longitude: number }>;
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

    const { coordinates }: ElevationRequest = await req.json();

    if (!coordinates || coordinates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one coordinate is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (coordinates.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Maximum 50 coordinates allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Getting elevation for ${coordinates.length} points`);

    // Mapbox Tilequery API for elevation data
    const results = await Promise.all(
      coordinates.map(async (coord) => {
        const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coord.longitude},${coord.latitude}.json?layers=contour&access_token=${MAPBOX_TOKEN}`;
        
        try {
          const response = await fetch(url);
          if (!response.ok) {
            return { ...coord, elevation: null, error: 'Failed to fetch elevation' };
          }
          
          const data = await response.json();
          
          // Get elevation from contour data
          let elevation = null;
          if (data.features && data.features.length > 0) {
            // Find the closest contour
            const contours = data.features
              .filter((f: any) => f.properties.ele !== undefined)
              .sort((a: any, b: any) => 
                Math.abs(a.properties.tilequery.distance) - Math.abs(b.properties.tilequery.distance)
              );
            
            if (contours.length > 0) {
              elevation = contours[0].properties.ele;
            }
          }
          
          return {
            latitude: coord.latitude,
            longitude: coord.longitude,
            elevation,
          };
        } catch (err) {
          return { ...coord, elevation: null, error: 'Query failed' };
        }
      })
    );

    const validResults = results.filter(r => r.elevation !== null);
    
    const result = {
      success: true,
      count: coordinates.length,
      elevations: results,
      statistics: validResults.length > 0 ? {
        min_elevation: Math.min(...validResults.map(r => r.elevation!)),
        max_elevation: Math.max(...validResults.map(r => r.elevation!)),
        avg_elevation: validResults.reduce((sum, r) => sum + r.elevation!, 0) / validResults.length,
        elevation_gain: calculateElevationGain(results),
      } : null
    };

    console.log(`Elevation data retrieved for ${validResults.length}/${coordinates.length} points`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting elevation:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateElevationGain(results: any[]): number {
  let gain = 0;
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1].elevation;
    const curr = results[i].elevation;
    if (prev !== null && curr !== null && curr > prev) {
      gain += curr - prev;
    }
  }
  return gain;
}
