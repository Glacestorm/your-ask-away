import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, Sparkles, Code, FileCode2, Loader2,
  CheckCircle2, Star, Tag, Clock, Building2,
  ArrowRight, Zap, Shield, BarChart3, Puzzle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ModulePlaceholderProps {
  moduleKey: string;
  onRequestImplementation?: (moduleKey: string) => void;
}

interface ModuleData {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  category: string;
  sector: string | null;
  version: string | null;
  base_price: number | null;
  is_core: boolean | null;
  features: any;
  dependencies: string[] | null;
  module_icon: string | null;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, React.ReactNode> = {
    'Core': <Puzzle className="h-5 w-5" />,
    'CRM': <Building2 className="h-5 w-5" />,
    'Analytics': <BarChart3 className="h-5 w-5" />,
    'AI': <Sparkles className="h-5 w-5" />,
    'Automation': <Zap className="h-5 w-5" />,
    'Security': <Shield className="h-5 w-5" />,
  };
  return icons[category] || <Package className="h-5 w-5" />;
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Core': 'from-blue-500/20 to-blue-600/40',
    'CRM': 'from-green-500/20 to-green-600/40',
    'Analytics': 'from-purple-500/20 to-purple-600/40',
    'AI': 'from-pink-500/20 to-pink-600/40',
    'Automation': 'from-amber-500/20 to-amber-600/40',
    'Security': 'from-red-500/20 to-red-600/40',
    'Accounting': 'from-emerald-500/20 to-emerald-600/40',
    'Documents': 'from-cyan-500/20 to-cyan-600/40',
    'Integration': 'from-indigo-500/20 to-indigo-600/40',
  };
  return colors[category] || 'from-gray-500/20 to-gray-600/40';
};

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleKey,
  onRequestImplementation
}) => {
  const [module, setModule] = useState<ModuleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchModuleData();
  }, [moduleKey]);

  const fetchModuleData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .eq('module_key', moduleKey)
        .single();

      if (error) throw error;
      setModule(data);
    } catch (error) {
      console.error('Error fetching module:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestImplementation = async () => {
    if (!module) return;
    
    setRequesting(true);
    try {
      // Simular solicitud de implementación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Solicitud enviada', {
        description: `Se ha solicitado la implementación del módulo "${module.module_name}"`
      });
      
      onRequestImplementation?.(moduleKey);
    } catch (error) {
      toast.error('Error al solicitar implementación');
    } finally {
      setRequesting(false);
    }
  };

  const parseFeatures = (features: any): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (typeof features === 'object' && features.items) return features.items;
    return [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!module) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Módulo no encontrado</h3>
          <p className="text-sm text-muted-foreground">
            El módulo "{moduleKey}" no existe en el catálogo
          </p>
        </CardContent>
      </Card>
    );
  }

  const features = parseFeatures(module.features);
  const categoryColor = getCategoryColor(module.category);

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="overflow-hidden">
        <div className={cn("h-32 bg-gradient-to-r", categoryColor)} />
        <CardContent className="relative pt-0">
          <div className="absolute -top-12 left-6">
            <div className={cn(
              "h-24 w-24 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-xl border-4 border-background",
              categoryColor
            )}>
              {getCategoryIcon(module.category)}
            </div>
          </div>
          
          <div className="pt-16 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{module.module_name}</h1>
                <p className="text-muted-foreground font-mono text-sm">{module.module_key}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {module.category}
                </Badge>
                {module.version && (
                  <Badge variant="secondary">v{module.version}</Badge>
                )}
                {module.is_core && (
                  <Badge className="bg-blue-500/10 text-blue-600">
                    <Star className="h-3 w-3 mr-1" />
                    Core
                  </Badge>
                )}
              </div>
            </div>
            
            <p className="mt-4 text-muted-foreground">
              {module.description || 'Sin descripción disponible'}
            </p>
            
            {module.base_price !== null && (
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {module.base_price === 0 ? 'Gratis' : `€${module.base_price}`}
                </span>
                {module.base_price > 0 && (
                  <span className="text-muted-foreground">/mes</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Code className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                Módulo en desarrollo
              </h3>
              <p className="text-sm text-amber-600/80 dark:text-amber-500/80">
                Este módulo está publicado en la tienda pero aún no tiene implementación funcional.
                Puedes solicitar su desarrollo prioritario.
              </p>
            </div>
            <Button 
              onClick={handleRequestImplementation}
              disabled={requesting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Solicitar implementación
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Features */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Características planificadas
            </CardTitle>
            <CardDescription>
              Funcionalidades que incluirá este módulo cuando esté implementado
            </CardDescription>
          </CardHeader>
          <CardContent>
            {features.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileCode2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Características pendientes de definir</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Sidebar */}
        <div className="space-y-4">
          {/* Dependencies */}
          {module.dependencies && module.dependencies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Puzzle className="h-4 w-4" />
                  Dependencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {module.dependencies.map(dep => (
                    <Badge key={dep} variant="outline" className="font-mono text-xs">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sector */}
          {module.sector && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Sector
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-primary/10 text-primary">
                  {module.sector}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Estado del desarrollo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Diseño completado</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Publicado en tienda</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Esperando implementación</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span className="text-sm text-muted-foreground">Testing y QA</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-muted" />
                  <span className="text-sm text-muted-foreground">Lanzamiento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-6 text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
              <h4 className="font-semibold mb-2">¿Necesitas este módulo?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Solicita su implementación y te notificaremos cuando esté listo
              </p>
              <Button 
                onClick={handleRequestImplementation}
                disabled={requesting}
                className="w-full"
              >
                {requesting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Solicitar ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
