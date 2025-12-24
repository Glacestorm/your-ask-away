import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Check, 
  ShoppingCart,
  Sparkles,
  Calculator,
  Clock
} from 'lucide-react';
import { useModuleTrials } from '@/hooks/useModuleTrials';
import { supabase } from '@/integrations/supabase/client';
const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
import { toast } from 'sonner';

interface Module {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  base_price: number | null;
  category: string;
  is_core: boolean;
  is_required: boolean;
  features: unknown;
}

export function ModuleConfigurator() {
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { getTrialStatus, startTrial } = useModuleTrials();

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching modules:', error);
        return;
      }

      setModules(data as Module[]);
      
      // Auto-select required modules
      const required = new Set(
        (data as Module[])
          .filter(m => m.is_required || m.is_core)
          .map(m => m.module_key)
      );
      setSelectedModules(required);
      setLoading(false);
    };

    fetchModules();
  }, []);

  const toggleModule = (moduleKey: string, isRequired: boolean) => {
    if (isRequired) return; // Can't deselect required modules
    
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleKey)) {
        next.delete(moduleKey);
      } else {
        next.add(moduleKey);
      }
      return next;
    });
  };

  const calculateTotal = () => {
    return modules
      .filter(m => selectedModules.has(m.module_key))
      .reduce((sum, m) => sum + (m.base_price || 0), 0);
  };

  const handleStartTrial = async (moduleKey: string) => {
    await startTrial(moduleKey);
  };

  const handlePurchase = () => {
    const selectedList = modules.filter(m => selectedModules.has(m.module_key));
    toast.success(`Configuración guardada: ${selectedList.length} módulos seleccionados`);
    // Here you would integrate with Stripe
  };

  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<string, Module[]>);

  const categoryLabels: Record<string, string> = {
    core: '🏢 Núcleo',
    financial: '💰 Financiero',
    operations: '⚙️ Operaciones',
    analytics: '📊 Analytics',
    compliance: '✅ Cumplimiento',
    communication: '💬 Comunicación',
    sector_specific: '🎯 Sectorial',
    other: '📦 Otros'
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando módulos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Module Selection */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Configurador de Módulos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category} className="mb-6">
                  <h3 className="font-semibold mb-3 text-lg">
                    {categoryLabels[category] || category}
                  </h3>
                  <div className="space-y-3">
                    {categoryModules.map((module) => {
                      const trialStatus = getTrialStatus(module.module_key);
                      const isSelected = selectedModules.has(module.module_key);

                      return (
                        <div
                          key={module.id}
                          className={`p-4 rounded-lg border transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleModule(module.module_key, module.is_required)}
                              disabled={module.is_required}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{module.module_name}</span>
                                {module.is_core && (
                                  <Badge variant="secondary" className="text-xs">Core</Badge>
                                )}
                                {module.is_required && (
                                  <Badge variant="outline" className="text-xs">Requerido</Badge>
                                )}
                                {trialStatus.isActive && (
                                  <Badge className="text-xs bg-green-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Trial: {trialStatus.daysRemaining} días
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {module.description}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-semibold text-primary">
                                  {formatCurrency(module.base_price || 0)}/año
                                </span>
                                {trialStatus.canStartTrial && !module.is_core && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStartTrial(module.module_key)}
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Probar 10 días
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {modules
                .filter(m => selectedModules.has(m.module_key))
                .map(module => (
                  <div key={module.id} className="flex justify-between text-sm">
                    <span className="truncate">{module.module_name}</span>
                    <span className="font-medium">
                      {formatCurrency(module.base_price || 0)}
                    </span>
                  </div>
                ))}
            </div>
            
            <Separator />
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total Anual</span>
              <span className="text-primary">{formatCurrency(calculateTotal())}</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>• {selectedModules.size} módulos seleccionados</p>
              <p>• Soporte incluido</p>
              <p>• Actualizaciones automáticas</p>
            </div>

            <Button className="w-full" size="lg" onClick={handlePurchase}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Solicitar Presupuesto
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Un asesor se pondrá en contacto contigo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>Garantía de devolución 30 días</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Migración de datos incluida</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Formación personalizada</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
