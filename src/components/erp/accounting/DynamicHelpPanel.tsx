/**
 * DynamicHelpPanel - Panel de ayuda dinámica que se actualiza según módulos instalados
 * Incluye documentación completa de contabilidad, menús y procedimientos
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  BookOpen,
  FileText,
  Calculator,
  Receipt,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Building2,
  Calendar,
  BarChart3,
  Layers,
  FileCheck,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccountingChatbot } from './AccountingChatbot';
import { RegulationsPanel } from './RegulationsPanel';
import { useERPDynamicHelp } from '@/hooks/erp/useERPDynamicHelp';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  topics: HelpTopic[];
}

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  regulation?: string;
}

interface DynamicHelpPanelProps {
  installedModules: string[];
  country?: string;
  companyName?: string;
  className?: string;
}

// Definición completa de ayuda por módulo
const MODULE_HELP_SECTIONS: Record<string, HelpSection> = {
  accounting: {
    id: 'accounting',
    title: 'Contabilidad',
    icon: Calculator,
    description: 'Gestión contable completa según PGC',
    topics: [
      {
        id: 'acc-intro',
        title: 'Introducción al módulo',
        content: `## Módulo de Contabilidad

El módulo de Contabilidad permite la gestión integral de la contabilidad financiera de la empresa según el Plan General Contable (PGC).

### Funcionalidades principales:
- **Asientos contables**: Registro de operaciones con partida doble
- **Plan de cuentas**: Gestión del cuadro de cuentas personalizable
- **Libros oficiales**: Diario, Mayor, Balance de Sumas y Saldos
- **Estados financieros**: Balance, Cuenta de PyG, ECPN, EFE
- **Cierre contable**: Regularización y cierre del ejercicio
- **Informes fiscales**: Modelos 303, 390, 347, 349, etc.`,
        tags: ['introducción', 'funcionalidades'],
      },
      {
        id: 'acc-entries',
        title: 'Asientos contables',
        content: `## Asientos Contables

### ¿Qué es un asiento contable?
Un asiento contable es el registro de una operación económica aplicando el principio de partida doble: todo cargo tiene un abono de igual importe.

### Crear un asiento:
1. Ir a **Contabilidad → Asientos → Nuevo**
2. Seleccionar fecha y serie
3. Añadir líneas de cargo (Debe) y abono (Haber)
4. Verificar que el asiento esté cuadrado
5. Guardar o contabilizar

### Tipos de asientos:
- **Asiento simple**: Una cuenta en Debe y una en Haber
- **Asiento compuesto**: Múltiples cuentas
- **Asiento de apertura**: Inicio del ejercicio
- **Asiento de cierre**: Regularización y cierre

### Ejemplo - Venta con IVA:
\`\`\`
(430) Clientes                    1.210,00€ (Debe)
   (700) Ventas                            1.000,00€ (Haber)
   (477) HP IVA Repercutido                  210,00€ (Haber)
\`\`\``,
        tags: ['asientos', 'partida doble', 'registros'],
        regulation: 'PGC - Normas de registro y valoración',
      },
      {
        id: 'acc-accounts',
        title: 'Plan de cuentas',
        content: `## Plan General Contable (PGC)

### Estructura del PGC:
El PGC se estructura en 9 grupos:

| Grupo | Nombre | Tipo |
|-------|--------|------|
| 1 | Financiación básica | Pasivo no corriente |
| 2 | Activo no corriente | Activo |
| 3 | Existencias | Activo corriente |
| 4 | Acreedores/Deudores | Activo/Pasivo |
| 5 | Cuentas financieras | Activo/Pasivo |
| 6 | Compras y gastos | Gastos |
| 7 | Ventas e ingresos | Ingresos |
| 8 | Gastos PyG | Patrimonio Neto |
| 9 | Ingresos PyG | Patrimonio Neto |

### Codificación:
- **Nivel 1**: Grupo (1 dígito)
- **Nivel 2**: Subgrupo (2 dígitos)
- **Nivel 3**: Cuenta (3 dígitos)
- **Nivel 4+**: Subcuentas (4+ dígitos)

### Ejemplo:
- 4 = Acreedores y deudores
- 43 = Clientes
- 430 = Clientes
- 4300001 = Cliente específico`,
        tags: ['plan contable', 'cuentas', 'PGC'],
        regulation: 'Real Decreto 1514/2007',
      },
      {
        id: 'acc-closing',
        title: 'Cierre contable',
        content: `## Proceso de Cierre Contable

### Fases del cierre:
1. **Regularización de existencias** (si procede)
2. **Ajustes por periodificación**
3. **Amortizaciones**
4. **Deterioros y provisiones**
5. **Reclasificaciones**
6. **Regularización de gastos e ingresos**
7. **Asiento de cierre**

### Regularización (Grupos 6 y 7):
\`\`\`
(129) Resultado del ejercicio     XXX (Debe)
   (6XX) Cuentas de gastos             XXX (Haber)

(7XX) Cuentas de ingresos         XXX (Debe)
   (129) Resultado del ejercicio       XXX (Haber)
\`\`\`

### Cierre de cuentas de Balance:
\`\`\`
(1XX, 4XX...) Pasivo              XXX (Debe)
   (2XX, 3XX, 5XX) Activo              XXX (Haber)
\`\`\``,
        tags: ['cierre', 'regularización', 'ejercicio'],
        regulation: 'PGC - Marco conceptual',
      },
      {
        id: 'acc-reports',
        title: 'Estados financieros',
        content: `## Estados Financieros

### Balance de Situación:
Muestra la situación patrimonial en un momento dado:
- **Activo**: Bienes y derechos
- **Pasivo**: Obligaciones
- **Patrimonio Neto**: Recursos propios

### Cuenta de Pérdidas y Ganancias:
Resultado del ejercicio:
- **Ingresos** (Grupo 7) - **Gastos** (Grupo 6) = Resultado

### Estado de Cambios en el Patrimonio Neto (ECPN):
- Estado de ingresos y gastos reconocidos
- Estado total de cambios en el PN

### Estado de Flujos de Efectivo (EFE):
- Flujos de explotación
- Flujos de inversión
- Flujos de financiación

### Memoria:
Información complementaria y notas explicativas.`,
        tags: ['balance', 'PyG', 'estados financieros'],
        regulation: 'PGC - Tercera parte',
      },
    ],
  },
  sales: {
    id: 'sales',
    title: 'Ventas',
    icon: ShoppingCart,
    description: 'Gestión comercial y facturación',
    topics: [
      {
        id: 'sales-intro',
        title: 'Módulo de Ventas',
        content: `## Módulo de Ventas

Gestión integral del ciclo de venta desde el presupuesto hasta el cobro.

### Documentos disponibles:
- **Presupuestos**: Ofertas comerciales
- **Pedidos**: Confirmación de venta
- **Albaranes**: Entrega de mercancía
- **Facturas**: Documento fiscal de venta
- **Facturas rectificativas**: Abonos

### Integración contable:
Las facturas generan automáticamente asientos:
- (430) Clientes al Debe
- (700) Ventas al Haber
- (477) IVA Repercutido al Haber`,
        tags: ['ventas', 'facturación', 'comercial'],
      },
      {
        id: 'sales-invoice',
        title: 'Facturación',
        content: `## Proceso de Facturación

### Crear factura:
1. Ir a **Ventas → Facturas → Nueva**
2. Seleccionar cliente
3. Añadir líneas de producto/servicio
4. Revisar impuestos
5. Contabilizar

### Requisitos legales factura:
- Número y serie
- Fecha de expedición
- Datos del emisor (NIF, nombre, dirección)
- Datos del destinatario
- Descripción de operaciones
- Base imponible, tipo IVA, cuota
- Total factura

### Tipos de IVA (España 2024):
- General: 21%
- Reducido: 10%
- Superreducido: 4%`,
        tags: ['facturas', 'IVA', 'documentos'],
        regulation: 'Reglamento de facturación RD 1619/2012',
      },
    ],
  },
  purchases: {
    id: 'purchases',
    title: 'Compras',
    icon: Package,
    description: 'Gestión de proveedores y compras',
    topics: [
      {
        id: 'purch-intro',
        title: 'Módulo de Compras',
        content: `## Módulo de Compras

Gestión del ciclo de compra desde el pedido hasta el pago.

### Documentos:
- **Pedidos a proveedor**
- **Albaranes de entrada**
- **Facturas de compra**
- **Facturas rectificativas**

### Integración contable:
\`\`\`
(600) Compras                     XXX (Debe)
(472) HP IVA Soportado            XXX (Debe)
   (400) Proveedores                   XXX (Haber)
\`\`\``,
        tags: ['compras', 'proveedores', 'gastos'],
      },
    ],
  },
  inventory: {
    id: 'inventory',
    title: 'Almacén',
    icon: Layers,
    description: 'Control de stock y existencias',
    topics: [
      {
        id: 'inv-intro',
        title: 'Gestión de Almacén',
        content: `## Módulo de Almacén

Control de existencias y movimientos de stock.

### Funcionalidades:
- **Artículos**: Catálogo de productos
- **Movimientos**: Entradas y salidas
- **Inventarios**: Recuentos físicos
- **Valoración**: FIFO, LIFO, PMP
- **Ubicaciones**: Gestión multi-almacén

### Métodos de valoración:
- **FIFO**: Primera entrada, primera salida
- **PMP**: Precio Medio Ponderado
- **LIFO**: Última entrada, primera salida (no permitido fiscalmente en España)

### Impacto contable:
Grupo 3 del PGC - Existencias
- (30) Comerciales
- (31) Materias primas
- (32) Otros aprovisionamientos
- (33) Productos en curso
- (34) Productos semiterminados
- (35) Productos terminados`,
        tags: ['almacén', 'stock', 'existencias', 'inventario'],
        regulation: 'PGC - NRV 10ª',
      },
    ],
  },
  masters: {
    id: 'masters',
    title: 'Maestros',
    icon: Users,
    description: 'Datos maestros del sistema',
    topics: [
      {
        id: 'masters-intro',
        title: 'Datos Maestros',
        content: `## Datos Maestros

Los datos maestros son la información base que se utiliza en todos los módulos.

### Tipos de maestros:
- **Clientes**: Terceros a los que se vende
- **Proveedores**: Terceros a los que se compra
- **Artículos**: Productos y servicios
- **Cuentas contables**: Plan de cuentas
- **Formas de pago**: Métodos de cobro/pago
- **Impuestos**: Tipos de IVA, retenciones

### Importancia:
- Garantizan consistencia de datos
- Evitan duplicidades
- Facilitan la trazabilidad
- Mejoran la eficiencia operativa`,
        tags: ['maestros', 'clientes', 'proveedores', 'artículos'],
      },
    ],
  },
};

// Preguntas frecuentes generales
const GENERAL_FAQS: HelpTopic[] = [
  {
    id: 'faq-1',
    title: '¿Cómo cambiar de empresa?',
    content: 'En la parte superior del ERP, haz clic en el selector de empresa para cambiar entre las empresas que tienes asignadas.',
    tags: ['empresa', 'cambiar'],
  },
  {
    id: 'faq-2',
    title: '¿Cómo crear un nuevo ejercicio fiscal?',
    content: 'Ve a **ERP → Ejercicios** y pulsa "Nuevo Ejercicio". Define las fechas de inicio y fin, y el sistema creará los períodos automáticamente.',
    tags: ['ejercicio', 'fiscal', 'período'],
  },
  {
    id: 'faq-3',
    title: '¿Qué son las series documentales?',
    content: 'Las series controlan la numeración de documentos (facturas, albaranes, etc.). Cada serie tiene un prefijo y contador independiente. Ve a **ERP → Series** para gestionarlas.',
    tags: ['series', 'numeración', 'documentos'],
  },
  {
    id: 'faq-4',
    title: '¿Cómo exportar datos?',
    content: 'La mayoría de listados tienen un botón de exportación a Excel. Para informes contables, usa el menú **Informes** de cada módulo.',
    tags: ['exportar', 'excel', 'informes'],
  },
];

export function DynamicHelpPanel({
  installedModules,
  country = 'España',
  companyName,
  className
}: DynamicHelpPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('modules');
  
  const {
    isLoading: isSearchingAI,
    suggestedTopics,
    searchHelp
  } = useERPDynamicHelp();

  // Filtrar secciones según módulos instalados
  const availableSections = useMemo(() => {
    return installedModules
      .map(moduleId => MODULE_HELP_SECTIONS[moduleId])
      .filter(Boolean);
  }, [installedModules]);

  // Búsqueda global local
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: Array<{ section: string; topic: HelpTopic }> = [];

    // Buscar en secciones de módulos
    availableSections.forEach(section => {
      section.topics.forEach(topic => {
        if (
          topic.title.toLowerCase().includes(query) ||
          topic.content.toLowerCase().includes(query) ||
          topic.tags?.some(t => t.toLowerCase().includes(query))
        ) {
          results.push({ section: section.title, topic });
        }
      });
    });

    // Buscar en FAQs
    GENERAL_FAQS.forEach(faq => {
      if (
        faq.title.toLowerCase().includes(query) ||
        faq.content.toLowerCase().includes(query) ||
        faq.tags?.some(t => t.toLowerCase().includes(query))
      ) {
        results.push({ section: 'Preguntas frecuentes', topic: faq });
      }
    });

    return results;
  }, [searchQuery, availableSections]);

  // Búsqueda con IA cuando no hay resultados locales
  const handleAISearch = useCallback(async () => {
    if (searchQuery.trim() && searchResults.length === 0) {
      await searchHelp(searchQuery);
    }
  }, [searchQuery, searchResults.length, searchHelp]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header con búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Centro de Ayuda
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Documentación completa del ERP • {availableSections.length} módulos activos
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en la documentación..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {searchQuery && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Resultados de búsqueda ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No se encontraron resultados para "{searchQuery}"
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.slice(0, 10).map((result, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSearchQuery('')}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">
                        {result.section}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{result.topic.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {result.topic.content.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      {!searchQuery && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="modules" className="gap-2">
              <Layers className="h-4 w-4" />
              Módulos
            </TabsTrigger>
            <TabsTrigger value="regulations" className="gap-2">
              <FileCheck className="h-4 w-4" />
              Normativa
            </TabsTrigger>
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Asistente
            </TabsTrigger>
          </TabsList>

          {/* Tab: Módulos */}
          <TabsContent value="modules" className="space-y-4 mt-4">
            {availableSections.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-muted-foreground">
                    No hay módulos instalados con documentación disponible
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availableSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Card key={section.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          {section.title}
                          <Badge variant="outline" className="ml-auto">
                            {section.topics.length} temas
                          </Badge>
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                          {section.topics.map((topic) => (
                            <AccordionItem key={topic.id} value={topic.id}>
                              <AccordionTrigger className="text-sm hover:no-underline">
                                <span className="flex items-center gap-2">
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  {topic.title}
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="prose prose-sm dark:prose-invert max-w-none pl-6">
                                  <div className="whitespace-pre-wrap text-sm">
                                    {topic.content}
                                  </div>
                                  {topic.regulation && (
                                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                      <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                        <FileCheck className="h-3 w-3" />
                                        Referencia: {topic.regulation}
                                      </p>
                                    </div>
                                  )}
                                  {topic.tags && (
                                    <div className="flex flex-wrap gap-1 mt-3">
                                      {topic.tags.map((tag, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Normativa */}
          <TabsContent value="regulations" className="mt-4">
            <RegulationsPanel />
          </TabsContent>

          {/* Tab: FAQ */}
          <TabsContent value="faq" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Preguntas Frecuentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {GENERAL_FAQS.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="text-sm text-left hover:no-underline">
                        {faq.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground pl-4">
                          {faq.content}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Asistente IA */}
          <TabsContent value="assistant" className="mt-4">
            <AccountingChatbot
              country={country}
              companyName={companyName}
              installedModules={installedModules}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default DynamicHelpPanel;
