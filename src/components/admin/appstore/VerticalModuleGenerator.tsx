import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Sparkles, Building2, FileCode2, CheckCircle2,
  Loader2, Package, ArrowRight, Zap, Shield,
  BarChart3, Brain, Factory, Stethoscope, GraduationCap,
  Tractor, Scale, Truck, Hotel, ShoppingBag, Landmark,
  Leaf, Hammer, Lightbulb, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerticalConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  modules: {
    key: string;
    name: string;
    type: 'accounting' | 'compliance' | 'ai' | 'management';
    features: string[];
  }[];
}

const VERTICALS: VerticalConfig[] = [
  {
    id: 'agriculture',
    name: 'Agricultura',
    icon: <Tractor className="h-5 w-5" />,
    description: 'Gestión agrícola, cultivos, maquinaria y trazabilidad',
    color: 'from-green-500 to-emerald-600',
    modules: [
      {
        key: 'agriculture-accounting',
        name: 'Contabilidad Agrícola',
        type: 'accounting',
        features: ['Plan contable agrícola', 'Gestión de subvenciones PAC', 'Amortización maquinaria', 'Costes por parcela']
      },
      {
        key: 'agriculture-compliance',
        name: 'Cumplimiento Agrícola',
        type: 'compliance',
        features: ['Cuaderno de campo digital', 'Trazabilidad fitosanitarios', 'Certificaciones ecológicas', 'Normativa PAC']
      },
      {
        key: 'agriculture-ai',
        name: 'IA Agrícola',
        type: 'ai',
        features: ['Predicción cosechas', 'Optimización riego', 'Detección plagas', 'Análisis satelital']
      },
      {
        key: 'agriculture-management',
        name: 'Gestión Agrícola',
        type: 'management',
        features: ['Parcelas y cultivos', 'Maquinaria', 'Personal temporero', 'Almacén y stock']
      }
    ]
  },
  {
    id: 'healthcare',
    name: 'Salud',
    icon: <Stethoscope className="h-5 w-5" />,
    description: 'Clínicas, hospitales, farmacias y centros médicos',
    color: 'from-red-500 to-rose-600',
    modules: [
      {
        key: 'healthcare-accounting',
        name: 'Contabilidad Sanitaria',
        type: 'accounting',
        features: ['Facturación aseguradoras', 'Gestión mutuas', 'Cobros pacientes', 'Reporting SII']
      },
      {
        key: 'healthcare-compliance',
        name: 'Cumplimiento Sanitario',
        type: 'compliance',
        features: ['LOPD-GDD sanitario', 'Consentimientos informados', 'Historiales clínicos', 'Auditoría AEPD']
      },
      {
        key: 'healthcare-ai',
        name: 'IA Sanitaria',
        type: 'ai',
        features: ['Predicción demanda', 'Optimización citas', 'Análisis patrones', 'Alertas clínicas']
      },
      {
        key: 'healthcare-management',
        name: 'Gestión Sanitaria',
        type: 'management',
        features: ['Agenda médica', 'Historiales', 'Recetas electrónicas', 'Inventario farmacia']
      }
    ]
  },
  {
    id: 'education',
    name: 'Educación',
    icon: <GraduationCap className="h-5 w-5" />,
    description: 'Centros educativos, academias y formación',
    color: 'from-blue-500 to-indigo-600',
    modules: [
      {
        key: 'education-accounting',
        name: 'Contabilidad Educativa',
        type: 'accounting',
        features: ['Gestión matrículas', 'Facturación recurrente', 'Becas y ayudas', 'Reporting educativo']
      },
      {
        key: 'education-compliance',
        name: 'Cumplimiento Educativo',
        type: 'compliance',
        features: ['LOPD educativo', 'Autorizaciones menores', 'Protocolos acoso', 'Normativa educativa']
      },
      {
        key: 'education-ai',
        name: 'IA Educativa',
        type: 'ai',
        features: ['Aprendizaje adaptativo', 'Predicción abandono', 'Evaluación automática', 'Tutorías IA']
      },
      {
        key: 'education-management',
        name: 'Gestión Educativa',
        type: 'management',
        features: ['Expedientes alumnos', 'Horarios', 'Comunicación familias', 'Biblioteca']
      }
    ]
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: <Scale className="h-5 w-5" />,
    description: 'Despachos de abogados, notarías y asesorías',
    color: 'from-purple-500 to-violet-600',
    modules: [
      {
        key: 'legal-accounting',
        name: 'Contabilidad Legal',
        type: 'accounting',
        features: ['Facturación por expediente', 'Provisiones minutas', 'Control suplidos', 'Honorarios']
      },
      {
        key: 'legal-compliance',
        name: 'Cumplimiento Legal',
        type: 'compliance',
        features: ['Blanqueo capitales', 'LOPD despachos', 'Secreto profesional', 'Conflictos interés']
      },
      {
        key: 'legal-ai',
        name: 'IA Legal',
        type: 'ai',
        features: ['Análisis documentos', 'Predicción sentencias', 'Due diligence IA', 'Redacción contratos']
      },
      {
        key: 'legal-management',
        name: 'Gestión Legal',
        type: 'management',
        features: ['Expedientes', 'Agenda judicial', 'Plazos procesales', 'Documentación']
      }
    ]
  },
  {
    id: 'manufacturing',
    name: 'Industria',
    icon: <Factory className="h-5 w-5" />,
    description: 'Fabricación, producción y manufactura',
    color: 'from-orange-500 to-amber-600',
    modules: [
      {
        key: 'manufacturing-accounting',
        name: 'Contabilidad Industrial',
        type: 'accounting',
        features: ['Costes producción', 'Inventario valorizado', 'Amortizaciones', 'Costes estándar']
      },
      {
        key: 'manufacturing-compliance',
        name: 'Cumplimiento Industrial',
        type: 'compliance',
        features: ['ISO 9001/14001', 'Prevención riesgos', 'Residuos industriales', 'REACH/CLP']
      },
      {
        key: 'manufacturing-ai',
        name: 'IA Industrial',
        type: 'ai',
        features: ['Mantenimiento predictivo', 'Optimización OEE', 'Control calidad IA', 'Planificación MRP']
      },
      {
        key: 'manufacturing-management',
        name: 'Gestión Industrial',
        type: 'management',
        features: ['Órdenes fabricación', 'Control planta', 'Gestión turnos', 'Trazabilidad']
      }
    ]
  },
  {
    id: 'logistics',
    name: 'Logística',
    icon: <Truck className="h-5 w-5" />,
    description: 'Transporte, almacenes y distribución',
    color: 'from-cyan-500 to-teal-600',
    modules: [
      {
        key: 'logistics-accounting',
        name: 'Contabilidad Logística',
        type: 'accounting',
        features: ['Costes transporte', 'Facturación portes', 'Peajes y combustible', 'Rentabilidad rutas']
      },
      {
        key: 'logistics-compliance',
        name: 'Cumplimiento Logístico',
        type: 'compliance',
        features: ['Tacógrafo digital', 'ADR mercancías', 'CMR internacional', 'Certificaciones']
      },
      {
        key: 'logistics-ai',
        name: 'IA Logística',
        type: 'ai',
        features: ['Optimización rutas', 'Predicción demanda', 'Gestión flota IA', 'ETA inteligente']
      },
      {
        key: 'logistics-management',
        name: 'Gestión Logística',
        type: 'management',
        features: ['Gestión flota', 'Almacenes', 'Expediciones', 'Tracking']
      }
    ]
  },
  {
    id: 'hospitality',
    name: 'Hostelería',
    icon: <Hotel className="h-5 w-5" />,
    description: 'Hoteles, restaurantes y turismo',
    color: 'from-pink-500 to-rose-600',
    modules: [
      {
        key: 'hospitality-accounting',
        name: 'Contabilidad Hostelera',
        type: 'accounting',
        features: ['Revenue management', 'Facturación TPV', 'Comisiones OTAs', 'Escandallos']
      },
      {
        key: 'hospitality-compliance',
        name: 'Cumplimiento Hostelero',
        type: 'compliance',
        features: ['Registro viajeros', 'Alérgenos', 'APPCC cocina', 'Licencias turismo']
      },
      {
        key: 'hospitality-ai',
        name: 'IA Hostelera',
        type: 'ai',
        features: ['Pricing dinámico', 'Predicción ocupación', 'Recomendaciones', 'Chatbot reservas']
      },
      {
        key: 'hospitality-management',
        name: 'Gestión Hostelera',
        type: 'management',
        features: ['Reservas', 'Housekeeping', 'Eventos', 'Canal manager']
      }
    ]
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: <ShoppingBag className="h-5 w-5" />,
    description: 'Comercio minorista y puntos de venta',
    color: 'from-violet-500 to-purple-600',
    modules: [
      {
        key: 'retail-accounting',
        name: 'Contabilidad Retail',
        type: 'accounting',
        features: ['Multitienda', 'Conciliación TPV', 'Márgenes producto', 'Inventario valorizado']
      },
      {
        key: 'retail-compliance',
        name: 'Cumplimiento Retail',
        type: 'compliance',
        features: ['Etiquetado precios', 'Garantías consumidor', 'LOPD comercio', 'Libro reclamaciones']
      },
      {
        key: 'retail-ai',
        name: 'IA Retail',
        type: 'ai',
        features: ['Predicción ventas', 'Recomendaciones', 'Optimización stock', 'Pricing dinámico']
      },
      {
        key: 'retail-management',
        name: 'Gestión Retail',
        type: 'management',
        features: ['TPV', 'Inventario', 'Fidelización', 'Ecommerce sync']
      }
    ]
  },
  {
    id: 'realestate',
    name: 'Inmobiliaria',
    icon: <Home className="h-5 w-5" />,
    description: 'Agencias inmobiliarias y gestión de propiedades',
    color: 'from-slate-500 to-gray-600',
    modules: [
      {
        key: 'realestate-accounting',
        name: 'Contabilidad Inmobiliaria',
        type: 'accounting',
        features: ['Comisiones agentes', 'Gestión arrendamientos', 'ITP/AJD', 'Provisiones']
      },
      {
        key: 'realestate-compliance',
        name: 'Cumplimiento Inmobiliario',
        type: 'compliance',
        features: ['Blanqueo capitales', 'CEE obligatorio', 'ITE edificios', 'Contratos tipo']
      },
      {
        key: 'realestate-ai',
        name: 'IA Inmobiliaria',
        type: 'ai',
        features: ['Valoración IA', 'Matching propiedades', 'Predicción mercado', 'Tours virtuales']
      },
      {
        key: 'realestate-management',
        name: 'Gestión Inmobiliaria',
        type: 'management',
        features: ['Cartera propiedades', 'CRM clientes', 'Portales sync', 'Visitas']
      }
    ]
  },
  {
    id: 'energy',
    name: 'Energía',
    icon: <Lightbulb className="h-5 w-5" />,
    description: 'Energías renovables y utilities',
    color: 'from-yellow-500 to-orange-600',
    modules: [
      {
        key: 'energy-accounting',
        name: 'Contabilidad Energética',
        type: 'accounting',
        features: ['Facturación consumos', 'Peajes y cargos', 'Excedentes', 'Amortización instalaciones']
      },
      {
        key: 'energy-compliance',
        name: 'Cumplimiento Energético',
        type: 'compliance',
        features: ['CNMC reporting', 'Certificados origen', 'Auditorías energéticas', 'Emisiones CO2']
      },
      {
        key: 'energy-ai',
        name: 'IA Energética',
        type: 'ai',
        features: ['Predicción generación', 'Optimización consumo', 'Mantenimiento predictivo', 'Trading IA']
      },
      {
        key: 'energy-management',
        name: 'Gestión Energética',
        type: 'management',
        features: ['Instalaciones', 'Monitorización', 'Contratos suministro', 'Autoconsumo']
      }
    ]
  },
  {
    id: 'construction',
    name: 'Construcción',
    icon: <Hammer className="h-5 w-5" />,
    description: 'Constructoras, promotoras y reformas',
    color: 'from-amber-500 to-yellow-600',
    modules: [
      {
        key: 'construction-accounting',
        name: 'Contabilidad Construcción',
        type: 'accounting',
        features: ['Costes por obra', 'Certificaciones', 'Retenciones garantía', 'Subcontratistas']
      },
      {
        key: 'construction-compliance',
        name: 'Cumplimiento Construcción',
        type: 'compliance',
        features: ['REA/ROC', 'Prevención riesgos', 'Subcontratación', 'Licencias obra']
      },
      {
        key: 'construction-ai',
        name: 'IA Construcción',
        type: 'ai',
        features: ['Estimación costes', 'Planificación IA', 'Control avance', 'BIM integración']
      },
      {
        key: 'construction-management',
        name: 'Gestión Construcción',
        type: 'management',
        features: ['Proyectos', 'Partes obra', 'Maquinaria', 'Materiales']
      }
    ]
  },
  {
    id: 'government',
    name: 'Sector Público',
    icon: <Landmark className="h-5 w-5" />,
    description: 'Administración pública y entidades locales',
    color: 'from-blue-600 to-indigo-700',
    modules: [
      {
        key: 'government-accounting',
        name: 'Contabilidad Pública',
        type: 'accounting',
        features: ['Presupuesto público', 'Contabilidad patrimonial', 'Tesorería pública', 'Fiscalización']
      },
      {
        key: 'government-compliance',
        name: 'Cumplimiento Público',
        type: 'compliance',
        features: ['Transparencia', 'ENS', 'LOPDGDD pública', 'Contratación pública']
      },
      {
        key: 'government-ai',
        name: 'IA Pública',
        type: 'ai',
        features: ['Atención ciudadana', 'Predicción demanda', 'Detección fraude', 'Optimización recursos']
      },
      {
        key: 'government-management',
        name: 'Gestión Pública',
        type: 'management',
        features: ['Expedientes', 'Registro entrada/salida', 'Gestión personal', 'Patrimonio']
      }
    ]
  },
  {
    id: 'ngo',
    name: 'ONGs',
    icon: <Leaf className="h-5 w-5" />,
    description: 'Organizaciones sin ánimo de lucro',
    color: 'from-emerald-500 to-green-600',
    modules: [
      {
        key: 'ngo-accounting',
        name: 'Contabilidad ONG',
        type: 'accounting',
        features: ['Plan contable ONG', 'Proyectos subvencionados', 'Justificación gastos', 'Donaciones']
      },
      {
        key: 'ngo-compliance',
        name: 'Cumplimiento ONG',
        type: 'compliance',
        features: ['Ley transparencia', 'Auditoría cuentas', 'Utilidad pública', 'LOPD voluntariado']
      },
      {
        key: 'ngo-ai',
        name: 'IA para ONG',
        type: 'ai',
        features: ['Captación fondos IA', 'Impacto social', 'Predicción donantes', 'Optimización campañas']
      },
      {
        key: 'ngo-management',
        name: 'Gestión ONG',
        type: 'management',
        features: ['Proyectos', 'Voluntariado', 'Beneficiarios', 'Campañas']
      }
    ]
  }
];

const getModuleTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    accounting: <BarChart3 className="h-4 w-4" />,
    compliance: <Shield className="h-4 w-4" />,
    ai: <Brain className="h-4 w-4" />,
    management: <Building2 className="h-4 w-4" />
  };
  return icons[type] || <Package className="h-4 w-4" />;
};

const getModuleTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    accounting: 'Contabilidad',
    compliance: 'Cumplimiento',
    ai: 'Inteligencia Artificial',
    management: 'Gestión'
  };
  return labels[type] || type;
};

export const VerticalModuleGenerator: React.FC = () => {
  const [selectedVertical, setSelectedVertical] = useState<VerticalConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedModules, setGeneratedModules] = useState<string[]>([]);

  const handleGenerateVertical = async () => {
    if (!selectedVertical) return;
    
    setGenerating(true);
    setProgress(0);
    setGeneratedModules([]);
    
    try {
      const totalModules = selectedVertical.modules.length;
      
      for (let i = 0; i < totalModules; i++) {
        const module = selectedVertical.modules[i];
        
        // Verificar si ya existe
        const { data: existing } = await supabase
          .from('app_modules')
          .select('id')
          .eq('module_key', module.key)
          .single();
        
        if (!existing) {
          // Crear el módulo
          const { error } = await supabase
            .from('app_modules')
            .insert([{
              module_key: module.key,
              module_name: module.name,
              description: `Módulo de ${getModuleTypeLabel(module.type)} para el sector ${selectedVertical.name}`,
              category: 'vertical' as const,
              sector: selectedVertical.id as any,
              version: '1.0.0',
              base_price: module.type === 'ai' ? 99 : module.type === 'compliance' ? 79 : 49,
              is_core: false,
              is_required: false,
              features: { items: module.features },
              dependencies: module.type !== 'management' ? [`${selectedVertical.id}-management`] : null,
              module_icon: module.type === 'ai' ? 'brain' : module.type === 'compliance' ? 'shield' : module.type === 'accounting' ? 'calculator' : 'building'
            }]);
          
          if (error) {
            console.error('Error creating module:', error);
          } else {
            setGeneratedModules(prev => [...prev, module.key]);
          }
        } else {
          setGeneratedModules(prev => [...prev, `${module.key} (existente)`]);
        }
        
        setProgress(((i + 1) / totalModules) * 100);
        
        // Pequeña pausa para efecto visual
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success(`Vertical ${selectedVertical.name} generada`, {
        description: `${totalModules} módulos procesados`
      });
      
    } catch (error) {
      console.error('Error generating vertical:', error);
      toast.error('Error al generar la vertical');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/40 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Generador de Verticales</h2>
          <p className="text-sm text-muted-foreground">
            Genera automáticamente los 4 módulos base para cada sector
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vertical Selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Selecciona un sector</CardTitle>
            <CardDescription>
              Cada vertical incluye: Contabilidad, Cumplimiento, IA y Gestión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {VERTICALS.map(vertical => (
                  <div
                    key={vertical.id}
                    onClick={() => !generating && setSelectedVertical(vertical)}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all",
                      selectedVertical?.id === vertical.id
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-transparent bg-muted/30 hover:bg-muted/50",
                      generating && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                        vertical.color
                      )}>
                        {vertical.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{vertical.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {vertical.description}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">4 módulos</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Selected Vertical Details */}
        <div className="space-y-4">
          {selectedVertical ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
                      selectedVertical.color
                    )}>
                      {selectedVertical.icon}
                    </div>
                    <div>
                      <CardTitle>{selectedVertical.name}</CardTitle>
                      <CardDescription>4 módulos a generar</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedVertical.modules.map(module => (
                    <div 
                      key={module.key}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getModuleTypeIcon(module.type)}
                        <span className="font-medium text-sm">{module.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {getModuleTypeLabel(module.type)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {module.features.slice(0, 2).map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                        {module.features.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{module.features.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <Button 
                    onClick={handleGenerateVertical}
                    disabled={generating}
                    className="w-full"
                    size="lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar Vertical
                      </>
                    )}
                  </Button>
                  
                  {generating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round(progress)}% completado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {generatedModules.length > 0 && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Módulos generados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {generatedModules.map((key, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="font-mono text-xs">{key}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h4 className="font-semibold mb-2">Selecciona un sector</h4>
                <p className="text-sm text-muted-foreground">
                  Elige un sector de la lista para ver los módulos que se generarán
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerticalModuleGenerator;
