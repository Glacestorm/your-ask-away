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
    <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 shadow-lg">
        <Button
          variant={mapStyle === 'default' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMapStyleChange('default')}
          className="justify-start"
        >
          <Layers className="mr-2 h-4 w-4" />
          Mapa
        </Button>
        <Button
          variant={mapStyle === 'satellite' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onMapStyleChange('satellite')}
          className="justify-start"
        >
          <Layers className="mr-2 h-4 w-4" />
          Satélite
        </Button>
      </div>
      
      <Button
        variant={view3D ? 'default' : 'outline'}
        size="sm"
        onClick={() => onView3DChange(!view3D)}
        className={cn('rounded-lg border bg-card shadow-lg', view3D && 'bg-primary text-primary-foreground')}
      >
        <Mountain className="mr-2 h-4 w-4" />
        Vista 3D
      </Button>
    </div>
  );
}
