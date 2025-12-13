import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StaticMapRequest {
  center?: { latitude: number; longitude: number };
  zoom?: number;
  width?: number;
  height?: number;
  style?: 'streets-v12' | 'outdoors-v12' | 'light-v11' | 'dark-v11' | 'satellite-v9' | 'satellite-streets-v12';
  markers?: Array<{
    latitude: number;
    longitude: number;
    color?: string;
    label?: string;
    size?: 's' | 'l';
  }>;
  path?: Array<{ latitude: number; longitude: number }>;
  pathColor?: string;
  pathWidth?: number;
  bearing?: number;
  pitch?: number;
  padding?: number;
  retina?: boolean;
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
      center,
      zoom = 12,
      width = 600,
      height = 400,
      style = 'streets-v12',
      markers = [],
      path = [],
      pathColor = '0066ff',
      pathWidth = 3,
      bearing = 0,
      pitch = 0,
      padding = 0,
      retina = true
    }: StaticMapRequest = await req.json();

    // Validate dimensions
    if (width > 1280 || height > 1280) {
      return new Response(
        JSON.stringify({ error: 'Maximum dimensions are 1280x1280' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating static map: ${width}x${height}, style: ${style}`);

    // Build overlay string
    let overlays: string[] = [];

    // Add markers
    for (const marker of markers) {
      const color = marker.color || 'ff0000';
      const label = marker.label || '';
      const size = marker.size || 's';
      overlays.push(`pin-${size}-${label}+${color}(${marker.longitude},${marker.latitude})`);
    }

    // Add path/polyline
    if (path.length >= 2) {
      const pathCoords = path.map(p => `[${p.longitude},${p.latitude}]`).join(',');
      overlays.push(`path-${pathWidth}+${pathColor}(${encodeURIComponent(`{${pathCoords}}`)}`);
    }

    // Build URL
    let url: string;
    const retinaFlag = retina ? '@2x' : '';

    if (overlays.length > 0 && !center) {
      // Auto-fit to overlays
      const overlayString = overlays.join(',');
      url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlayString}/auto/${width}x${height}${retinaFlag}?padding=${padding}&access_token=${MAPBOX_TOKEN}`;
    } else if (center) {
      // Use specified center
      const overlayString = overlays.length > 0 ? overlays.join(',') + '/' : '';
      url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${overlayString}${center.longitude},${center.latitude},${zoom},${bearing},${pitch}/${width}x${height}${retinaFlag}?access_token=${MAPBOX_TOKEN}`;
    } else {
      return new Response(
        JSON.stringify({ error: 'Either center or markers/path must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Static map URL generated');

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox Static API error:', errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    // Return the image as base64 or the URL
    const imageBuffer = await response.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const result = {
      success: true,
      width: retina ? width * 2 : width,
      height: retina ? height * 2 : height,
      style,
      image_url: url,
      image_base64: `data:image/png;base64,${base64Image}`,
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating static map:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
