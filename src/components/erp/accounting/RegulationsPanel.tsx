/**
 * RegulationsPanel - Panel de normativas contables con búsqueda y actualización
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Search,
  BookOpen,
  ExternalLink,
  Filter,
  Globe,
  Calendar,
  Tag,
  FileText,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Download,
  Sparkles
} from 'lucide-react';
import { HelpTooltip } from './HelpTooltip';
import { useERPAccounting, AccountingRegulation } from '@/hooks/erp/useERPAccounting';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

// Países disponibles
const COUNTRIES = [
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'UK', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
];

const REGULATION_TYPES = {
  law: { label: 'Ley', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  standard: { label: 'Norma', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  decree: { label: 'Decreto', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  circular: { label: 'Circular', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  guideline: { label: 'Guía', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
};

const CATEGORIES = [
  'Impuestos',
  'IVA/IGI',
  'IRPF',
  'Impuesto Sociedades',
  'Plan General Contable',
  'Facturación',
  'Libros Contables',
  'Auditoría',
  'Blanqueo Capitales',
  'Protección Datos',
];

interface RegulationsPanelProps {
  className?: string;
  compact?: boolean;
}

export function RegulationsPanel({ className, compact = false }: RegulationsPanelProps) {
  const { currentCompany } = useERPContext();
  const {
    regulations,
    isSearchingRegulations,
    regulationSearchProgress,
    fetchRegulations,
    searchAndUpdateRegulations,
  } = useERPAccounting();

  const [selectedCountry, setSelectedCountry] = useState(currentCompany?.country || 'ES');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [expandedRegulation, setExpandedRegulation] = useState<AccountingRegulation | null>(null);

  // Filtrar normativas
  const filteredRegulations = regulations.filter(reg => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!reg.title.toLowerCase().includes(query) &&
          !reg.description.toLowerCase().includes(query) &&
          !reg.regulation_code.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (selectedCategory !== 'all' && reg.category !== selectedCategory) return false;
    if (selectedType !== 'all' && reg.regulation_type !== selectedType) return false;
    return true;
  });

  // Manejar cambio de país
  const handleCountryChange = useCallback(async (countryCode: string) => {
    setSelectedCountry(countryCode);
    await fetchRegulations(countryCode);
  }, [fetchRegulations]);

  // Manejar actualización de normativas
  const handleUpdateRegulations = useCallback(async () => {
    await searchAndUpdateRegulations(selectedCountry);
    setShowUpdateDialog(false);
  }, [searchAndUpdateRegulations, selectedCountry]);

  const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Normativas Contables
                <HelpTooltip
                  type="regulation"
                  title="Normativas del País"
                  content={
                    <div className="space-y-2">
                      <p>Base de datos actualizada de todas las normativas contables, fiscales y mercantiles aplicables.</p>
                      <p>Incluye leyes, decretos, circulares y guías oficiales de los organismos reguladores.</p>
                    </div>
                  }
                />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {filteredRegulations.length} normativas activas
              </p>
            </div>
          </div>

          <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isSearchingRegulations}
                className="gap-2"
              >
                {isSearchingRegulations ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Actualizar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Actualizar Normativas
                </DialogTitle>
                <DialogDescription>
                  Buscar en toda la web las normativas contables actualizadas para {selectedCountryData?.flag} {selectedCountryData?.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-4xl">{selectedCountryData?.flag}</div>
                  <div>
                    <p className="font-medium">{selectedCountryData?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {regulations.length} normativas actuales
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Búsqueda en organismos oficiales (BOE, BOPA, etc.)
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Análisis de cambios normativos recientes
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Actualización automática del módulo contable
                  </p>
                </div>

                {isSearchingRegulations && regulationSearchProgress && (
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>{regulationSearchProgress}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                  disabled={isSearchingRegulations}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdateRegulations}
                  disabled={isSearchingRegulations}
                  className="gap-2"
                >
                  {isSearchingRegulations ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Buscar y Actualizar
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selector de país */}
        <div className="flex items-center gap-2">
          <Select value={selectedCountry} onValueChange={handleCountryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar país" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(country => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag}</span>
                    <span>{country.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <HelpTooltip
            type="info"
            title="Selección de País"
            content="Las normativas se filtran según el país seleccionado. Cada país tiene su propio marco regulatorio contable y fiscal."
          />
        </div>

        {/* Búsqueda y filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar normativa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(REGULATION_TYPES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[calc(100%-1rem)] px-4 pb-4">
          {filteredRegulations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No se encontraron normativas</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowUpdateDialog(true)}
                className="mt-2"
              >
                Buscar normativas actualizadas
              </Button>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredRegulations.map((regulation) => {
                const typeConfig = REGULATION_TYPES[regulation.regulation_type as keyof typeof REGULATION_TYPES];
                
                return (
                  <AccordionItem
                    key={regulation.id}
                    value={regulation.id}
                    className="border rounded-lg px-4 data-[state=open]:bg-muted/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-start gap-3 text-left flex-1">
                        <div className="flex flex-col gap-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn('text-xs', typeConfig?.color)}>
                              {typeConfig?.label || regulation.regulation_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {regulation.regulation_code}
                            </span>
                          </div>
                          <p className="font-medium text-sm line-clamp-2">
                            {regulation.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(regulation.effective_date), 'dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {regulation.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {regulation.description}
                        </p>

                        {/* Contenido completo */}
                        <div className="p-4 bg-background rounded-lg border">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div 
                              className="text-sm"
                              dangerouslySetInnerHTML={{ 
                                __html: regulation.content_markdown
                                  .replace(/\n/g, '<br>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/^### (.*?)$/gm, '<h4 class="font-semibold mt-3 mb-1">$1</h4>')
                                  .replace(/^## (.*?)$/gm, '<h3 class="font-bold mt-4 mb-2">$1</h3>')
                                  .replace(/^# (.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
                                  .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
                              }}
                            />
                          </div>
                        </div>

                        {/* Tags */}
                        {regulation.tags && regulation.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {regulation.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          {regulation.source_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => window.open(regulation.source_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver fuente oficial
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => setExpandedRegulation(regulation)}
                          >
                            <FileText className="h-4 w-4" />
                            Ver completo
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </ScrollArea>
      </CardContent>

      {/* Dialog para ver normativa completa */}
      <Dialog open={!!expandedRegulation} onOpenChange={() => setExpandedRegulation(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {expandedRegulation && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={cn('text-xs', REGULATION_TYPES[expandedRegulation.regulation_type as keyof typeof REGULATION_TYPES]?.color)}>
                    {REGULATION_TYPES[expandedRegulation.regulation_type as keyof typeof REGULATION_TYPES]?.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {expandedRegulation.regulation_code}
                  </span>
                </div>
                <DialogTitle>{expandedRegulation.title}</DialogTitle>
                <DialogDescription>{expandedRegulation.description}</DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none py-4">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: expandedRegulation.content_markdown
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^### (.*?)$/gm, '<h4 class="font-semibold mt-3 mb-1">$1</h4>')
                        .replace(/^## (.*?)$/gm, '<h3 class="font-bold mt-4 mb-2">$1</h3>')
                        .replace(/^# (.*?)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
                        .replace(/^- (.*?)$/gm, '<li class="ml-4">$1</li>')
                    }}
                  />
                </div>
              </ScrollArea>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-xs text-muted-foreground">
                  Vigente desde: {format(new Date(expandedRegulation.effective_date), 'dd/MM/yyyy')}
                </div>
                {expandedRegulation.source_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(expandedRegulation.source_url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Fuente oficial
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default RegulationsPanel;
