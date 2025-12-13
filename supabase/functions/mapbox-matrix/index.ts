import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MatrixRequest {
  origins: Array<{ latitude: number; longitude: number; name?: string }>;
  destinations?: Array<{ latitude: number; longitude: number; name?: string }>;
  profile?: 'driving' | 'walking' | 'cycling';
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
      origins, 
      destinations,
      profile = 'driving'
    }: MatrixRequest = await req.json();

    if (!origins || origins.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one origin is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no destinations, use origins as both sources and destinations (symmetric matrix)
    const dests = destinations || origins;
    
    // Mapbox Matrix API limit is 25 coordinates total
    const totalCoords = origins.length + dests.length;
    if (totalCoords > 25) {
      return new Response(
        JSON.stringify({ error: 'Maximum 25 total coordinates allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating matrix: ${origins.length} origins x ${dests.length} destinations`);

    // Build coordinates string
    const allCoords = [...origins, ...dests];
    const coordsString = allCoords.map(c => `${c.longitude},${c.latitude}`).join(';');
    
    // Build sources and destinations indices
    const sourcesIndices = origins.map((_, i) => i).join(';');
    const destsIndices = dests.map((_, i) => i + origins.length).join(';');

    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/${profile}/${coordsString}?sources=${sourcesIndices}&destinations=${destsIndices}&annotations=duration,distance&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox Matrix API error:', errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok') {
      throw new Error(`Matrix calculation failed: ${data.code}`);
    }

    // Format the response into a more usable structure
    const matrix: any[][] = [];
    
    for (let i = 0; i < origins.length; i++) {
      const row: any[] = [];
      for (let j = 0; j < dests.length; j++) {
        const duration = data.durations[i][j];
        const distance = data.distances[i][j];
        
        row.push({
          from: origins[i].name || `Origin ${i + 1}`,
          to: dests[j].name || `Destination ${j + 1}`,
          duration_seconds: duration,
          duration_text: formatDuration(duration),
          distance_meters: distance,
          distance_text: formatDistance(distance),
        });
      }
      matrix.push(row);
    }

    const result = {
      success: true,
      profile,
      origins_count: origins.length,
      destinations_count: dests.length,
      matrix,
      summary: {
        min_duration: Math.min(...data.durations.flat().filter((d: number) => d !== null)),
        max_duration: Math.max(...data.durations.flat().filter((d: number) => d !== null)),
        min_distance: Math.min(...data.distances.flat().filter((d: number) => d !== null)),
        max_distance: Math.max(...data.distances.flat().filter((d: number) => d !== null)),
      }
    };

    console.log(`Matrix calculated: ${origins.length}x${dests.length}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating matrix:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatDuration(seconds: number): string {
  if (seconds === null) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  if (meters === null) return 'N/A';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
