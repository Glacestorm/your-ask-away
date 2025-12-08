import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Flame, Eye, EyeOff, Settings2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CompanyWithDetails } from '@/types/database';

interface OpportunityHeatmapProps {
  companies: CompanyWithDetails[];
  onHeatmapDataChange: (data: HeatmapPoint[] | null) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  category: 'high' | 'medium' | 'low';
}

type OpportunityMetric = 'vinculacion' | 'facturacion' | 'potential' | 'combined';

export function OpportunityHeatmap({
  companies,
  onHeatmapDataChange,
  isEnabled,
  onToggle,
}: OpportunityHeatmapProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [metric, setMetric] = useState<OpportunityMetric>('combined');
  const [radius, setRadius] = useState([25]);
  const [opacity, setOpacity] = useState([0.6]);

  const calculateOpportunityScore = (company: CompanyWithDetails): number => {
    let score = 0;
    
    switch (metric) {
      case 'vinculacion':
        // Lower vinculacion = higher opportunity (room to grow)
        const vinc1 = company.vinculacion_entidad_1 || 0;
        score = 100 - vinc1;
        break;
      case 'facturacion':
        // Higher turnover = higher value opportunity
        const fact = company.turnover || 0;
        score = Math.min(100, (fact / 1000000) * 20);
        break;
      case 'potential':
        // Potential clients have higher opportunity
        if (company.client_type === 'potencial_cliente') {
          score = 80;
        } else {
          const vinc = company.vinculacion_entidad_1 || 0;
          score = vinc < 30 ? 60 : 30;
        }
        break;
      case 'combined':
      default:
        // Combined score: potential + low vinculacion + high facturacion
        const isPotential = company.client_type === 'potencial_cliente';
        const vincScore = 100 - (company.vinculacion_entidad_1 || 50);
        const factScore = Math.min(50, ((company.turnover || 0) / 1000000) * 10);
        score = (isPotential ? 40 : 0) + (vincScore * 0.4) + factScore;
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const generateHeatmapData = (): HeatmapPoint[] => {
    return companies
      .filter(c => c.latitude && c.longitude)
      .map(company => {
        const score = calculateOpportunityScore(company);
        return {
          lat: company.latitude,
          lng: company.longitude,
          intensity: score / 100,
          category: score > 66 ? 'high' : score > 33 ? 'medium' : 'low' as const,
        };
      });
  };

  const handleToggle = (enabled: boolean) => {
    onToggle(enabled);
    if (enabled) {
      const data = generateHeatmapData();
      onHeatmapDataChange(data);
    } else {
      onHeatmapDataChange(null);
    }
  };

  const handleMetricChange = (newMetric: OpportunityMetric) => {
    setMetric(newMetric);
    if (isEnabled) {
      const data = generateHeatmapData();
      onHeatmapDataChange(data);
    }
  };

  const stats = {
    high: companies.filter(c => calculateOpportunityScore(c) > 66).length,
    medium: companies.filter(c => {
      const score = calculateOpportunityScore(c);
      return score > 33 && score <= 66;
    }).length,
    low: companies.filter(c => calculateOpportunityScore(c) <= 33).length,
  };

  return (
    <div className="absolute right-4 top-20 z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`bg-card shadow-lg ${isEnabled ? 'border-orange-500 text-orange-600' : ''}`}
          >
            <Flame className={`mr-2 h-4 w-4 ${isEnabled ? 'text-orange-500' : ''}`} />
            Heatmap
            {isEnabled && (
              <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                ON
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="mt-2 w-72 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Mapa de Calor - Oportunidades
                </span>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={handleToggle}
                />
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Metric Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Mètrica d'oportunitat</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={metric === 'combined' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleMetricChange('combined')}
                  >
                    Combinada
                  </Button>
                  <Button
                    variant={metric === 'vinculacion' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleMetricChange('vinculacion')}
                  >
                    Vinculació
                  </Button>
                  <Button
                    variant={metric === 'facturacion' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleMetricChange('facturacion')}
                  >
                    Facturació
                  </Button>
                  <Button
                    variant={metric === 'potential' ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => handleMetricChange('potential')}
                  >
                    Potencial
                  </Button>
                </div>
              </div>

              {/* Radius Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Radi: {radius[0]}px</Label>
                </div>
                <Slider
                  value={radius}
                  onValueChange={setRadius}
                  min={10}
                  max={50}
                  step={5}
                />
              </div>

              {/* Opacity Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Opacitat: {Math.round(opacity[0] * 100)}%</Label>
                </div>
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  min={0.2}
                  max={1}
                  step={0.1}
                />
              </div>

              {/* Stats */}
              <div className="space-y-2 rounded-lg bg-muted p-3">
                <Label className="text-xs font-medium">Distribució oportunitats</Label>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded bg-red-100 p-2 dark:bg-red-900/30">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.high}</div>
                    <div className="text-xs text-muted-foreground">Alta</div>
                  </div>
                  <div className="rounded bg-yellow-100 p-2 dark:bg-yellow-900/30">
                    <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</div>
                    <div className="text-xs text-muted-foreground">Mitja</div>
                  </div>
                  <div className="rounded bg-green-100 p-2 dark:bg-green-900/30">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.low}</div>
                    <div className="text-xs text-muted-foreground">Baixa</div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1">
                <Label className="text-xs font-medium">Llegenda</Label>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-full rounded bg-gradient-to-r from-green-400 via-yellow-400 to-red-500" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Baixa</span>
                  <span>Alta oportunitat</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
