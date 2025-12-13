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
  profile?: 'driving' | 'driving-traffic' | 'walking' | 'cycling';
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

    const { origin, waypoints, optimize = true, profile = 'driving' }: RouteRequest = await req.json();

    if (!origin || !waypoints || waypoints.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Origin and at least one waypoint are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Calculating Mapbox route with ${waypoints.length} waypoints, profile: ${profile}`);

    // Build coordinates string: origin + all waypoints
    const allPoints = [
      { ...origin, id: 'origin', name: 'Tu ubicación' },
      ...waypoints
    ];
    
    const coordinates = allPoints.map(p => `${p.longitude},${p.latitude}`).join(';');

    // Mapbox Directions API - always use standard Directions API for driving-traffic
    // Optimization API doesn't support driving-traffic profile
    const useOptimization = optimize && waypoints.length > 1 && profile !== 'driving-traffic';
    
    // Base params for both APIs
    const baseParams = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      geometries: 'geojson',
      language: 'es',
      overview: 'full',
      steps: 'true',
    });

    // Build URL based on API type
    let url: string;
    let isOptimizationAPI = false;

    if (useOptimization) {
      // Use Mapbox Optimization API for route optimization (no driving-traffic)
      isOptimizationAPI = true;
      const mapboxProfile = `mapbox/${profile}`;
      url = `https://api.mapbox.com/optimized-trips/v1/${mapboxProfile}/${coordinates}?${baseParams.toString()}&source=first&roundtrip=false`;
    } else {
      // Use standard Directions API (supports driving-traffic)
      const mapboxProfile = profile === 'driving-traffic' ? 'mapbox/driving-traffic' : `mapbox/${profile}`;
      baseParams.append('alternatives', 'false');
      baseParams.append('annotations', 'distance,duration,speed');
      baseParams.append('voice_instructions', 'true');
      baseParams.append('banner_instructions', 'true');
      url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${coordinates}?${baseParams.toString()}`;
      // Use standard Directions API with additional params
      baseParams.append('alternatives', 'false');
      baseParams.append('annotations', 'distance,duration,speed');
      baseParams.append('voice_instructions', 'true');
      baseParams.append('banner_instructions', 'true');
      url = `https://api.mapbox.com/directions/v5/${mapboxProfile}/${coordinates}?${baseParams.toString()}`;
    }

    console.log('Calling Mapbox API...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok') {
      console.error('Mapbox API error:', data.code, data.message);
      return new Response(
        JSON.stringify({ 
          error: `Mapbox API error: ${data.code}`,
          message: data.message 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract route data
    const route = isOptimizationAPI ? data.trips[0] : data.routes[0];
    const legs = route.legs;

    // Get waypoint order for optimization
    let orderedWaypoints: Waypoint[] = [...waypoints];
    
    if (isOptimizationAPI && data.waypoints) {
      // Mapbox returns waypoints in optimized order
      // Skip first (origin) and map to our waypoints
      const waypointOrder = data.waypoints.slice(1).map((wp: any) => wp.waypoint_index - 1);
      orderedWaypoints = waypointOrder.map((idx: number) => waypoints[idx]);
    }

    // Calculate segments
    const segments = legs.map((leg: any, index: number) => {
      const steps = leg.steps.map((step: any) => ({
        instruction: step.maneuver.instruction || '',
        distance: { 
          value: Math.round(step.distance), 
          text: formatDistance(step.distance) 
        },
        duration: { 
          value: Math.round(step.duration), 
          text: formatDuration(step.duration) 
        },
        maneuver: step.maneuver.type,
        modifier: step.maneuver.modifier,
        name: step.name || '',
        bearing_before: step.maneuver.bearing_before,
        bearing_after: step.maneuver.bearing_after,
      }));

      return {
        start_address: index === 0 ? 'Tu ubicación' : orderedWaypoints[index - 1]?.name || '',
        end_address: orderedWaypoints[index]?.name || '',
        distance: { 
          value: Math.round(leg.distance), 
          text: formatDistance(leg.distance) 
        },
        duration: { 
          value: Math.round(leg.duration), 
          text: formatDuration(leg.duration) 
        },
        steps,
      };
    });

    // Extract geometry for polyline display
    const geometry = route.geometry;
    
    // Calculate bounds from geometry
    const coords = geometry.coordinates;
    let minLng = coords[0][0], maxLng = coords[0][0];
    let minLat = coords[0][1], maxLat = coords[0][1];
    
    coords.forEach((coord: number[]) => {
      minLng = Math.min(minLng, coord[0]);
      maxLng = Math.max(maxLng, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });

    const result = {
      success: true,
      provider: 'mapbox',
      route: {
        total_distance: {
          value: Math.round(route.distance),
          text: formatDistance(route.distance),
        },
        total_duration: {
          value: Math.round(route.duration),
          text: formatDuration(route.duration),
        },
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
          name: 'Tu ubicación',
        },
        optimized_order: orderedWaypoints.map((w, i) => ({
          order: i + 1,
          id: w.id,
          name: w.name,
          latitude: w.latitude,
          longitude: w.longitude,
        })),
        segments,
        geometry: geometry, // GeoJSON format for Mapbox GL
        polyline: null, // We use GeoJSON instead of encoded polyline
        bounds: {
          northeast: { lat: maxLat, lng: maxLng },
          southwest: { lat: minLat, lng: minLng },
        },
        // Additional Mapbox-specific info
        weight: route.weight,
        weight_name: route.weight_name,
      },
    };

    console.log(`Route calculated: ${result.route.total_distance.text}, ${result.route.total_duration.text}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error calculating Mapbox route:', errorMessage);
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

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
