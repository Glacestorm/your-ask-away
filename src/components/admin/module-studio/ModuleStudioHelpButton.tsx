import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, BookOpen, MessageCircle, CheckCircle2, 
  ArrowRight, Package, Rocket, Edit3, FileCode2,
  Database, Store, RefreshCw, AlertTriangle, Sparkles,
  GitBranch, History, Tag, Upload, Download, Bot,
  Eye, TestTube2, Shield, FileText, Users, BarChart3,
  RotateCcw, FlaskConical, Layout, Network, Search
} from 'lucide-react';

interface TabGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  actions: string[];
  workflow: string[];
}

const MODULE_STUDIO_TABS: TabGuide[] = [
  {
    id: 'overview',
    name: 'Info (Overview)',
    icon: <Package className="h-4 w-4" />,
    description: 'Vista general del módulo seleccionado con toda su información básica.',
    actions: [
      'Ver nombre, descripción y versión actual',
      'Ver categoría, sector y precio base',
      'Ver características (features) definidas',
      'Ver dependencias declaradas',
      'Editar módulo pulsando "Editar"'
    ],
    workflow: [
      'Selecciona un módulo de la lista lateral',
      'Revisa la información general',
      'Si necesitas modificar, pulsa "Editar"',
      'Guarda los cambios y luego republica desde App Store'
    ]
  },
  {
    id: 'dependencies',
    name: 'Deps (Dependencias)',
    icon: <GitBranch className="h-4 w-4" />,
    description: 'Grafo visual de dependencias entre módulos. Muestra qué módulos dependen de cuáles.',
    actions: [
      'Ver grafo interactivo de dependencias',
      'Identificar módulos que dependen del actual',
      'Ver cadena de dependencias',
      'Hacer clic en nodos para navegar'
    ],
    workflow: [
      'Analiza las dependencias antes de modificar',
      'Si cambias algo, los módulos dependientes pueden verse afectados',
      'Usa "Análisis IA" para evaluar impacto'
    ]
  },
  {
    id: 'history',
    name: 'Historial',
    icon: <History className="h-4 w-4" />,
    description: 'Historial de versiones publicadas del módulo con notas de cada release.',
    actions: [
      'Ver todas las versiones publicadas',
      'Ver notas de lanzamiento de cada versión',
      'Identificar versión actual (latest)',
      'Ver fechas de publicación'
    ],
    workflow: [
      'Revisa el historial antes de publicar nueva versión',
      'Asegúrate de seguir versionado semántico (semver)',
      'Usa las notas para documentar cambios'
    ]
  },
  {
    id: 'sandbox',
    name: 'Sandbox',
    icon: <TestTube2 className="h-4 w-4" />,
    description: 'Entorno aislado para probar cambios sin afectar producción.',
    actions: [
      'Probar configuraciones del módulo',
      'Simular diferentes escenarios',
      'Validar cambios antes de publicar',
      'Ver preview de funcionalidad'
    ],
    workflow: [
      'Abre sandbox antes de modificar',
      'Prueba los cambios propuestos',
      'Si todo funciona, procede a editar y publicar'
    ]
  },
  {
    id: 'testing',
    name: 'Tests',
    icon: <TestTube2 className="h-4 w-4" />,
    description: 'Panel de testing automatizado para validar funcionalidad del módulo.',
    actions: [
      'Ejecutar tests unitarios',
      'Ver cobertura de código',
      'Identificar tests fallidos',
      'Generar tests con IA'
    ],
    workflow: [
      'Ejecuta tests antes de publicar',
      'Asegura que todos los tests pasen',
      'Añade tests para nuevas funcionalidades'
    ]
  },
  {
    id: 'security',
    name: 'Seguridad',
    icon: <Shield className="h-4 w-4" />,
    description: 'Análisis de seguridad del módulo: permisos, vulnerabilidades, RLS.',
    actions: [
      'Revisar políticas RLS del módulo',
      'Detectar vulnerabilidades potenciales',
      'Ver score de seguridad',
      'Aplicar recomendaciones'
    ],
    workflow: [
      'Revisa seguridad antes de publicar',
      'Asegura que las políticas RLS estén correctas',
      'Corrige vulnerabilidades detectadas'
    ]
  },
  {
    id: 'docs',
    name: 'Docs',
    icon: <FileText className="h-4 w-4" />,
    description: 'Documentación del módulo: guías, API, ejemplos de uso.',
    actions: [
      'Ver documentación existente',
      'Generar documentación con IA',
      'Editar y mejorar docs',
      'Exportar documentación'
    ],
    workflow: [
      'Documenta funcionalidades principales',
      'Incluye ejemplos de uso',
      'Mantén docs actualizadas con cada versión'
    ]
  },
  {
    id: 'collaboration',
    name: 'Equipo',
    icon: <Users className="h-4 w-4" />,
    description: 'Gestión de colaboradores y permisos del módulo.',
    actions: [
      'Ver quién contribuye al módulo',
      'Asignar tareas y responsabilidades',
      'Gestionar permisos de edición',
      'Ver actividad reciente'
    ],
    workflow: [
      'Define roles para cada colaborador',
      'Revisa cambios antes de aprobar',
      'Coordina releases con el equipo'
    ]
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Métricas de uso y rendimiento del módulo.',
    actions: [
      'Ver instalaciones y descargas',
      'Analizar uso por organización',
      'Identificar tendencias',
      'Ver errores reportados'
    ],
    workflow: [
      'Monitoriza adopción del módulo',
      'Identifica módulos más populares',
      'Prioriza mejoras según uso real'
    ]
  },
  {
    id: 'deployment',
    name: 'Deploy',
    icon: <Rocket className="h-4 w-4" />,
    description: 'Gestión de despliegue y distribución del módulo.',
    actions: [
      'Configurar entornos (dev/staging/prod)',
      'Ver estado de despliegue',
      'Programar releases',
      'Rollback si hay problemas'
    ],
    workflow: [
      'Prueba en staging antes de prod',
      'Verifica que todo funcione',
      'Despliega a producción',
      'Monitoriza después del deploy'
    ]
  },
  {
    id: 'marketplace',
    name: 'Market',
    icon: <Store className="h-4 w-4" />,
    description: 'Configuración de presencia en el marketplace.',
    actions: [
      'Configurar listado en tienda',
      'Añadir screenshots y demos',
      'Gestionar precios y licencias',
      'Ver reviews y ratings'
    ],
    workflow: [
      'Prepara assets visuales',
      'Escribe descripción atractiva',
      'Define modelo de precios',
      'Responde a feedback de usuarios'
    ]
  },
  {
    id: 'versioning',
    name: 'Versiones',
    icon: <Tag className="h-4 w-4" />,
    description: 'Gestión avanzada de versiones con tags y releases.',
    actions: [
      'Crear nueva versión',
      'Añadir tags (alpha, beta, stable)',
      'Generar changelog automático',
      'Comparar versiones'
    ],
    workflow: [
      'Decide tipo de versión (patch/minor/major)',
      'Documenta los cambios',
      'Añade tag apropiado',
      'Publica nueva versión'
    ]
  },
  {
    id: 'rollback',
    name: 'Rollback',
    icon: <RotateCcw className="h-4 w-4" />,
    description: 'Restaurar versiones anteriores en caso de problemas.',
    actions: [
      'Ver historial de versiones',
      'Comparar con versión actual',
      'Ejecutar rollback',
      'Verificar restauración'
    ],
    workflow: [
      'Identifica la versión estable anterior',
      'Verifica compatibilidad',
      'Ejecuta rollback',
      'Comunica a usuarios afectados'
    ]
  },
  {
    id: 'abtesting',
    name: 'A/B Test',
    icon: <FlaskConical className="h-4 w-4" />,
    description: 'Pruebas A/B para validar cambios antes de desplegar globalmente.',
    actions: [
      'Crear experimento A/B',
      'Definir grupos de usuarios',
      'Monitorizar resultados',
      'Decidir ganador'
    ],
    workflow: [
      'Define hipótesis a validar',
      'Configura variantes',
      'Ejecuta experimento',
      'Analiza resultados y decide'
    ]
  },
  {
    id: 'export',
    name: 'Export',
    icon: <Download className="h-4 w-4" />,
    description: 'Exportar e importar módulos en diferentes formatos.',
    actions: [
      'Exportar a JSON/YAML/ZIP',
      'Incluir assets y configuraciones',
      'Importar módulos externos',
      'Validar importaciones'
    ],
    workflow: [
      'Selecciona formato de exportación',
      'Incluye dependencias si necesario',
      'Descarga el paquete',
      'Importa en otro entorno'
    ]
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: <Layout className="h-4 w-4" />,
    description: 'Plantillas predefinidas para crear nuevos módulos rápidamente.',
    actions: [
      'Ver plantillas disponibles',
      'Crear módulo desde plantilla',
      'Guardar módulo como plantilla',
      'Personalizar plantillas'
    ],
    workflow: [
      'Elige plantilla adecuada',
      'Personaliza nombre y config',
      'Genera estructura base',
      'Completa implementación'
    ]
  }
];

