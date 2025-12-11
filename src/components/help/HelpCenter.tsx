import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, X, Search, Book, FileQuestion, Lightbulb, 
  ChevronRight, ChevronDown, RefreshCw, FileDown, 
  Home, Users, MapPin, Calendar, BarChart3, Calculator,
  Shield, Bell, Settings, Database, Sparkles, Check,
  Building2, Target, TrendingUp, FileText, Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

interface HelpModule {
  id: string;
  title: string;
  icon: any;
  description: string;
  sections: HelpSection[];
}

interface HelpSection {
  id: string;
  title: string;
  content: string;
  faqs?: FAQ[];
  tips?: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

const helpModules: HelpModule[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    icon: Home,
    description: 'Centro de control con métricas, KPIs y acceso rápido a funcionalidades',
    sections: [
      {
        id: 'overview',
        title: 'Visión General',
        content: `El Dashboard Principal es el punto de entrada a ObelixIA. Desde aquí puedes:

• **Métricas en tiempo real**: Visualiza KPIs clave como visitas realizadas, objetivos cumplidos, y empresas gestionadas.
• **Accesos rápidos**: Navega directamente a cualquier módulo del sistema.
• **Notificaciones**: Recibe alertas sobre eventos importantes y tareas pendientes.
• **Filtros personalizados**: Ajusta la vista por período, gestor u oficina.

El dashboard se actualiza automáticamente cada 30 segundos para mostrar datos en tiempo real.`,
        faqs: [
          {
            question: '¿Cómo personalizo mi dashboard?',
            answer: 'Puedes arrastrar y reorganizar las tarjetas según tus preferencias. Los cambios se guardan automáticamente en tu perfil.'
          },
          {
            question: '¿Por qué no veo todas las métricas?',
            answer: 'Las métricas visibles dependen de tu rol. Los gestores ven sus propias métricas, mientras que directores ven datos agregados de su equipo.'
          }
        ],
        tips: [
          'Usa el selector de período para comparar métricas entre diferentes rangos de fechas.',
          'Haz clic en cualquier métrica para ver el desglose detallado.'
        ]
      }
    ]
  },
  {
    id: 'companies',
    title: 'Gestión de Empresas',
    icon: Building2,
    description: 'Administración completa del portfolio de empresas y clientes',
    sections: [
      {
        id: 'company-list',
        title: 'Listado de Empresas',
        content: `El módulo de empresas permite gestionar todo el portfolio de clientes y prospectos:

**Funcionalidades principales:**
• **Búsqueda avanzada**: Filtra por nombre, sector, CNAE, estado, gestor asignado, y más.
• **Vista de tarjetas/tabla**: Cambia entre vistas según tu preferencia.
• **Paginación inteligente**: Navega eficientemente por grandes volúmenes de datos.
• **Exportación**: Descarga datos en Excel o PDF.

**Tipos de cliente:**
- Cliente: Empresa con relación comercial activa
- Potencial: Prospecto sin productos contratados`,
        faqs: [
          {
            question: '¿Cómo asigno una empresa a un gestor?',
            answer: 'Edita la empresa y selecciona el gestor en el campo "Gestor Asignado". Solo administradores pueden cambiar asignaciones.'
          },
          {
            question: '¿Qué significa el indicador VIP?',
            answer: 'Las empresas VIP tienen prioridad en el seguimiento y aparecen destacadas en todas las vistas.'
          }
        ],
        tips: [
          'Usa la importación masiva Excel para cargar múltiples empresas a la vez.',
          'El sistema detecta y alerta sobre empresas duplicadas automáticamente.'
        ]
      },
      {
        id: 'company-detail',
        title: 'Detalle de Empresa',
        content: `La ficha de empresa contiene toda la información relevante:

**Datos generales:**
• Razón social, CIF/NIF, dirección, contacto
• Sector, CNAE, forma jurídica
• Facturación anual, número de empleados

**Vinculación bancaria:**
• Porcentaje de operaciones con cada entidad
• Productos contratados
• Histórico de transacciones

**Documentos y fotos:**
• Subida y gestión de documentos asociados
• Galería fotográfica del establecimiento

**Contactos:**
• Múltiples contactos por empresa
• Contacto principal destacado`,
        faqs: [
          {
            question: '¿Cómo subo documentos a una empresa?',
            answer: 'En la ficha de empresa, pestaña "Documentos", haz clic en "Subir documento" y selecciona el archivo. Formatos soportados: PDF, Word, Excel, imágenes.'
          }
        ]
      }
    ]
  },
  {
    id: 'visits',
    title: 'Gestión de Visitas',
    icon: Calendar,
    description: 'Planificación, registro y seguimiento de visitas comerciales',
    sections: [
      {
        id: 'visit-planning',
        title: 'Planificación de Visitas',
        content: `El sistema de visitas permite gestionar toda la actividad comercial:

**Crear visita:**
1. Selecciona la empresa a visitar
2. Elige fecha y hora
3. Define el tipo de visita (presencial, teléfono, videoconferencia)
4. Añade notas previas si es necesario

**Tipos de visita:**
• **Primera visita**: Primer contacto con prospecto
• **Seguimiento**: Visita de mantenimiento a cliente
• **Presentación**: Demostración de productos/servicios
• **Cierre**: Negociación final

**Estados:**
- Programada: Visita planificada pendiente
- Realizada: Visita completada
- Cancelada: Visita anulada
- Reprogramada: Fecha modificada`,
        faqs: [
          {
            question: '¿Cómo registro el resultado de una visita?',
            answer: 'Al completar una visita, selecciona el resultado (exitosa, pendiente, sin interés) y añade las notas del encuentro.'
          },
          {
            question: '¿Puedo programar visitas recurrentes?',
            answer: 'Sí, al crear la visita activa la opción "Recurrente" y define la frecuencia (semanal, mensual, trimestral).'
          }
        ]
      },
      {
        id: 'visit-sheets',
        title: 'Fichas de Visita',
        content: `Las fichas de visita documentan detalladamente cada encuentro comercial:

**Secciones de la ficha:**
1. **Datos de la visita**: Fecha, hora, duración, canal, tipo
2. **Datos del cliente**: Información auto-completada de la empresa
3. **Diagnóstico inicial**: Estado actual del cliente
4. **Situación financiera**: Datos económicos relevantes
5. **Necesidades detectadas**: Oportunidades identificadas
6. **Propuesta de valor**: Soluciones presentadas
7. **Productos ofrecidos**: Con importes estimados
8. **Riesgos/Compliance/KYC**: Aspectos regulatorios
9. **Resumen**: Notas del encuentro
10. **Próximos pasos**: Acciones acordadas
11. **Evaluación potencial**: Valoración de la oportunidad
12. **Recordatorios**: Tareas de seguimiento

**Firma digital:**
El cliente puede firmar la ficha directamente en pantalla táctil o con el ratón.`,
        tips: [
          'Usa el botón de resumen IA para generar automáticamente un resumen de la visita.',
          'Las fichas completadas se pueden exportar a PDF para archivo.'
        ]
      }
    ]
  },
  {
    id: 'map',
    title: 'Mapa Geográfico',
    icon: MapPin,
    description: 'Visualización geográfica del portfolio y planificación de rutas',
    sections: [
      {
        id: 'map-view',
        title: 'Vista del Mapa',
        content: `El mapa interactivo muestra la distribución geográfica de empresas:

**Capas disponibles:**
• **Calle**: Vista estándar de calles
• **Satélite**: Imagen satelital
• **3D**: Vista tridimensional del terreno

**Marcadores:**
Los marcadores muestran información visual del estado de cada empresa:
- Color según estado comercial
- Tamaño según volumen de facturación
- Icono según sector

**Clustering:**
En zonas con alta densidad, las empresas se agrupan en clusters que muestran el número de empresas. Haz zoom para expandir.

**Panel lateral:**
Muestra detalles de la empresa seleccionada con acceso rápido a:
- Ficha completa
- Programar visita
- Ver histórico`,
        faqs: [
          {
            question: '¿Cómo muevo una empresa en el mapa?',
            answer: 'Mantén pulsado el marcador durante 2 segundos y arrástralo a la nueva ubicación. Se actualizarán las coordenadas automáticamente.'
          }
        ]
      },
      {
        id: 'route-planning',
        title: 'Planificación de Rutas',
        content: `El planificador de rutas optimiza tus desplazamientos:

**Crear ruta:**
1. Selecciona las empresas a visitar
2. Define el punto de inicio
3. El sistema calcula la ruta óptima

**Optimización:**
El algoritmo considera:
- Distancia entre puntos
- Tiempo estimado de cada visita
- Horarios de apertura
- Tráfico en tiempo real

**Exportación:**
Puedes exportar la ruta a Google Maps o Apple Maps para navegación.`
      }
    ]
  },
  {
    id: 'goals',
    title: 'Objetivos y Metas',
    icon: Target,
    description: 'Definición y seguimiento de objetivos comerciales',
    sections: [
      {
        id: 'goal-types',
        title: 'Tipos de Objetivos',
        content: `El sistema soporta múltiples tipos de objetivos:

**Por métrica:**
• Visitas realizadas
• Nuevas altas de clientes
• Productos vendidos
• Volumen de facturación
• TPV instalados

**Por período:**
• Diarios
• Semanales
• Mensuales
• Trimestrales
• Anuales

**Por alcance:**
• Individual (gestor)
• Equipo (oficina)
• Global (banco)

**Cascada de objetivos:**
Los objetivos pueden heredarse jerárquicamente, distribuyendo metas globales entre equipos y gestores.`,
        faqs: [
          {
            question: '¿Quién puede crear objetivos?',
            answer: 'Solo usuarios con rol de director o responsable comercial pueden crear y asignar objetivos.'
          },
          {
            question: '¿Cómo se calculan los logros?',
            answer: 'El sistema calcula automáticamente el progreso basándose en los datos reales registrados (visitas, ventas, etc.).'
          }
        ]
      }
    ]
  },
  {
    id: 'accounting',
    title: 'Contabilidad',
    icon: Calculator,
    description: 'Gestión de estados financieros y análisis económico',
    sections: [
      {
        id: 'financial-statements',
        title: 'Estados Financieros',
        content: `El módulo contable gestiona estados financieros según el PGC:

**Tipos de estados:**
• Balance de situación
• Cuenta de resultados
• Estado de flujos de efectivo
• Estado de cambios en patrimonio neto

**Modelos soportados:**
• Normal: Estados completos
• Abreviado: Para PYMES
• Simplificado: Para microempresas

**Funcionalidades:**
- Entrada manual de datos
- Importación automática desde PDF
- Cálculo automático de ratios
- Comparativa multi-ejercicio
- Análisis de tendencias`,
        faqs: [
          {
            question: '¿Cómo importo datos desde un PDF?',
            answer: 'En la ficha contable de la empresa, haz clic en "Importar PDF". El sistema usa IA para extraer y mapear los datos automáticamente.'
          }
        ]
      },
      {
        id: 'financial-analysis',
        title: 'Análisis Financiero',
        content: `Herramientas avanzadas de análisis financiero:

**Ratios automáticos:**
• Liquidez (corriente, rápida, tesorería)
• Solvencia (endeudamiento, autonomía)
• Rentabilidad (ROE, ROA, margen)
• Actividad (rotación activos)

**Análisis especiales:**
• Pirámide DuPont
• Z-Score de Altman
• Rating bancario interno
• NOF y Fondo de Maniobra
• EBIT/EBITDA

**Exportación:**
Genera informes completos en PDF con gráficos y análisis narrativo.`
      }
    ]
  },
  {
    id: 'pipeline',
    title: 'Pipeline de Oportunidades',
    icon: TrendingUp,
    description: 'Gestión del embudo de ventas y oportunidades comerciales',
    sections: [
      {
        id: 'pipeline-board',
        title: 'Tablero Kanban',
        content: `El pipeline visualiza el embudo de ventas:

**Etapas predefinidas:**
1. **Prospección**: Oportunidad identificada
2. **Calificación**: Evaluando potencial
3. **Propuesta**: Oferta presentada
4. **Negociación**: En proceso de cierre
5. **Cerrada-Ganada**: Venta completada
6. **Cerrada-Perdida**: Oportunidad perdida

**Tarjetas de oportunidad:**
Cada tarjeta muestra:
- Empresa y contacto
- Valor estimado
- Probabilidad de cierre
- Fecha prevista de cierre
- Productos asociados

**Interacción:**
Arrastra las tarjetas entre columnas para actualizar el estado.`,
        tips: [
          'El valor ponderado del pipeline se calcula multiplicando el valor por la probabilidad de cada etapa.',
          'Configura alertas para oportunidades que lleven mucho tiempo sin movimiento.'
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Seguridad y Compliance',
    icon: Shield,
    description: 'Cumplimiento normativo, auditoría y seguridad del sistema',
    sections: [
      {
        id: 'dora-nis2',
        title: 'DORA/NIS2',
        content: `Panel de cumplimiento normativo europeo:

**DORA (Digital Operational Resilience Act):**
• Gestión de incidentes de seguridad
• Evaluaciones de riesgo TIC
• Pruebas de resiliencia
• Gestión de proveedores terceros

**NIS2 (Network and Information Security):**
• Análisis de vulnerabilidades
• Planes de continuidad
• Notificación de incidentes
• Auditorías de seguridad

**Dashboard de compliance:**
Visualiza el estado de cumplimiento con porcentajes y acciones pendientes para cada regulación.`,
        faqs: [
          {
            question: '¿Cómo registro un incidente de seguridad?',
            answer: 'Ve a DORA/NIS2 > Incidentes > Nuevo incidente. Completa el formulario con la descripción, impacto y acciones tomadas.'
          }
        ]
      },
      {
        id: 'iso27001',
        title: 'ISO 27001',
        content: `Panel de cumplimiento ISO 27001 con los 114 controles del Anexo A:

**Dominios:**
• A.5 Políticas de seguridad
• A.6 Organización
• A.7 Seguridad del personal
• A.8 Gestión de activos
• A.9 Control de acceso
• A.10 Criptografía
• A.11 Seguridad física
• A.12 Seguridad operativa
• A.13 Comunicaciones
• A.14 Desarrollo
• A.15 Proveedores
• A.16 Incidentes
• A.17 Continuidad
• A.18 Cumplimiento

Cada control muestra estado de implementación, evidencias y acciones correctivas.`
      }
    ]
  },
  {
    id: 'ai-assistant',
    title: 'Asistente IA Interno',
    icon: Bot,
    description: 'Chatbot inteligente para consultas y asistencia',
    sections: [
      {
        id: 'chat-usage',
        title: 'Uso del Chat',
        content: `El asistente IA responde consultas sobre el sistema y datos:

**Tipos de consultas:**
• **Clientes**: "¿Cuántas empresas tengo en el sector retail?"
• **Normativa**: "¿Qué dice la regulación sobre KYC?"
• **Productos**: "Explícame las características del préstamo empresarial"
• **Procedimientos**: "¿Cómo proceso una alta de cliente?"

**Entrada por voz:**
Activa el micrófono para dictar consultas. El sistema transcribe y responde automáticamente.

**Respuesta por voz:**
Activa "Auto-hablar" para que el asistente lea las respuestas en voz alta.

**Base de conocimiento:**
El asistente accede a documentos cargados por administradores para respuestas más precisas.`,
        faqs: [
          {
            question: '¿Mis conversaciones son privadas?',
            answer: 'Las conversaciones se almacenan para auditoría según normativa bancaria (GDPR/APDA). Solo auditores autorizados pueden acceder al historial.'
          }
        ]
      }
    ]
  },
  {
    id: 'reports',
    title: 'Informes y Exportación',
    icon: FileText,
    description: 'Generación de informes y exportación de datos',
    sections: [
      {
        id: 'report-types',
        title: 'Tipos de Informes',
        content: `El sistema genera múltiples tipos de informes:

**Informes operativos:**
• Resumen de actividad diaria/semanal/mensual
• Listado de visitas por período
• Estado del pipeline
• Objetivos vs. logros

**Informes analíticos:**
• Análisis de cartera
• Segmentación de clientes
• Predicciones ML
• Tendencias y evolución

**Informes regulatorios:**
• Auditoría de actividad
• Cumplimiento normativo
• Incidentes de seguridad

**Formatos de exportación:**
• PDF (informes formateados)
• Excel (datos tabulados)
• CSV (datos planos)`,
        tips: [
          'Programa informes periódicos para recibirlos automáticamente por email.',
          'Los informes PDF incluyen gráficos y resúmenes ejecutivos.'
        ]
      }
    ]
  }
];

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('modules');

  useEffect(() => {
    const saved = localStorage.getItem('help_last_update');
    if (saved) setLastUpdate(saved);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredModules = helpModules.filter(module => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.sections.some(s => 
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query) ||
        s.faqs?.some(f => 
          f.question.toLowerCase().includes(query) ||
          f.answer.toLowerCase().includes(query)
        )
      )
    );
  });

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { type: 'help-update' }
      });

      if (error) throw error;

      const now = new Date().toISOString();
      localStorage.setItem('help_last_update', now);
      setLastUpdate(now);
      
      toast.success('Ayuda actualizada', {
        description: 'El contenido de ayuda ha sido analizado y actualizado con las últimas funcionalidades.'
      });
    } catch (error) {
      console.error('Error analyzing code:', error);
      toast.error('Error al analizar', {
        description: 'No se pudo actualizar la ayuda. Inténtalo de nuevo.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      pdf.setFillColor(30, 41, 59);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Manual de Usuario ObelixIA', margin, 28);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, margin, 38);

      y = 60;
      pdf.setTextColor(0, 0, 0);

      // Index
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indice de Contenidos', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      helpModules.forEach((module, i) => {
        pdf.text(`${i + 1}. ${module.title}`, margin + 5, y);
        y += 6;
      });

      // Modules content
      helpModules.forEach((module, moduleIndex) => {
        pdf.addPage();
        y = margin;

        // Module header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${moduleIndex + 1}. ${module.title}`, margin, 22);
        
        pdf.setFontSize(10);
        pdf.text(module.description, margin, 30);

        y = 50;
        pdf.setTextColor(0, 0, 0);

        // Sections
        module.sections.forEach((section, sectionIndex) => {
          if (y > pdf.internal.pageSize.getHeight() - 40) {
            pdf.addPage();
            y = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${moduleIndex + 1}.${sectionIndex + 1} ${section.title}`, margin, y);
          y += 8;

          // Content
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const contentLines = pdf.splitTextToSize(section.content.replace(/[*#]/g, ''), contentWidth);
          contentLines.forEach((line: string) => {
            if (y > pdf.internal.pageSize.getHeight() - 20) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += 5;
          });
          y += 5;

          // FAQs
          if (section.faqs && section.faqs.length > 0) {
            if (y > pdf.internal.pageSize.getHeight() - 40) {
              pdf.addPage();
              y = margin;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Preguntas Frecuentes', margin, y);
            y += 8;

            section.faqs.forEach((faq) => {
              if (y > pdf.internal.pageSize.getHeight() - 30) {
                pdf.addPage();
                y = margin;
              }

              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              const qLines = pdf.splitTextToSize(`P: ${faq.question}`, contentWidth);
              qLines.forEach((line: string) => {
                pdf.text(line, margin + 5, y);
                y += 5;
              });

              pdf.setFont('helvetica', 'normal');
              const aLines = pdf.splitTextToSize(`R: ${faq.answer}`, contentWidth - 10);
              aLines.forEach((line: string) => {
                if (y > pdf.internal.pageSize.getHeight() - 15) {
                  pdf.addPage();
                  y = margin;
                }
                pdf.text(line, margin + 10, y);
                y += 5;
              });
              y += 3;
            });
          }

          // Tips
          if (section.tips && section.tips.length > 0) {
            if (y > pdf.internal.pageSize.getHeight() - 30) {
              pdf.addPage();
              y = margin;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Consejos', margin, y);
            y += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            section.tips.forEach((tip) => {
              if (y > pdf.internal.pageSize.getHeight() - 15) {
                pdf.addPage();
                y = margin;
              }
              const tipLines = pdf.splitTextToSize(`• ${tip}`, contentWidth - 5);
              tipLines.forEach((line: string) => {
                pdf.text(line, margin + 5, y);
                y += 5;
              });
            });
          }

          y += 10;
        });
      });

      pdf.save(`Manual_Usuario_ObelixIA_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado', { description: 'El manual se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderModuleContent = (module: HelpModule) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <div className="p-2 rounded-lg bg-primary/10">
          <module.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{module.title}</h3>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </div>
      </div>

      {module.sections.map((section) => (
        <div key={section.id} className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection(section.id)}
          >
            <span className="font-medium">{section.title}</span>
            {expandedSections.includes(section.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.includes(section.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {section.content.split('\n').map((paragraph, i) => (
                      <p key={i} className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.faqs && section.faqs.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileQuestion className="h-4 w-4 text-orange-500" />
                        Preguntas Frecuentes
                      </h4>
                      {section.faqs.map((faq, i) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                          <p className="font-medium text-sm">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.tips && section.tips.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      <h4 className="font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Consejos
                      </h4>
                      {section.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Centro de Ayuda</h2>
                  <p className="text-sm text-muted-foreground">
                    Manual completo de ObelixIA
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search and Actions */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en la ayuda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeCode}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analizando...' : 'Actualizar Ayuda'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="flex-1"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                </Button>
              </div>

              {lastUpdate && (
                <p className="text-xs text-muted-foreground text-center">
                  Última actualización: {new Date(lastUpdate).toLocaleString('es-ES')}
                </p>
              )}
            </div>

            {/* Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 mx-4 mt-2">
                <TabsTrigger value="modules" className="flex items-center gap-1">
                  <Book className="h-4 w-4" />
                  <span className="hidden sm:inline">Módulos</span>
                </TabsTrigger>
                <TabsTrigger value="faqs" className="flex items-center gap-1">
                  <FileQuestion className="h-4 w-4" />
                  <span className="hidden sm:inline">FAQs</span>
                </TabsTrigger>
                <TabsTrigger value="tips" className="flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Consejos</span>
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 p-4">
                <TabsContent value="modules" className="mt-0 space-y-4">
                  {selectedModule ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedModule(null)}
                        className="mb-2"
                      >
                        ← Volver al índice
                      </Button>
                      {renderModuleContent(
                        helpModules.find(m => m.id === selectedModule)!
                      )}
                    </>
                  ) : (
                    <div className="grid gap-3">
                      {filteredModules.map((module) => (
                        <motion.button
                          key={module.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedModule(module.id)}
                          className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all text-left group"
                        >
                          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <module.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{module.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {module.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {module.sections.length} secciones
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="faqs" className="mt-0 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Todas las Preguntas Frecuentes</h3>
                  {helpModules.map((module) => (
                    module.sections.map((section) => (
                      section.faqs?.map((faq, i) => (
                        <div key={`${module.id}-${section.id}-${i}`} className="border rounded-lg p-4">
                          <Badge variant="outline" className="mb-2">{module.title}</Badge>
                          <p className="font-medium">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                        </div>
                      ))
                    ))
                  ))}
                </TabsContent>

                <TabsContent value="tips" className="mt-0 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Todos los Consejos</h3>
                  {helpModules.map((module) => (
                    module.sections.map((section) => (
                      section.tips?.map((tip, i) => (
                        <div key={`${module.id}-${section.id}-${i}`} className="flex items-start gap-3 p-4 border rounded-lg">
                          <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
                          <div>
                            <Badge variant="outline" className="mb-2">{module.title}</Badge>
                            <p className="text-sm">{tip}</p>
                          </div>
                        </div>
                      ))
                    ))
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
