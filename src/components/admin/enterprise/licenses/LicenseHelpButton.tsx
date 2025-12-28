/**
 * LicenseHelpButton - Comprehensive help guide for License Management System
 * Similar to ModuleStudioHelpButton pattern
 */

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
  HelpCircle, BookOpen, Key, Shield, BarChart3, Zap,
  ArrowRight, Settings, AlertTriangle, Users, Laptop,
  FileText, CheckCircle2, RefreshCw, Lock, Unlock,
  Activity, Target, Clock, TrendingUp, Database,
  Bot, Sparkles, Download, Upload, Search, Network
} from 'lucide-react';

interface TabGuide {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  actions: string[];
  workflow: string[];
}

const LICENSE_TABS: TabGuide[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <Shield className="h-4 w-4" />,
    description: 'Vista general del sistema de licencias con métricas clave y acceso rápido.',
    actions: [
      'Ver licencias activas y estadísticas',
      'Acceder a generación de licencias',
      'Gestionar dispositivos activados',
      'Revisar analytics de uso',
      'Consultar alertas de anomalías'
    ],
    workflow: [
      'Revisa las métricas en las tarjetas superiores',
      'Usa las pestañas internas para navegar',
      'Genera nuevas licencias desde "Generar"',
      'Monitoriza dispositivos desde "Dispositivos"'
    ]
  },
  {
    id: 'analytics',
    name: 'Analítica',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'Reportes detallados, gráficos de tendencias y métricas de negocio.',
    actions: [
      'Ver gráficos de tendencias',
      'Analizar ingresos por período',
      'Comparar planes de licencia',
      'Exportar datos a Excel/PDF',
      'Configurar reportes automáticos'
    ],
    workflow: [
      'Selecciona el rango de fechas deseado',
      'Filtra por tipo de licencia o plan',
      'Analiza las métricas clave',
      'Exporta los datos si es necesario'
    ]
  },
  {
    id: 'automation',
    name: 'Automatización',
    icon: <Zap className="h-4 w-4" />,
    description: 'Reglas automáticas para gestión de licencias, alertas y renovaciones.',
    actions: [
      'Configurar alertas de expiración',
      'Automatizar limpieza de dispositivos',
      'Programar reportes periódicos',
      'Definir reglas de renovación',
      'Configurar webhooks de eventos'
    ],
    workflow: [
      'Define las reglas de automatización',
      'Configura los umbrales y condiciones',
      'Activa las automatizaciones deseadas',
      'Monitoriza la ejecución en el log'
    ]
  },
  {
    id: 'system',
    name: 'Sistema',
    icon: <Settings className="h-4 w-4" />,
    description: 'Configuración del sistema, API keys, salud y auditoría.',
    actions: [
      'Monitorizar salud del sistema',
      'Gestionar configuración global',
      'Administrar API keys',
      'Consultar logs de auditoría',
      'Ver documentación de API'
    ],
    workflow: [
      'Revisa el estado de salud periódicamente',
      'Ajusta configuración según necesidades',
      'Rota API keys regularmente',
      'Audita accesos y cambios'
    ]
  }
];

const FAQ_ITEMS = [
  {
    question: '¿Cómo genero una nueva licencia?',
    answer: 'Ve a Dashboard → Generar, completa el formulario con email, plan y configuración deseada, y pulsa "Generar Licencia". La clave se mostrará y podrás copiarla o descargarla.'
  },
  {
    question: '¿Cómo funciona la validación de licencias?',
    answer: 'Las licencias usan firma Ed25519 criptográfica. Cuando un cliente activa la licencia, el sistema verifica la firma, comprueba expiración y límites de dispositivos.'
  },
  {
    question: '¿Puedo revocar una licencia activa?',
    answer: 'Sí, desde la lista de licencias puedes cambiar el estado a "revocada". Esto invalida inmediatamente la licencia y desactiva todos los dispositivos asociados.'
  },
  {
    question: '¿Cómo configuro alertas de expiración?',
    answer: 'En Automatización → Alertas de Expiración, configura los días de anticipación (ej: 30, 15, 7 días) y el método de notificación (email, webhook).'
  },
  {
    question: '¿Qué es el heartbeat de licencia?',
    answer: 'Es una comprobación periódica que el cliente envía al servidor para verificar que la licencia sigue activa. Permite detectar uso offline prolongado o anomalías.'
  },
  {
    question: '¿Cómo funcionan los límites de dispositivos?',
    answer: 'Cada licencia tiene un máximo de dispositivos. Al activar en un nuevo dispositivo, se registra su fingerprint. Si se excede el límite, se rechaza la activación.'
  },
  {
    question: '¿Puedo migrar licencias entre planes?',
    answer: 'Sí, puedes actualizar el plan de una licencia existente. Los límites y features se ajustarán automáticamente según el nuevo plan.'
  },
  {
    question: '¿Cómo detecto uso fraudulento?',
    answer: 'El sistema monitoriza anomalías como múltiples IPs, activaciones masivas, o patrones sospechosos. Las alertas aparecen en Dashboard → Alertas.'
  }
];

