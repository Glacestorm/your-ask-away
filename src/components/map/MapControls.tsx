import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapFilters, StatusColor } from '@/types/database';
import { Layers, Box } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MapControlsProps {
  statusColors: StatusColor[];
  filters: MapFilters;
  onFiltersChange: (filters: MapFilters) => void;
}

export function MapControls({
  statusColors,
  filters,
  onFiltersChange,
}: MapControlsProps) {
  const [showLegend, setShowLegend] = useState(false);
  const [view3D, setView3D] = useState(false);

  return (
    <>
      {/* Legend Toggle */}
      <div className="absolute right-4 top-4 z-[1] flex flex-col gap-2">
        <Card className="overflow-hidden shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowLegend(!showLegend)}
            title="Mostrar leyenda"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </Card>

        <Card className="overflow-hidden shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView3D(!view3D)}
            title="Vista 3D"
            className={cn(view3D && 'bg-accent')}
          >
            <Box className="h-4 w-4" />
          </Button>
        </Card>
      </div>

      {/* Legend Panel */}
      {showLegend && (
        <Card className="absolute right-4 top-24 z-[1] w-64 p-4 shadow-lg">
          <h3 className="mb-3 font-semibold">Leyenda</h3>
          <div className="space-y-2">
            {statusColors
              .sort((a, b) => a.display_order - b.display_order)
              .map((status) => (
                <div key={status.id} className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: status.color_hex }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{status.status_name}</p>
                    {status.description && (
                      <p className="text-xs text-muted-foreground">
                        {status.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </>
  );
}
