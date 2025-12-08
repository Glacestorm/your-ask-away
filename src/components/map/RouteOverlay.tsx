import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';

interface RouteWaypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface RouteOverlayProps {
  map: maplibregl.Map | null;
  polyline: string | null;
  waypoints: RouteWaypoint[];
}

// Decode Google's encoded polyline
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push([lng / 1e5, lat / 1e5]);
  }

  return coords;
}

export function RouteOverlay({ map, polyline, waypoints }: RouteOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markersRef = useRef<HTMLDivElement[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Create/update canvas overlay
  const updateCanvas = useCallback(() => {
    if (!map || !polyline || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get map container dimensions
    const container = map.getContainer();
    const rect = container.getBoundingClientRect();
    
    // Set canvas size to match map
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Decode and draw polyline
    const coords = decodePolyline(polyline);
    if (coords.length < 2) return;

    // Convert coordinates to pixels
    const pixelCoords = coords.map(([lng, lat]) => {
      const point = map.project([lng, lat]);
      return { x: point.x, y: point.y };
    });

    // Draw outline (dark border)
    ctx.beginPath();
    ctx.moveTo(pixelCoords[0].x, pixelCoords[0].y);
    for (let i = 1; i < pixelCoords.length; i++) {
      ctx.lineTo(pixelCoords[i].x, pixelCoords[i].y);
    }
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw main route line (blue)
    ctx.beginPath();
    ctx.moveTo(pixelCoords[0].x, pixelCoords[0].y);
    for (let i = 1; i < pixelCoords.length; i++) {
      ctx.lineTo(pixelCoords[i].x, pixelCoords[i].y);
    }
    ctx.strokeStyle = '#4285F4';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, [map, polyline]);

  // Update waypoint markers positions
  const updateMarkers = useCallback(() => {
    if (!map || !containerRef.current) return;

    markersRef.current.forEach((marker, index) => {
      const waypoint = waypoints[index];
      if (!waypoint) return;

      const point = map.project([waypoint.longitude, waypoint.latitude]);
      marker.style.transform = `translate(${point.x - 20}px, ${point.y - 20}px)`;
    });
  }, [map, waypoints]);

  // Initialize overlay
  useEffect(() => {
    if (!map) return;

    // Wait for map to be ready
    const checkReady = () => {
      if (map.isStyleLoaded()) {
        setIsReady(true);
      }
    };

    if (map.isStyleLoaded()) {
      setIsReady(true);
    } else {
      map.once('load', checkReady);
    }

    return () => {
      map.off('load', checkReady);
    };
  }, [map]);

  // Create container and canvas
  useEffect(() => {
    if (!map || !isReady) return;

    const mapContainer = map.getContainer();
    
    // Create overlay container
    const container = document.createElement('div');
    container.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100;';
    containerRef.current = container;
    mapContainer.appendChild(container);

    // Create canvas for route line
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
    canvasRef.current = canvas;
    container.appendChild(canvas);

    return () => {
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
      canvasRef.current = null;
    };
  }, [map, isReady]);

  // Create waypoint markers
  useEffect(() => {
    if (!map || !isReady || !containerRef.current || waypoints.length === 0) {
      // Clean up existing markers
      markersRef.current.forEach(m => {
        if (m.parentNode) m.parentNode.removeChild(m);
      });
      markersRef.current = [];
      return;
    }

    // Remove old markers
    markersRef.current.forEach(m => {
      if (m.parentNode) m.parentNode.removeChild(m);
    });
    markersRef.current = [];

    // Create new markers
    const waypointCount = waypoints.length;
    waypoints.forEach((waypoint, index) => {
      const isFirst = index === 0;
      const isLast = index === waypointCount - 1;
      
      let label: string;
      if (isFirst) {
        label = 'A';
      } else if (isLast && waypointCount > 1) {
        label = 'B';
      } else {
        label = String(index);
      }
      
      let bgColor: string;
      if (isFirst) {
        bgColor = '#00C853';
      } else if (isLast && waypointCount > 1) {
        bgColor = '#F44336';
      } else {
        bgColor = '#FF9800';
      }

      const marker = document.createElement('div');
      marker.style.cssText = `
        position: absolute;
        width: 40px;
        height: 40px;
        pointer-events: auto;
        cursor: pointer;
        z-index: 200;
      `;
      marker.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: ${bgColor};
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
        " title="${waypoint.name}">${label}</div>
      `;
      
      containerRef.current?.appendChild(marker);
      markersRef.current.push(marker);
    });

    // Initial position update
    updateMarkers();
  }, [map, isReady, waypoints, updateMarkers]);

  // Update on map move/zoom
  useEffect(() => {
    if (!map || !isReady) return;

    const handleMapChange = () => {
      updateCanvas();
      updateMarkers();
    };

    map.on('move', handleMapChange);
    map.on('zoom', handleMapChange);
    map.on('resize', handleMapChange);

    // Initial draw
    if (polyline) {
      setTimeout(() => {
        updateCanvas();
        updateMarkers();
      }, 100);
    }

    return () => {
      map.off('move', handleMapChange);
      map.off('zoom', handleMapChange);
      map.off('resize', handleMapChange);
    };
  }, [map, isReady, polyline, updateCanvas, updateMarkers]);

  // Trigger redraw when polyline changes
  useEffect(() => {
    if (polyline && isReady) {
      updateCanvas();
    }
  }, [polyline, isReady, updateCanvas]);

  // Fit bounds when route is set
  useEffect(() => {
    if (!map || !polyline || !isReady || waypoints.length === 0) return;

    const coords = decodePolyline(polyline);
    if (coords.length < 2) return;

    const allLngs = [...waypoints.map(w => w.longitude), ...coords.map(c => c[0])];
    const allLats = [...waypoints.map(w => w.latitude), ...coords.map(c => c[1])];

    const bounds = new maplibregl.LngLatBounds(
      [Math.min(...allLngs), Math.min(...allLats)],
      [Math.max(...allLngs), Math.max(...allLats)]
    );

    map.fitBounds(bounds, {
      padding: { top: 80, bottom: 80, left: 80, right: 420 },
      duration: 1000
    });
  }, [map, polyline, waypoints, isReady]);

  return null; // This component manages DOM directly
}
