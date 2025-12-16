import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sparkles, Loader2, Search, Building2, FileCode2, 
  CheckCircle2, AlertCircle, Zap, Database, Shield
} from 'lucide-react';

interface CNAEModuleGeneratorProps {
  onModuleGenerated: () => void;
}

interface GenerationResult {
  success: boolean;
  module?: any;
  error?: string;
}

export const CNAEModuleGenerator: React.FC<CNAEModuleGeneratorProps> = ({ onModuleGenerated }) => {
  const [cnaeCode, setCnaeCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [lookupResult, setLookupResult] = useState<any>(null);

  const lookupCNAE = async () => {
    if (!cnaeCode.trim()) {
      toast.error('Introduce un código CNAE');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cnae_sector_mapping')
        .select('*')
        .eq('cnae_code', cnaeCode.trim())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setLookupResult(data);
        toast.success(`CNAE ${cnaeCode} encontrado: ${data.sector_name}`);
      } else {
        setLookupResult(null);
        toast.info('CNAE no encontrado en el mapping. Se generará con IA.');
      }
    } catch (error: any) {
      console.error('Error looking up CNAE:', error);
      toast.error('Error al buscar código CNAE');
    }
  };

  const generateModule = async () => {
    if (!cnaeCode.trim()) {
      toast.error('Introduce un código CNAE');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-module-from-cnae', {
        body: {
          cnae_code: cnaeCode.trim(),
          custom_name: customName.trim() || undefined
        }
      });

      if (error) throw error;

      setResult({
        success: true,
        module: data.module
      });
      toast.success('Módulo generado correctamente');
      onModuleGenerated();
    } catch (error: any) {
      console.error('Error generating module:', error);
      setResult({
        success: false,
        error: error.message || 'Error desconocido'
      });
      toast.error(error.message || 'Error al generar el módulo');
    } finally {
      setGenerating(false);
    }
  };

  const commonCNAEs = [
    { code: '6419', name: 'Otra intermediación monetaria (Banca)' },
    { code: '6512', name: 'Seguros distintos de los de vida' },
    { code: '4711', name: 'Comercio al por menor en establecimientos' },
    { code: '5610', name: 'Restaurantes y puestos de comidas' },
    { code: '4120', name: 'Construcción de edificios' },
    { code: '6920', name: 'Actividades de contabilidad' },
    { code: '8610', name: 'Actividades hospitalarias' },
    { code: '4941', name: 'Transporte de mercancías por carretera' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generador de Módulos por CNAE
          </CardTitle>
          <CardDescription>
            Introduce un código CNAE para generar automáticamente un módulo sectorial con componentes, KPIs, regulaciones y configuraciones específicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnae">Código CNAE *</Label>
            <div className="flex gap-2">
              <Input
                id="cnae"
                placeholder="Ej: 6419"
                value={cnaeCode}
                onChange={(e) => setCnaeCode(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" onClick={lookupCNAE}>
                <Search className="h-4 w-4 mr-1" />
                Buscar
              </Button>
            </div>
          </div>

          {lookupResult && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">CNAE encontrado</span>
              </div>
              <p className="text-sm"><strong>Sector:</strong> {lookupResult.sector_name}</p>
              <p className="text-sm"><strong>Descripción:</strong> {lookupResult.cnae_description}</p>
              {lookupResult.default_kpis && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">KPIs predefinidos:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(lookupResult.default_kpis as string[]).slice(0, 5).map((kpi: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{kpi}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customName">Nombre personalizado (opcional)</Label>
            <Input
              id="customName"
              placeholder="Nombre del módulo"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          <Button 
            onClick={generateModule} 
            disabled={generating || !cnaeCode.trim()}
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando módulo...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generar Módulo
              </>
            )}
          </Button>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium">CNAEs comunes:</p>
            <div className="flex flex-wrap gap-2">
              {commonCNAEs.map(cnae => (
                <Badge
                  key={cnae.code}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setCnaeCode(cnae.code);
                    lookupCNAE();
                  }}
                >
                  {cnae.code}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5" />
            Resultado de Generación
          </CardTitle>
          <CardDescription>
            Vista previa del módulo generado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!result && !generating && (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Introduce un código CNAE y genera un módulo</p>
            </div>
          )}

          {generating && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Generando módulo con IA...</p>
              <p className="text-xs text-muted-foreground mt-2">
                Analizando sector, regulaciones y mejores prácticas
              </p>
            </div>
          )}

          {result && !result.success && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Error en la generación</span>
              </div>
              <p className="text-sm">{result.error}</p>
            </div>
          )}

          {result?.success && result.module && (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Módulo generado correctamente</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Nombre:</p>
                    <p className="text-lg font-semibold text-primary">{result.module.module_name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Clave:</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{result.module.module_key}</code>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Sector:</p>
                    <Badge variant="outline">{result.module.sector_name || result.module.sector}</Badge>
                  </div>

                  {result.module.components && (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Zap className="h-4 w-4" /> Componentes:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(result.module.components as any[]).slice(0, 8).map((comp: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {comp.name || comp}
                          </Badge>
                        ))}
                        {(result.module.components as any[]).length > 8 && (
                          <Badge variant="outline" className="text-xs">
                            +{(result.module.components as any[]).length - 8} más
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {result.module.regulations && (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Shield className="h-4 w-4" /> Regulaciones:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(result.module.regulations as any[]).slice(0, 5).map((reg: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/30">
                            {reg.name || reg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.module.kpis && (
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Database className="h-4 w-4" /> KPIs:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(result.module.kpis as any[]).slice(0, 6).map((kpi: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                            {kpi.name || kpi}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.module.ai_generated && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generado con IA
                    </Badge>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
