import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Layers } from 'lucide-react';
import { useState } from 'react';

export interface MapBaseLayers {
  roads: boolean;
  water: boolean;
  terrain: boolean;
  buildings: boolean;
  labels: boolean;
}

interface MapBaseLayersControlProps {
  layers: MapBaseLayers;
  onLayersChange: (layers: MapBaseLayers) => void;
}

export function MapBaseLayersControl({ layers, onLayersChange }: MapBaseLayersControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleLayerToggle = (layer: keyof MapBaseLayers) => {
    onLayersChange({
      ...layers,
      [layer]: !layers[layer],
    });
  };

  const layerLabels: Record<keyof MapBaseLayers, string> = {
    roads: 'Carreteras y calles',
    water: 'Ríos y lagos',
    terrain: 'Terreno y relieve',
    buildings: 'Edificios',
    labels: 'Etiquetas de lugares',
  };

  return (
    <div className="absolute left-4 bottom-6 z-10">
      {!isOpen ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-card shadow-lg hover:bg-accent"
        >
          <Layers className="mr-2 h-4 w-4" />
          Capas base
        </Button>
      ) : (
        <Card className="w-64 shadow-lg">
          <div className="border-b p-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Capas base del mapa</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          </div>

          <div className="space-y-3 p-3">
            {(Object.keys(layers) as Array<keyof MapBaseLayers>).map((layer) => (
              <div key={layer} className="flex items-center space-x-2">
                <Checkbox
                  id={`layer-${layer}`}
                  checked={layers[layer]}
                  onCheckedChange={() => handleLayerToggle(layer)}
                />
                <Label
                  htmlFor={`layer-${layer}`}
                  className="flex-1 cursor-pointer text-sm font-normal"
                >
                  {layerLabels[layer]}
                </Label>
              </div>
            ))}
          </div>

          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onLayersChange({
                  roads: true,
                  water: true,
                  terrain: true,
                  buildings: true,
                  labels: true,
                })
              }
              className="w-full"
            >
              Mostrar todas
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
