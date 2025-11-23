import { Button } from '@/components/ui/button';
import { Layers, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapStyleToggleProps {
  mapStyle: 'default' | 'satellite';
  view3D: boolean;
  onMapStyleChange: (style: 'default' | 'satellite') => void;
  onView3DChange: (enabled: boolean) => void;
}

export function MapStyleToggle({
  mapStyle,
  view3D,
  onMapStyleChange,
  onView3DChange,
}: MapStyleToggleProps) {
  return (
    <div className="absolute left-4 top-16 z-10 flex gap-2">
      <div className="flex gap-1 rounded-lg border bg-card p-1 shadow-lg">
        <Button
          variant={mapStyle === 'default' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMapStyleChange('default')}
          className="h-8 px-3"
        >
          Mapa
        </Button>
        <Button
          variant={mapStyle === 'satellite' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onMapStyleChange('satellite')}
          className="h-8 px-3"
        >
          Satélite
        </Button>
      </div>
      
      <Button
        variant={view3D ? 'default' : 'outline'}
        size="sm"
        onClick={() => onView3DChange(!view3D)}
        className="h-8 rounded-lg border bg-card shadow-lg"
      >
        <Mountain className="mr-2 h-4 w-4" />
        Vista 3D
      </Button>
    </div>
  );
}
