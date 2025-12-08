import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StatusColor, MapColorMode } from '@/types/database';
import { Info, ChevronDown, ChevronUp, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  statusColors: StatusColor[];
  colorMode: MapColorMode;
  companiesCount: number;
  filteredCount: number;
  isVisible: boolean;
  onClose: () => void;
}

export function MapLegend({
  statusColors,
  colorMode,
  companiesCount,
  filteredCount,
  isVisible,
  onClose,
}: MapLegendProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['colors']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const getColorModeLabel = () => {
    switch (colorMode) {
      case 'status': return 'Per Estat';
      case 'vinculacion': return 'Per Vinculació';
      case 'pl_banco': return 'Per P&L Banco';
      case 'facturacion': return 'Per Facturació';
      case 'beneficios': return 'Per Beneficis';
      case 'visitas': return 'Per Visites';
      default: return 'Per Estat';
    }
  };

  const getVinculacionLegend = () => [
    { color: 'hsl(0, 70%, 50%)', label: '0-20%', description: 'Vinculació baixa' },
    { color: 'hsl(25, 80%, 55%)', label: '20-40%', description: 'Vinculació moderada' },
    { color: 'hsl(45, 85%, 50%)', label: '40-60%', description: 'Vinculació mitjana' },
    { color: 'hsl(90, 60%, 45%)', label: '60-80%', description: 'Vinculació alta' },
    { color: 'hsl(142, 70%, 40%)', label: '80-100%', description: 'Vinculació màxima' },
  ];

  const getPlBancoLegend = () => [
    { color: 'hsl(0, 70%, 50%)', label: '< -50k€', description: 'Pèrdues significatives' },
    { color: 'hsl(25, 80%, 55%)', label: '-50k a 0€', description: 'Pèrdues lleus' },
    { color: 'hsl(45, 85%, 50%)', label: '0€', description: 'Neutre' },
    { color: 'hsl(90, 60%, 45%)', label: '0 a 50k€', description: 'Beneficis moderats' },
    { color: 'hsl(142, 70%, 40%)', label: '> 50k€', description: 'Beneficis alts' },
  ];

  const getVisitsLegend = () => [
    { color: 'hsl(0, 0%, 60%)', label: 'Sense visites', description: 'Mai visitat' },
    { color: 'hsl(200, 70%, 50%)', label: '1-2 visites', description: 'Poca activitat' },
    { color: 'hsl(180, 60%, 45%)', label: '3-5 visites', description: 'Activitat moderada' },
    { color: 'hsl(142, 70%, 40%)', label: '6-10 visites', description: 'Activitat alta' },
    { color: 'hsl(270, 60%, 50%)', label: '> 10 visites', description: 'Client prioritari' },
  ];

  const getBuildingTypeLegend = () => [
    { color: 'hsl(210, 70%, 60%)', label: 'Comercial', description: 'Oficines, botigues, bancs' },
    { color: 'hsl(120, 50%, 55%)', label: 'Residencial', description: 'Habitatges, apartaments' },
    { color: 'hsl(25, 80%, 60%)', label: 'Industrial', description: 'Fàbriques, magatzems' },
    { color: 'hsl(270, 50%, 60%)', label: 'Públic', description: 'Escoles, hospitals' },
    { color: 'hsl(45, 80%, 65%)', label: 'Religiós', description: 'Esglésies, temples' },
    { color: 'hsl(30, 15%, 75%)', label: 'Altres', description: 'Edificis no classificats' },
  ];

  const getCurrentLegend = () => {
    switch (colorMode) {
      case 'status': return statusColors.map(s => ({ 
        color: s.color_hex, 
        label: s.status_name, 
        description: `${s.status_name}` 
      }));
      case 'vinculacion': return getVinculacionLegend();
      case 'pl_banco': return getPlBancoLegend();
      case 'facturacion': return [
        { color: 'hsl(0, 70%, 50%)', label: '< 100k€', description: 'Facturació baixa' },
        { color: 'hsl(25, 80%, 55%)', label: '100k-500k€', description: 'Facturació moderada' },
        { color: 'hsl(45, 85%, 50%)', label: '500k-1M€', description: 'Facturació mitjana' },
        { color: 'hsl(90, 60%, 45%)', label: '1M-5M€', description: 'Facturació alta' },
        { color: 'hsl(142, 70%, 40%)', label: '> 5M€', description: 'Facturació molt alta' },
      ];
      case 'beneficios': return [
        { color: 'hsl(0, 70%, 50%)', label: '< -50k€', description: 'Pèrdues significatives' },
        { color: 'hsl(25, 80%, 55%)', label: '-50k a 0€', description: 'Pèrdues lleus' },
        { color: 'hsl(45, 85%, 50%)', label: '0€', description: 'Neutre' },
        { color: 'hsl(90, 60%, 45%)', label: '0 a 100k€', description: 'Beneficis moderats' },
        { color: 'hsl(142, 70%, 40%)', label: '> 100k€', description: 'Beneficis alts' },
      ];
      case 'visitas': return getVisitsLegend();
      default: return statusColors.map(s => ({ 
        color: s.color_hex, 
        label: s.status_name, 
        description: `${s.status_name}` 
      }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="absolute right-4 bottom-24 z-10">
      <Card className="w-72 shadow-lg bg-card/95 backdrop-blur-sm">
        <div className="border-b p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Llegenda del Mapa</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

          <ScrollArea className="max-h-[400px]">
            <div className="p-3 space-y-3">
              {/* Statistics */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Empreses visibles:</span>
                <Badge variant="secondary" className="font-mono">
                  {filteredCount} / {companiesCount}
                </Badge>
              </div>

              {/* Current Color Mode */}
              <Collapsible
                open={expandedSections.includes('colors')}
                onOpenChange={() => toggleSection('colors')}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
                    <span className="font-medium">{getColorModeLabel()}</span>
                  </div>
                  {expandedSections.includes('colors') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-2">
                  {getCurrentLegend().map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                      <div
                        className="h-3 w-3 rounded-full border border-border/50 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Building Types (3D) */}
              <Collapsible
                open={expandedSections.includes('buildings')}
                onOpenChange={() => toggleSection('buildings')}
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-accent text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded bg-blue-400" />
                    <span className="font-medium">Tipus d'Edificis (3D)</span>
                  </div>
                  {expandedSections.includes('buildings') ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pt-2">
                  {getBuildingTypeLegend().map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                      <div
                        className="h-3 w-3 rounded border border-border/50 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <span className="text-xs font-medium">{item.label}</span>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Cluster Info */}
              <div className="px-2 py-2 bg-muted/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Agrupacions (Clusters)</p>
                    <p>Els cercles amb números indiquen agrupacions d'empreses. Fes zoom per veure-les individualment.</p>
                  </div>
                </div>
              </div>
            </div>
        </ScrollArea>
      </Card>
    </div>
  );
}