export function LicenseHelpButton() {
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
            Guía del Sistema de Licencias Enterprise
          </SheetTitle>
          <SheetDescription>
            Manual completo de gestión de licencias, dispositivos y análisis
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-120px)]">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="workflow" className="gap-2 text-xs">
                <ArrowRight className="h-3 w-3" />
                Flujo
              </TabsTrigger>
              <TabsTrigger value="tabs" className="gap-2 text-xs">
                <Settings className="h-3 w-3" />
                Secciones
              </TabsTrigger>
              <TabsTrigger value="faq" className="gap-2 text-xs">
                <HelpCircle className="h-3 w-3" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2 text-xs">
                <Database className="h-3 w-3" />
                API
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-6 pt-4">
                {/* Index */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Índice de Contenidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-1 text-muted-foreground">
                      <li>1. <a href="#overview" className="text-primary hover:underline">Vista General del Sistema</a></li>
                      <li>2. <a href="#generate" className="text-primary hover:underline">Generar Licencias</a></li>
                      <li>3. <a href="#validate" className="text-primary hover:underline">Validar y Activar</a></li>
                      <li>4. <a href="#manage" className="text-primary hover:underline">Gestionar Dispositivos</a></li>
                      <li>5. <a href="#monitor" className="text-primary hover:underline">Monitorizar Uso</a></li>
                      <li>6. <a href="#automate" className="text-primary hover:underline">Automatizar Procesos</a></li>
                    </ol>
                  </CardContent>
                </Card>

                {/* 1. Overview */}
                <Card id="overview">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">1</div>
                      Vista General del Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      El sistema de licencias enterprise proporciona:
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Key className="h-5 w-5 text-blue-500 mb-2" />
                        <strong className="text-blue-600">Generación</strong>
                        <p className="text-xs text-muted-foreground mt-1">Licencias firmadas Ed25519</p>
                      </div>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <Shield className="h-5 w-5 text-green-500 mb-2" />
                        <strong className="text-green-600">Validación</strong>
                        <p className="text-xs text-muted-foreground mt-1">Verificación criptográfica</p>
                      </div>
                      <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                        <Laptop className="h-5 w-5 text-purple-500 mb-2" />
                        <strong className="text-purple-600">Dispositivos</strong>
                        <p className="text-xs text-muted-foreground mt-1">Control de activaciones</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Generate */}
                <Card id="generate">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">2</div>
                      Generar Licencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <Key className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Paso 1: Datos del Cliente</p>
                        <p className="text-sm text-muted-foreground">Email y nombre/empresa del licenciatario.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Target className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Paso 2: Seleccionar Plan</p>
                        <p className="text-sm text-muted-foreground">Elige el plan con las características deseadas.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <Settings className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium">Paso 3: Configurar Límites</p>
                        <p className="text-sm text-muted-foreground">Usuarios máximos, dispositivos y días de validez.</p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Paso 4: Generar y Entregar</p>
                        <p className="text-sm text-muted-foreground">Copia o descarga la clave para el cliente.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Validate */}
                <Card id="validate">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">3</div>
                      Validar y Activar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      El proceso de validación incluye:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Lock className="h-4 w-4 text-blue-500" />
                        <span>Verificación de firma</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span>Comprobación de expiración</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Laptop className="h-4 w-4 text-purple-500" />
                        <span>Límite de dispositivos</span>
                      </div>
                      <div className="p-2 bg-muted/50 rounded flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <span>Estado de la licencia</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Manage */}
                <Card id="manage">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">4</div>
                      Gestionar Dispositivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Desde la pestaña Dispositivos puedes:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex gap-2 items-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Ver todos los dispositivos activados
                      </li>
                      <li className="flex gap-2 items-center">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        Revocar activaciones individuales
                      </li>
                      <li className="flex gap-2 items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Detectar dispositivos sospechosos
                      </li>
                      <li className="flex gap-2 items-center">
                        <Unlock className="h-4 w-4 text-purple-500" />
                        Liberar slots para nuevas activaciones
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* 5. Monitor */}
                <Card id="monitor">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">5</div>
                      Monitorizar Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-blue-500/10 rounded border border-blue-500/20">
                        <strong>Analytics</strong>
                        <p className="text-xs text-muted-foreground">Métricas de uso y tendencias</p>
                      </div>
                      <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
                        <strong>Alertas</strong>
                        <p className="text-xs text-muted-foreground">Anomalías y expiraciones</p>
                      </div>
                      <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                        <strong>Heartbeat</strong>
                        <p className="text-xs text-muted-foreground">Comprobaciones periódicas</p>
                      </div>
                      <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                        <strong>Reportes</strong>
                        <p className="text-xs text-muted-foreground">Informes automáticos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Automate */}
                <Card id="automate">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">6</div>
                      Automatizar Procesos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      El módulo de automatización permite:
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex gap-2 items-center">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Alertas de expiración automáticas
                      </li>
                      <li className="flex gap-2 items-center">
                        <RefreshCw className="h-4 w-4 text-blue-500" />
                        Limpieza de dispositivos inactivos
                      </li>
                      <li className="flex gap-2 items-center">
                        <FileText className="h-4 w-4 text-purple-500" />
                        Reportes programados
                      </li>
                      <li className="flex gap-2 items-center">
                        <Bot className="h-4 w-4 text-green-500" />
                        Copilot IA para análisis
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                {/* Flow Diagram */}
                <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Ciclo de Vida de una Licencia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="text-center p-2 bg-background rounded border min-w-[60px]">
                        <Key className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        Generar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[60px]">
                        <Upload className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        Entregar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[60px]">
                        <Shield className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        Activar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[60px]">
                        <Activity className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                        Usar
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="text-center p-2 bg-background rounded border min-w-[60px]">
                        <RefreshCw className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                        Renovar
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tabs Tab */}
          <TabsContent value="tabs" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {LICENSE_TABS.map((tab) => (
                    <AccordionItem key={tab.id} value={tab.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          {tab.icon}
                          <span className="font-medium">{tab.name}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <p className="text-sm text-muted-foreground">{tab.description}</p>
                          
                          <div>
                            <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2">
                              Acciones Disponibles
                            </h4>
                            <ul className="text-sm space-y-1">
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
                            <h4 className="text-xs font-medium uppercase text-muted-foreground mb-2">
                              Flujo Recomendado
                            </h4>
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

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-4">
                <Accordion type="single" collapsible className="w-full">
                  {FAQ_ITEMS.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        <span className="text-sm">{item.question}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Bot className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">¿No encuentras respuesta?</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Usa el Copilot IA para hacer preguntas específicas sobre el sistema de licencias.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="mt-0 h-[calc(100%-60px)]">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4 pt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Endpoints Disponibles</CardTitle>
                    <CardDescription>API REST para integración con sistemas externos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-600">POST</Badge>
                        <span>/api/licenses/validate</span>
                      </div>
                      <p className="text-muted-foreground">Validar una licencia existente</p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-600">POST</Badge>
                        <span>/api/licenses/activate</span>
                      </div>
                      <p className="text-muted-foreground">Activar licencia en un dispositivo</p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-500/20 text-purple-600">POST</Badge>
                        <span>/api/licenses/deactivate</span>
                      </div>
                      <p className="text-muted-foreground">Desactivar dispositivo</p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-500/20 text-amber-600">POST</Badge>
                        <span>/api/licenses/heartbeat</span>
                      </div>
                      <p className="text-muted-foreground">Verificación periódica de actividad</p>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-cyan-500/20 text-cyan-600">GET</Badge>
                        <span>/api/licenses/check-feature</span>
                      </div>
                      <p className="text-muted-foreground">Verificar acceso a feature específico</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Autenticación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Todas las peticiones requieren API Key en el header:
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg font-mono text-xs">
                      <code>X-API-Key: your-api-key-here</code>
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
}

export default LicenseHelpButton;
