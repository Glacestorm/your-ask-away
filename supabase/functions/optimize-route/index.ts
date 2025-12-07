import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteRequest {
  origin: { latitude: number; longitude: number };
  waypoints: Waypoint[];
  optimize: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_DIRECTIONS_API_KEY');
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_DIRECTIONS_API_KEY not configured');
    }

    const { origin, waypoints, optimize = true }: RouteRequest = await req.json();

    if (!origin || !waypoints || waypoints.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Origin and at least one waypoint are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Optimizing route with ${waypoints.length} waypoints`);

    // Build the Google Directions API URL
    const originStr = `${origin.latitude},${origin.longitude}`;
    
    // If only one waypoint, it becomes the destination
    // If multiple waypoints, all but the last are intermediate waypoints
    let waypointsStr = '';
    let destination = '';

    if (waypoints.length === 1) {
      destination = `${waypoints[0].latitude},${waypoints[0].longitude}`;
    } else {
      // Use last waypoint as destination, rest as intermediate
      const intermediateWaypoints = waypoints.slice(0, -1);
      const lastWaypoint = waypoints[waypoints.length - 1];
      
      destination = `${lastWaypoint.latitude},${lastWaypoint.longitude}`;
      
      if (intermediateWaypoints.length > 0) {
        const waypointCoords = intermediateWaypoints.map(w => `${w.latitude},${w.longitude}`);
        waypointsStr = optimize 
          ? `optimize:true|${waypointCoords.join('|')}`
          : waypointCoords.join('|');
      }
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin: originStr,
      destination: destination,
      key: GOOGLE_API_KEY,
      mode: 'driving',
      language: 'es',
      units: 'metric',
    });

    if (waypointsStr) {
      params.append('waypoints', waypointsStr);
    }

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Calling Google Directions API...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: `Google Directions API error: ${data.status}`,
          message: data.error_message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the optimized route information
    const route = data.routes[0];
    const legs = route.legs;

    // Calculate total distance and duration
    let totalDistance = 0;
    let totalDuration = 0;
    const segments: any[] = [];

    legs.forEach((leg: any, index: number) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;
      
      segments.push({
        start_address: leg.start_address,
        end_address: leg.end_address,
        distance: leg.distance,
        duration: leg.duration,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance,
          duration: step.duration,
          maneuver: step.maneuver,
        })),
      });
    });

    // Get optimized waypoint order if optimization was requested
    let optimizedOrder: number[] = [];
    if (optimize && route.waypoint_order) {
      optimizedOrder = route.waypoint_order;
    }

    // Reorder waypoints based on optimized order
    const orderedWaypoints = optimize && optimizedOrder.length > 0
      ? optimizedOrder.map(i => waypoints[i])
      : waypoints;

    // Decode the overview polyline for map display
    const overviewPolyline = route.overview_polyline.points;

    const result = {
      success: true,
      route: {
        total_distance: {
          value: totalDistance,
          text: `${(totalDistance / 1000).toFixed(1)} km`,
        },
        total_duration: {
          value: totalDuration,
          text: formatDuration(totalDuration),
        },
        optimized_order: orderedWaypoints.map((w, i) => ({
          order: i + 1,
          id: w.id,
          name: w.name,
          latitude: w.latitude,
          longitude: w.longitude,
        })),
        segments,
        polyline: overviewPolyline,
        bounds: route.bounds,
      },
    };

    console.log(`Route optimized: ${result.route.total_distance.text}, ${result.route.total_duration.text}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error optimizing route:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}
