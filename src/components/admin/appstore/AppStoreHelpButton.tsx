import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  HelpCircle, BookOpen, MessageCircle, CheckCircle2, 
  ArrowRight, Package, Rocket, Edit3, FileCode2,
  Database, Store, RefreshCw, AlertTriangle, Sparkles,
  GitBranch, History, Tag, Upload, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const AppStoreHelpButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('guide');

  const helpSections: HelpSection[] = [
    {
      id: 'overview',
      title: '1. Vista General del Sistema',
      icon: <Store className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            El App Store es el centro de gestión de módulos de la plataforma. Aquí puedes:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Catálogo:</strong> Ver todos los módulos disponibles (93 módulos en tienda)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Instalados:</strong> Gestionar módulos activos en tu organización</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Estado:</strong> Ver dashboard de publicación y cobertura</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Publicar:</strong> Publicar nuevos módulos o actualizaciones</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Generar CNAE:</strong> Crear módulos sectoriales automáticamente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Cobertura:</strong> Analizar qué módulos tienen código implementado</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
              <span><strong>Verticales:</strong> Generar packs completos por sector</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'process-new',
      title: '2. Proceso A: Publicar Módulo Nuevo',
      icon: <Rocket className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">📋 Resumen del Proceso</h4>
            <p className="text-sm text-muted-foreground">
              Este proceso se usa cuando quieres añadir un módulo completamente nuevo al catálogo de la tienda.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">1</div>
              <div className="flex-1">
                <h5 className="font-medium">Preparar el Código del Módulo</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Primero debes tener el código fuente del módulo implementado en el proyecto:
                </p>
                <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                  <li>• Componentes React en <code className="bg-muted px-1 rounded">src/components/</code></li>
                  <li>• Hooks en <code className="bg-muted px-1 rounded">src/hooks/</code></li>
                  <li>• Páginas en <code className="bg-muted px-1 rounded">src/pages/</code></li>
                  <li>• Edge Functions si aplica</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">2</div>
              <div className="flex-1">
                <h5 className="font-medium">Ir a la Pestaña "Publicar"</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Navega a <Badge variant="outline">App Store → Publicar</Badge> para acceder al panel de publicación.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">3</div>
              <div className="flex-1">
                <h5 className="font-medium">Rellenar Formulario de Publicación</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Completa todos los campos obligatorios:
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <strong>module_key:</strong> identificador único (ej: crm-custom-feature)
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <strong>module_name:</strong> nombre visible en tienda
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <strong>category:</strong> categoría del módulo
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <strong>version:</strong> versión inicial (ej: 1.0.0)
                  </div>
                  <div className="p-2 bg-muted/50 rounded col-span-2">
                    <strong>description:</strong> descripción clara de funcionalidades
                  </div>
                  <div className="p-2 bg-muted/50 rounded col-span-2">
                    <strong>features:</strong> lista de características principales
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">4</div>
              <div className="flex-1">
                <h5 className="font-medium">Configurar Dependencias y Precio</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Define las dependencias con otros módulos y establece el precio base si aplica.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold">5</div>
              <div className="flex-1">
                <h5 className="font-medium text-green-600">Publicar</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Haz clic en "Publicar Módulo". El sistema:
                </p>
                <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                  <li>✓ Inserta registro en <code className="bg-muted px-1 rounded">app_modules</code></li>
                  <li>✓ Crea versión inicial en <code className="bg-muted px-1 rounded">module_versions</code></li>
                  <li>✓ El módulo aparece inmediatamente en el catálogo</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Diagrama visual */}
          <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Diagrama de Flujo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs">
                <div className="text-center p-2 bg-background rounded border">
                  <FileCode2 className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  Código
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Edit3 className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                  Formulario
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Database className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  app_modules
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Tag className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  module_versions
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border border-green-500/50">
                  <Store className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  ¡En Tienda!
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'process-update',
      title: '3. Proceso B: Actualizar Módulo Existente',
      icon: <RefreshCw className="h-5 w-5" />,
      content: (
        <div className="space-y-6">
          <div className="p-4 bg-amber-500/5 rounded-lg border border-amber-500/20">
            <h4 className="font-semibold text-amber-600 mb-2">📋 Resumen del Proceso</h4>
            <p className="text-sm text-muted-foreground">
              Este proceso se usa cuando modificas el código de un módulo existente y quieres publicar la actualización.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">1</div>
              <div className="flex-1">
                <h5 className="font-medium">Modificar el Código del Módulo</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Realiza las modificaciones necesarias en los archivos del módulo. Por ejemplo:
                </p>
                <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                  <li>• Añadir campo IBAN a <code className="bg-muted px-1 rounded">CompanyForm.tsx</code></li>
                  <li>• Añadir nueva funcionalidad a un panel</li>
                  <li>• Corregir bugs o mejorar rendimiento</li>
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">2</div>
              <div className="flex-1">
                <h5 className="font-medium">Verificar los Cambios Funcionan</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Prueba que los cambios funcionan correctamente antes de publicar.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">3</div>
              <div className="flex-1">
                <h5 className="font-medium">Ir a "Publicar" → Seleccionar Módulo Existente</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  En el panel de publicación, selecciona el módulo que deseas actualizar del dropdown.
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">4</div>
              <div className="flex-1">
                <h5 className="font-medium">Incrementar Versión y Documentar Cambios</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Actualiza el número de versión siguiendo <strong>semver</strong>:
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                    <strong>PATCH</strong> (1.0.1)
                    <p className="text-xs text-muted-foreground">Correcciones menores</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                    <strong>MINOR</strong> (1.1.0)
                    <p className="text-xs text-muted-foreground">Nuevas funcionalidades</p>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                    <strong>MAJOR</strong> (2.0.0)
                    <p className="text-xs text-muted-foreground">Cambios incompatibles</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 font-bold">5</div>
              <div className="flex-1">
                <h5 className="font-medium">Escribir Changelog y Release Notes</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Documenta qué cambios se hicieron para el historial:
                </p>
                <div className="mt-2 p-3 bg-muted rounded text-sm font-mono">
                  <p className="text-green-600">+ Añadido campo IBAN al formulario</p>
                  <p className="text-blue-600">~ Mejorado rendimiento de carga</p>
                  <p className="text-red-600">- Eliminado campo obsoleto</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-600 font-bold">6</div>
              <div className="flex-1">
                <h5 className="font-medium text-green-600">Republicar</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  Haz clic en "Actualizar Módulo". El sistema:
                </p>
                <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                  <li>✓ Actualiza registro en <code className="bg-muted px-1 rounded">app_modules</code></li>
                  <li>✓ Marca versión anterior como no-latest</li>
                  <li>✓ Crea nueva versión en <code className="bg-muted px-1 rounded">module_versions</code></li>
                  <li>✓ Los usuarios ven la nueva versión disponible</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Diagrama visual */}
          <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Diagrama de Actualización
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs">
                <div className="text-center p-2 bg-background rounded border">
                  <Edit3 className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  Modificar<br/>Código
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Package className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                  Seleccionar<br/>Módulo
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Tag className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  Nueva<br/>Versión
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border">
                  <Upload className="h-6 w-6 mx-auto mb-1 text-green-500" />
                  Changelog
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="text-center p-2 bg-background rounded border border-green-500/50">
                  <RefreshCw className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  ¡Actualizado!
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'tables',
      title: '4. Tablas de Base de Datos',
      icon: <Database className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            El sistema utiliza las siguientes tablas para gestionar los módulos:
          </p>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                app_modules
              </CardTitle>
              <CardDescription>Catálogo principal de módulos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 font-mono">
                <p>• id, module_key, module_name</p>
                <p>• description, category, sector</p>
                <p>• version, base_price, features</p>
                <p>• dependencies, is_core, is_required</p>
                <p>• documentation_url, screenshots, changelog</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-purple-500" />
                module_versions
              </CardTitle>
              <CardDescription>Historial de versiones publicadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 font-mono">
                <p>• id, module_id, version</p>
                <p>• changelog, release_notes</p>
                <p>• published_at, published_by</p>
                <p>• is_latest, is_stable</p>
                <p>• download_count, migration_script</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4 text-green-500" />
                installed_modules
              </CardTitle>
              <CardDescription>Módulos instalados por organización</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1 font-mono">
                <p>• id, module_id, organization_id</p>
                <p>• is_active, installed_at, installed_by</p>
                <p>• license_type, license_key, valid_until</p>
                <p>• settings</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'coverage',
      title: '5. Análisis de Cobertura',
      icon: <Sparkles className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            El analizador de cobertura compara los módulos en la tienda (app_modules) con el código implementado en el proyecto.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="font-medium">Implementado</p>
                <p className="text-xs text-muted-foreground">Código completo funcional</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-3 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="font-medium">Parcial</p>
                <p className="text-xs text-muted-foreground">Funcionalidad básica</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-3 text-center">
                <Package className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="font-medium">Sin Código</p>
                <p className="text-xs text-muted-foreground">Solo metadata en tienda</p>
              </CardContent>
            </Card>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">Para implementar un módulo sin código:</h5>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li>1. Usa el <strong>Generador de Verticales</strong> para crear estructura base</li>
              <li>2. O pide a Lovable que genere el componente específico</li>
              <li>3. Una vez implementado, republica el módulo con nueva versión</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'verticals',
      title: '6. Generador de Verticales',
      icon: <Package className="h-5 w-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Los verticales son packs de 4 módulos especializados para un sector específico:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <strong className="text-blue-600">Contabilidad</strong>
              <p className="text-xs text-muted-foreground">Plan contable, facturación, costes</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <strong className="text-purple-600">Cumplimiento</strong>
              <p className="text-xs text-muted-foreground">Normativa, auditorías, certificaciones</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <strong className="text-green-600">IA Sectorial</strong>
              <p className="text-xs text-muted-foreground">Predicciones, optimización, análisis</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <strong className="text-amber-600">Gestión</strong>
              <p className="text-xs text-muted-foreground">Operaciones específicas del sector</p>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <h5 className="font-medium mb-2">Sectores disponibles:</h5>
            <div className="flex flex-wrap gap-2">
              {['Agricultura', 'Salud', 'Educación', 'Legal', 'Industria', 'Logística', 'Hostelería', 'Retail', 'Inmobiliaria', 'Energía', 'Construcción', 'Sector Público', 'ONGs'].map(s => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Ayuda
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Guía Completa del App Store
          </SheetTitle>
          <SheetDescription>
            Todo lo que necesitas saber para publicar y gestionar módulos
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-120px)]">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="guide" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Guía
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="guide" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-6 pt-4">
                {helpSections.map((section, index) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        {section.icon}
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {section.content}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="faq" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">¿Cómo sé si un módulo tiene código implementado?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Ve a la pestaña "Cobertura" del App Store. Los módulos con ✅ verde tienen código completo, ⚠️ amarillo tienen código parcial, y ❌ rojo solo existen en la tienda sin código.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">¿Qué pasa si publico un módulo sin código?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    El módulo aparecerá en el catálogo pero los usuarios no podrán usar funcionalidades. Es útil para "reservar" el módulo y mostrar que está planificado. Luego puedes implementar el código y republicar.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">¿Cómo añado dependencias entre módulos?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    En el formulario de publicación, añade los module_key de los módulos requeridos en el campo "dependencies". Los usuarios no podrán instalar tu módulo sin tener instaladas las dependencias.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">¿Puedo hacer rollback a una versión anterior?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Sí, en Module Studio → Rollback puedes ver el historial de versiones y restaurar una versión anterior. El sistema marcará esa versión como "latest" y los usuarios recibirán la versión restaurada.
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">¿Cómo genero módulos para un sector específico?</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Usa el "Generador de Verticales" en App Store. Selecciona un sector (ej: Agricultura) y el sistema generará automáticamente 4 módulos: Contabilidad, Cumplimiento, IA y Gestión específicos para ese sector.
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

export default AppStoreHelpButton;
