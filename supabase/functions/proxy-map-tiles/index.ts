import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

serve(async (req) => {
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

    const apiKey = Deno.env.get('MAPTILER_API_KEY');
    if (!apiKey) {
      console.error('MAPTILER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'MapTiler API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MapTiler tile URLs
    let tileUrl: string;
    if (style === 'satellite') {
      tileUrl = `https://api.maptiler.com/tiles/satellite-v2/${z}/${x}/${y}.jpg?key=${apiKey}`;
    } else {
      tileUrl = `https://api.maptiler.com/maps/streets-v2/${z}/${x}/${y}.png?key=${apiKey}`;
    }

    console.log(`Fetching MapTiler tile: ${z}/${x}/${y} style=${style}`);

    const tileResponse = await fetch(tileUrl, {
      headers: {
        'User-Agent': 'ObelixIA-Map/1.0',
        'Accept': 'image/*',
      },
    });

    if (!tileResponse.ok) {
      console.error(`MapTiler fetch failed: ${tileResponse.status}`);
      return new Response(
        JSON.stringify({ error: `Tile fetch failed: ${tileResponse.status}` }),
        { status: tileResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tileData = await tileResponse.arrayBuffer();
    const contentType = style === 'satellite' ? 'image/jpeg' : 'image/png';

    return new Response(tileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
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