export const ModuleStudioHelpButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('workflow');

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <HelpCircle className="h-4 w-4" />
          Ayuda
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[700px] sm:max-w-[700px] p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Guía Completa del Module Studio
          </SheetTitle>
          <SheetDescription>
            Manual detallado de cada función y flujo de trabajo ordenado
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-120px)]">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="workflow" className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Flujo de Trabajo
              </TabsTrigger>
              <TabsTrigger value="tabs" className="gap-2">
                <Layout className="h-4 w-4" />
                Pestañas
              </TabsTrigger>
              <TabsTrigger value="panels" className="gap-2">
                <Bot className="h-4 w-4" />
                Paneles IA
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Flujo de Trabajo Ordenado */}
          <TabsContent value="workflow" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-6 pt-4">
                {/* Índice */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Índice de Contenidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. <a href="#layout" className="text-primary hover:underline">Entendiendo el Layout</a></li>
                      <li>2. <a href="#select" className="text-primary hover:underline">Seleccionar un Módulo</a></li>
                      <li>3. <a href="#analyze" className="text-primary hover:underline">Analizar el Módulo</a></li>
                      <li>4. <a href="#modify" className="text-primary hover:underline">Modificar el Módulo</a></li>
                      <li>5. <a href="#test" className="text-primary hover:underline">Probar los Cambios</a></li>
                      <li>6. <a href="#version" className="text-primary hover:underline">Gestionar Versión</a></li>
                      <li>7. <a href="#publish" className="text-primary hover:underline">Publicar Actualización</a></li>
                      <li>8. <a href="#monitor" className="text-primary hover:underline">Monitorizar Post-Publicación</a></li>
                    </ol>
                  </CardContent>
                </Card>

                {/* 1. Layout */}
                <Card id="layout">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">1</div>
                      Entendiendo el Layout
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <strong className="text-blue-600">Sidebar Izquierdo</strong>
                        <p className="text-xs text-muted-foreground mt-1">Lista de módulos. Buscar y seleccionar.</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <strong className="text-green-600">Panel Central</strong>
                        <p className="text-xs text-muted-foreground mt-1">Contenido de la pestaña activa.</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <strong className="text-purple-600">Panel Copilot</strong>
                        <p className="text-xs text-muted-foreground mt-1">Asistente IA conversacional.</p>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <strong className="text-amber-600">Panel Agent</strong>
                        <p className="text-xs text-muted-foreground mt-1">Agente autónomo para tareas.</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <strong>Botones superiores:</strong> Usa los botones Preview, Copilot y Agent para mostrar/ocultar paneles laterales.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Seleccionar */}
                <Card id="select">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">2</div>
                      Seleccionar un Módulo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Search className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Buscar en el sidebar</p>
                        <p className="text-sm text-muted-foreground">Usa el campo de búsqueda para filtrar por nombre, key o descripción.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Package className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Información en cada item</p>
                        <p className="text-sm text-muted-foreground">
                          Cada módulo muestra: nombre, versión, categoría, y contadores de dependencias (↓ depende de, ↑ dependientes).
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Click para seleccionar</p>
                        <p className="text-sm text-muted-foreground">El panel central se actualizará con la información del módulo.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Analizar */}
                <Card id="analyze">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">3</div>
                      Analizar el Módulo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Antes de modificar, analiza el estado actual:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span><strong>Info:</strong> Datos básicos</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-purple-500" />
                        <span><strong>Deps:</strong> Dependencias</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span><strong>Seguridad:</strong> Vulnerabilidades</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-500" />
                        <span><strong>Análisis IA:</strong> Impacto de cambios</span>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm">
                        <strong>💡 Consejo:</strong> Pulsa "Análisis IA" para que el sistema evalúe el impacto potencial de modificaciones.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Modificar */}
                <Card id="modify">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">4</div>
                      Modificar el Módulo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Edit3 className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Pulsa "Editar" en la pestaña Info</p>
                        <p className="text-sm text-muted-foreground">Se abrirá el formulario de edición del módulo.</p>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="font-medium mb-2">Campos editables:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• <strong>Nombre y descripción</strong></li>
                        <li>• <strong>Features:</strong> Lista de características</li>
                        <li>• <strong>Versión:</strong> Incrementar según semver</li>
                        <li>• <strong>Dependencias:</strong> Módulos requeridos</li>
                        <li>• <strong>Precio base:</strong> Si aplica</li>
                      </ul>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Bot className="h-5 w-5 text-purple-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Usa el Copilot o Agent</p>
                        <p className="text-sm text-muted-foreground">
                          Pide sugerencias o que genere código automáticamente para nuevas funcionalidades.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Probar */}
                <Card id="test">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">5</div>
                      Probar los Cambios
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                        <strong>Sandbox</strong>
                        <p className="text-xs text-muted-foreground">Entorno aislado para pruebas</p>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                        <strong>Tests</strong>
                        <p className="text-xs text-muted-foreground">Tests automatizados</p>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                        <strong>Preview</strong>
                        <p className="text-xs text-muted-foreground">Vista previa visual</p>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
                        <strong>A/B Test</strong>
                        <p className="text-xs text-muted-foreground">Pruebas con usuarios reales</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Versionar */}
                <Card id="version">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">6</div>
                      Gestionar Versión
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      En la pestaña <strong>Versiones</strong> puedes:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex gap-2">
                        <Tag className="h-4 w-4 text-primary mt-0.5" />
                        <span>Crear nueva versión con número semántico</span>
                      </li>
                      <li className="flex gap-2">
                        <FileText className="h-4 w-4 text-primary mt-0.5" />
                        <span>Generar changelog automático con IA</span>
                      </li>
                      <li className="flex gap-2">
                        <Badge className="text-xs">alpha</Badge>
                        <Badge className="text-xs">beta</Badge>
                        <Badge className="text-xs">stable</Badge>
                        <span className="text-muted-foreground">Añadir tags</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* 7. Publicar */}
                <Card id="publish">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 text-sm font-bold">7</div>
                      Publicar Actualización
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Una vez todo esté listo, ve a <strong>App Store → Publicar</strong>:
                    </p>
                    <ol className="text-sm space-y-2 text-muted-foreground">
                      <li>1. Selecciona el módulo modificado</li>
                      <li>2. Verifica la nueva versión</li>
                      <li>3. Añade notas de lanzamiento</li>
                      <li>4. Pulsa "Actualizar Módulo"</li>
                    </ol>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-700">
                        ✅ El sistema actualizará <code>app_modules</code> y creará entrada en <code>module_versions</code>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 8. Monitorizar */}
                <Card id="monitor">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">8</div>
                      Monitorizar Post-Publicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Después de publicar, monitoriza:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>Analytics:</strong> Adopción y uso
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>Deploy:</strong> Estado de despliegue
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>Rollback:</strong> Si hay problemas
                      </div>
                      <div className="p-2 bg-muted/50 rounded">
                        <strong>Market:</strong> Reviews de usuarios
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Diagrama de flujo general */}
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Diagrama de Flujo Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <Search className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        Buscar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <Package className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        Seleccionar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <Sparkles className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                        Analizar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <Edit3 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        Editar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <TestTube2 className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        Probar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[70px]">
                        <Tag className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        Versionar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border border-green-500/50 min-w-[70px]">
                        <Rocket className="h-5 w-5 mx-auto mb-1 text-green-600" />
                        Publicar
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Pestañas detalladas */}
          <TabsContent value="tabs" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {MODULE_STUDIO_TABS.map((tab) => (
                    <AccordionItem key={tab.id} value={tab.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {tab.icon}
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{tab.name}</p>
                            <p className="text-xs text-muted-foreground font-normal">{tab.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pl-12">
                        <div className="space-y-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">Acciones disponibles:</h5>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                              {tab.actions.map((action, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Separator />
                          <div>
                            <h5 className="font-medium text-sm mb-2">Flujo de trabajo:</h5>
                            <ol className="text-sm space-y-1 text-muted-foreground">
                              {tab.workflow.map((step, i) => (
                                <li key={i}>{i + 1}. {step}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Paneles IA */}
          <TabsContent value="panels" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-6 pt-4">
                {/* Preview Panel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Panel Preview
                    </CardTitle>
                    <CardDescription>Botón: "Preview" en la barra superior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Muestra una vista previa visual del módulo seleccionado con sus componentes renderizados.
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Ver cómo se ve el módulo en tiempo real</li>
                      <li>• Previsualizar cambios antes de guardar</li>
                      <li>• Detectar problemas visuales</li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Copilot Panel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-500" />
                      Panel Copilot
                    </CardTitle>
                    <CardDescription>Botón: "Copilot" en la barra superior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Asistente de IA conversacional que entiende el contexto del módulo actual.
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Pregunta:</strong> "¿Qué hace este módulo?"</li>
                      <li>• <strong>Sugiere:</strong> "¿Qué mejoras recomiendas?"</li>
                      <li>• <strong>Analiza:</strong> "Analiza las dependencias"</li>
                      <li>• <strong>Genera:</strong> "Genera documentación"</li>
                      <li>• <strong>Explica:</strong> "Explica el impacto de cambiar X"</li>
                    </ul>
                    <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <p className="text-sm">
                        <strong>💡 El Copilot siempre conoce</strong> el módulo seleccionado, sus datos, dependencias y estado actual.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Panel */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Panel Agent (Autónomo)
                    </CardTitle>
                    <CardDescription>Botón: "Agent" en la barra superior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Agente autónomo que puede ejecutar tareas complejas de forma independiente.
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• <strong>Auditoría completa:</strong> Analiza seguridad, rendimiento, código</li>
                      <li>• <strong>Refactoring:</strong> Sugiere y aplica mejoras de código</li>
                      <li>• <strong>Generación:</strong> Crea componentes, tests, documentación</li>
                      <li>• <strong>Optimización:</strong> Mejora rendimiento automáticamente</li>
                      <li>• <strong>Migración:</strong> Actualiza dependencias</li>
                    </ul>
                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <p className="text-sm">
                        <strong>⚠️ Importante:</strong> El agente puede modificar código. Revisa siempre sus propuestas antes de aprobar.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Análisis IA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-500" />
                      Botón "Análisis IA"
                    </CardTitle>
                    <CardDescription>Ubicación: Junto al botón "Editar"</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Análisis de impacto de cambios propuestos:
                    </p>
                    <ul className="text-sm space-y-1">
                      <li>• Evalúa qué módulos se verán afectados</li>
                      <li>• Identifica riesgos potenciales</li>
                      <li>• Sugiere orden de implementación</li>
                      <li>• Estima complejidad del cambio</li>
                    </ul>
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm">
                        <strong>✅ Recomendación:</strong> Siempre ejecuta Análisis IA antes de modificar módulos core o con muchos dependientes.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default ModuleStudioHelpButton;
