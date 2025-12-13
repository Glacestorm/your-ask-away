import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const z = url.searchParams.get('z');
    const x = url.searchParams.get('x');
    const y = url.searchParams.get('y');
    const style = url.searchParams.get('style') || 'default';

    if (!z || !x || !y) {
      return new Response(
        JSON.stringify({ error: 'Missing z, x, y parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Choose tile source based on style
    let tileUrl: string;
    if (style === 'satellite') {
      tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    } else {
      // Use OpenStreetMap tiles
      tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }

    console.log(`Fetching tile: ${tileUrl}`);

    // Fetch the tile from the external source
    const tileResponse = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'ObelixIA-Map/1.0',
        'Accept': 'image/png,image/*',
      },
    });

    if (!tileResponse.ok) {
      console.error(`Tile fetch failed: ${tileResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Tile fetch failed: ${tileResponse.status}` }),
        { status: tileResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the tile data as ArrayBuffer
    const tileData = await tileResponse.arrayBuffer();

    // Return the tile with proper headers
    return new Response(tileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Proxy error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
