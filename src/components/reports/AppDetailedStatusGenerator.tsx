import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, CheckCircle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface ModuleStatus {
  name: string;
  category: string;
  description: string;
  completedFeatures: string[];
  pendingFeatures: string[];
  completionPercentage: number;
  criticalForProduction: boolean;
  dependencies: string[];
  estimatedToComplete: string;
}

const MODULES_STATUS: ModuleStatus[] = [
  {
    name: "Sistema de Autenticacion",
    category: "Core",
    description: "Autenticacion Supabase con roles RBAC, RLS multi-tenant, gestion de sesiones.",
    completedFeatures: [
      "Login/Logout con Supabase Auth",
      "Sistema de roles (gestor, director_oficina, director_comercial, responsable_comercial, auditor, superadmin)",
      "RLS policies en todas las tablas criticas",
      "Gestion de perfiles de usuario",
      "Auto-confirmacion email signups",
      "Selector de vision para superadmins"
    ],
    pendingFeatures: [
      "MFA/2FA autenticacion multifactor",
      "SSO con proveedores externos (Azure AD, Google Workspace)",
      "Politica de caducidad de contrasenas",
      "Deteccion de contrasenas comprometidas"
    ],
    completionPercentage: 85,
    criticalForProduction: true,
    dependencies: [],
    estimatedToComplete: "2 meses"
  },
  {
    name: "Dashboard Multi-Rol",
    category: "Core",
    description: "Dashboards adaptados por rol con KPIs bancarios, filtros avanzados y benchmarking.",
    completedFeatures: [
      "Dashboard Director de Negoci (comercial)",
      "Dashboard Director d'Oficina",
      "Dashboard Responsable Comercial",
      "Dashboard Gestor personal",
      "Dashboard Auditor",
      "Metricas KPI en tiempo real",
      "Filtros por fecha, gestor, oficina",
      "Benchmarking vs sector europeo",
      "Graficos interactivos (Bar, Line, Pie, Radar)",
      "Cards 3D navegables"
    ],
    pendingFeatures: [
      "Exportacion directa a PowerBI",
      "Alertas push en dashboard",
      "Widgets personalizables drag-drop"
    ],
    completionPercentage: 92,
    criticalForProduction: false,
    dependencies: ["Sistema de Autenticacion"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Modulo Contable PGC",
    category: "Financiero",
    description: "Sistema contable completo segun Plan General Contable Andorra/Espana con formularios, analisis y consolidacion.",
    completedFeatures: [
      "Balance de Situacion completo (Activo/Pasivo/Patrimonio)",
      "Cuenta de Perdidas y Ganancias",
      "Estado de Flujos de Efectivo",
      "Estado de Cambios en Patrimonio",
      "Notas a los Estados Financieros",
      "Modelos Normal, Abreujat, Simplificat",
      "Historico 5 anos activos + archivo",
      "Comparativa multi-anual con variaciones %",
      "Import PDF con IA (Gemini 2.5)",
      "Cuadro General de Grupos Contables",
      "Consolidacion hasta 15 empresas",
      "Analisis Working Capital NOF",
      "Analisis Valor Anadido",
      "Graficos evolucion anual"
    ],
    pendingFeatures: [
      "Exportacion formato XBRL",
      "Integracion con ERP externos",
      "Validaciones automaticas cuadre"
    ],
    completionPercentage: 95,
    criticalForProduction: false,
    dependencies: ["Gestion de Empresas"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Analisis Financiero Avanzado",
    category: "Financiero",
    description: "Ratios, analisis crediticio y herramientas de evaluacion financiera.",
    completedFeatures: [
      "Piramide DuPont completa",
      "Altman Z-Score con interpretacion",
      "Ratios Liquidez y Endeudamiento",
      "Analisis EBIT/EBITDA",
      "Rating Bancario automatizado",
      "Analisis Cash Flow",
      "Analisis Largo Plazo",
      "Comparativa sectorial",
      "Simulador sectorial",
      "Analisis Rentabilidad"
    ],
    pendingFeatures: [
      "Scoring crediticio ML propio",
      "Predicciones con series temporales",
      "Stress testing escenarios"
    ],
    completionPercentage: 90,
    criticalForProduction: false,
    dependencies: ["Modulo Contable PGC"],
    estimatedToComplete: "2 meses"
  },
  {
    name: "GIS Bancario Enterprise",
    category: "Comercial",
    description: "Sistema de informacion geografica para gestion de cartera comercial con 20.000+ empresas.",
    completedFeatures: [
      "Mapa MapLibre GL con 20.000+ empresas",
      "Clustering Supercluster dinamico",
      "Capas OSM, Satelite, 3D",
      "Sidebar filtros avanzados",
      "Colorizacion por estado/vinculacion/P&L",
      "Galeria fotos en tooltips",
      "Buscador geografico GeoSearch",
      "Drag-to-relocate marcadores",
      "Estadisticas por sector",
      "Modo fullscreen sidebar",
      "Panel de visitas integrado"
    ],
    pendingFeatures: [
      "Visualizacion polyline rutas optimizadas",
      "Tiles offline para intranet",
      "Heatmaps de densidad"
    ],
    completionPercentage: 88,
    criticalForProduction: false,
    dependencies: ["Gestion de Empresas"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Planificador de Rutas",
    category: "Comercial",
    description: "Optimizacion de rutas de visitas comerciales con Google Directions API.",
    completedFeatures: [
      "Seleccion hasta 10 empresas",
      "Integracion Google Directions API",
      "Calculo ruta optima",
      "Instrucciones turn-by-turn",
      "Modos minimizado/seleccion/panel",
      "Marcadores verdes parpadeantes"
    ],
    pendingFeatures: [
      "Visualizacion polyline en mapa",
      "Exportacion a Google Maps/Waze",
      "Optimizacion multi-dia",
      "Consideracion ventanas horarias"
    ],
    completionPercentage: 70,
    criticalForProduction: false,
    dependencies: ["GIS Bancario Enterprise"],
    estimatedToComplete: "2 meses"
  },
  {
    name: "Gestion de Empresas",
    category: "Core",
    description: "CRUD completo de empresas con todos los campos bancarios, contactos, documentos y productos.",
    completedFeatures: [
      "Listado paginado servidor 20K empresas",
      "Busqueda y filtros avanzados",
      "Detalle empresa con todas las pestanas",
      "Contactos multiples por empresa",
      "Documentos adjuntos",
      "Productos contratados",
      "Terminales TPV",
      "Afiliaciones bancarias %",
      "Fotos de empresa",
      "Import Excel masivo con geocoding",
      "Historial importaciones",
      "Deteccion y eliminacion duplicados",
      "Export PDF/Excel"
    ],
    pendingFeatures: [
      "Merge inteligente de duplicados",
      "Enriquecimiento datos externos (API BORME)"
    ],
    completionPercentage: 95,
    criticalForProduction: true,
    dependencies: ["Sistema de Autenticacion"],
    estimatedToComplete: "2 semanas"
  },
  {
    name: "Fichas de Visita",
    category: "Comercial",
    description: "Formulario completo de 12 secciones para documentar visitas comerciales.",
    completedFeatures: [
      "Formulario 12 secciones completo",
      "Datos visita (fecha, hora, canal, tipo)",
      "Datos cliente auto-completados",
      "Diagnostico inicial checklist",
      "Situacion financiera",
      "Necesidades detectadas",
      "Propuesta de valor",
      "Productos y servicios con importes",
      "Riesgos/Compliance/KYC",
      "Resumen reunion",
      "Proximos pasos con fechas",
      "Evaluacion potencial",
      "Recordatorios follow-up",
      "Validacion por responsable comercial",
      "Notificaciones email validacion",
      "Sincronizacion vinculacion banco",
      "Alertas oportunidades >90%"
    ],
    pendingFeatures: [
      "Firma digital en tablet",
      "Adjuntar fotos desde movil",
      "Templates personalizables"
    ],
    completionPercentage: 92,
    criticalForProduction: false,
    dependencies: ["Gestion de Empresas"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Sistema de Objetivos y Metas",
    category: "Comercial",
    description: "Definicion, seguimiento y analisis de objetivos comerciales por gestor.",
    completedFeatures: [
      "Creacion objetivos por admin roles",
      "7 metricas (clientes, visitas, TPV, conversion, facturacion, productos, follow-ups)",
      "Seguimiento progreso tiempo real",
      "Benchmarking vs oficina y equipo",
      "Ranking gestores por cumplimiento",
      "Historial objetivos pasados",
      "Alertas objetivos en riesgo",
      "Dashboard KPIs objetivos"
    ],
    pendingFeatures: [
      "Objetivos en cascada (empresa > oficina > gestor)",
      "Gamificacion con badges",
      "Incentivos automatizados"
    ],
    completionPercentage: 88,
    criticalForProduction: false,
    dependencies: ["Dashboard Multi-Rol"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Planes de Accion IA",
    category: "IA",
    description: "Generacion automatica de planes de mejora con Lovable AI/Gemini.",
    completedFeatures: [
      "Deteccion metricas bajo rendimiento",
      "Generacion plan 30 dias con IA",
      "4-6 pasos especificos por plan",
      "Almacenamiento en base de datos",
      "Seguimiento completitud pasos",
      "Fechas limite por paso"
    ],
    pendingFeatures: [
      "Refinamiento iterativo de planes",
      "Integracion con calendario",
      "Notificaciones recordatorio pasos"
    ],
    completionPercentage: 80,
    criticalForProduction: false,
    dependencies: ["Sistema de Objetivos y Metas"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Parsing PDF Financiero IA",
    category: "IA",
    description: "Extraccion automatica de datos de estados financieros PDF con Gemini 2.5.",
    completedFeatures: [
      "Upload PDF estados financieros",
      "OCR si es imagen escaneada",
      "Mapeo inteligente campos PGC",
      "Preview antes de guardar",
      "Auto-poblado formularios"
    ],
    pendingFeatures: [
      "Soporte mas formatos (Word, Excel)",
      "Mejora precision campos ambiguos",
      "Batch processing multiples PDFs"
    ],
    completionPercentage: 85,
    criticalForProduction: false,
    dependencies: ["Modulo Contable PGC"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Sistema de Alertas",
    category: "Operaciones",
    description: "Alertas configurables con escalado automatico y notificaciones.",
    completedFeatures: [
      "Configuracion alertas por metrica",
      "Condiciones (mayor, menor, igual)",
      "Alertas por gestor u oficina",
      "Escalado automatico por tiempo",
      "Historial alertas disparadas",
      "Resolucion con notas",
      "Panel alertas director"
    ],
    pendingFeatures: [
      "Push notifications movil",
      "Integracion Slack/Teams",
      "Alertas predictivas ML"
    ],
    completionPercentage: 85,
    criticalForProduction: false,
    dependencies: ["Dashboard Multi-Rol"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Notificaciones Email",
    category: "Operaciones",
    description: "Envio automatico de emails transaccionales via Resend.",
    completedFeatures: [
      "Recordatorios visitas pendientes",
      "Notificacion validacion fichas",
      "Alerta oportunidades criticas >90%",
      "Reports KPI diarios/semanales/mensuales",
      "Templates HTML personalizables",
      "Preferencias usuario por urgencia",
      "Logs envios"
    ],
    pendingFeatures: [
      "Emails marketing/campanas",
      "A/B testing asuntos",
      "Analytics apertura/clicks"
    ],
    completionPercentage: 88,
    criticalForProduction: false,
    dependencies: [],
    estimatedToComplete: "2 semanas"
  },
  {
    name: "Calendario Compartido",
    category: "Operaciones",
    description: "Vista calendario de visitas con filtros por gestor/oficina.",
    completedFeatures: [
      "Vista mensual/semanal/diaria",
      "Filtro por gestor y oficina",
      "Colores por tipo visita",
      "Click para ver detalle",
      "Vista cascada oficina > gestor"
    ],
    pendingFeatures: [
      "Sincronizacion Google Calendar",
      "Sincronizacion Outlook",
      "Drag-drop para reprogramar",
      "Invitaciones calendario"
    ],
    completionPercentage: 75,
    criticalForProduction: false,
    dependencies: ["Fichas de Visita"],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Auditoria y Logs",
    category: "Seguridad",
    description: "Registro completo de todas las acciones de usuario para compliance.",
    completedFeatures: [
      "Audit logs todas las tablas criticas",
      "Registro INSERT/UPDATE/DELETE",
      "Usuario, timestamp, datos antes/despues",
      "Visor logs con filtros",
      "Panel auditoria responsable comercial",
      "Busqueda por accion/tabla/usuario"
    ],
    pendingFeatures: [
      "Exportacion logs formato regulatorio",
      "Alertas acciones sospechosas",
      "Retencion configurable"
    ],
    completionPercentage: 90,
    criticalForProduction: true,
    dependencies: ["Sistema de Autenticacion"],
    estimatedToComplete: "2 semanas"
  },
  {
    name: "Seguridad y RLS",
    category: "Seguridad",
    description: "Politicas Row Level Security y hardening de seguridad.",
    completedFeatures: [
      "RLS en todas tablas criticas",
      "Funciones security-definer para evitar recursion",
      "JWT verification edge functions criticas",
      "Rate limiting geocoding",
      "Sanitizacion XSS DOMPurify",
      "Audit logging acciones"
    ],
    pendingFeatures: [
      "Deteccion leaked passwords (requiere Supabase dashboard)",
      "WAF/firewall aplicacion",
      "Penetration testing externo",
      "Certificacion ISO 27001"
    ],
    completionPercentage: 80,
    criticalForProduction: true,
    dependencies: [],
    estimatedToComplete: "6-12 meses (ISO)"
  },
  {
    name: "Generadores PDF",
    category: "Reportes",
    description: "Generacion de documentos PDF profesionales.",
    completedFeatures: [
      "Report ejecutivo empresa",
      "Documentacion tecnica completa",
      "Export listado empresas",
      "Documentacion comercial con IA"
    ],
    pendingFeatures: [
      "Templates Word editables",
      "Generacion batch",
      "Personalizacion branding cliente"
    ],
    completionPercentage: 85,
    criticalForProduction: false,
    dependencies: [],
    estimatedToComplete: "1 mes"
  },
  {
    name: "Internacionalizacion",
    category: "UX",
    description: "Soporte multi-idioma para la interfaz.",
    completedFeatures: [
      "Espanol completo",
      "Catalan completo",
      "Ingles completo",
      "Frances completo",
      "Selector idioma persistente",
      "Context React para traducciones"
    ],
    pendingFeatures: [
      "Portugues",
      "Aleman",
      "Traducciones dinamicas contenido BD"
    ],
    completionPercentage: 90,
    criticalForProduction: false,
    dependencies: [],
    estimatedToComplete: "2 semanas por idioma"
  },
  {
    name: "Temas Visuales",
    category: "UX",
    description: "Sistema de temas personalizables.",
    completedFeatures: [
      "Tema Day (claro)",
      "Tema Night (oscuro)",
      "Tema Creand (corporativo)",
      "Tema Aurora (vibrante)",
      "Selector persistente",
      "Transiciones suaves CSS"
    ],
    pendingFeatures: [
      "Theme builder personalizado",
      "Branding por cliente"
    ],
    completionPercentage: 95,
    criticalForProduction: false,
    dependencies: [],
    estimatedToComplete: "2 semanas"
  },
  {
    name: "Presencia Online",
    category: "Colaboracion",
    description: "Indicadores de usuarios conectados en tiempo real.",
    completedFeatures: [
      "Supabase Presence API",
      "Avatares usuarios online",
      "Estado actividad",
      "Indicador en header"
    ],
    pendingFeatures: [
      "Chat interno",
      "Menciones @usuario",
      "Notificaciones presencia"
    ],
    completionPercentage: 75,
    criticalForProduction: false,
    dependencies: ["Sistema de Autenticacion"],
    estimatedToComplete: "2 meses"
  }
];

export const AppDetailedStatusGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;
      let pageNumber = 1;

      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        currentY = margin;
        addFooter();
      };

      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Pagina ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        doc.text('Estado Detallado Aplicativo - CRM Creand', margin, pageHeight - 8);
        doc.setTextColor(0, 0, 0);
      };

      const checkPageBreak = (needed: number) => {
        if (currentY + needed > pageHeight - 25) {
          addNewPage();
          return true;
        }
        return false;
      };

      const addMainTitle = (text: string) => {
        checkPageBreak(18);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 50, 120);
        doc.text(text, margin, currentY);
        currentY += 3;
        doc.setDrawColor(15, 50, 120);
        doc.setLineWidth(0.8);
        doc.line(margin, currentY, pageWidth - margin, currentY);
        currentY += 10;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addTitle = (text: string, level: number = 2) => {
        checkPageBreak(14);
        const sizes = [15, 12, 11, 10];
        doc.setFontSize(sizes[level - 1] || 10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 80, 150);
        doc.text(text, margin, currentY);
        currentY += level === 1 ? 10 : 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addParagraph = (text: string, indent: number = 0) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + indent, currentY);
          currentY += 4.5;
        });
        currentY += 2;
      };

      const addBullet = (text: string, indent: number = 0, bulletChar: string = '-') => {
        checkPageBreak(5);
        doc.setFontSize(9);
        doc.text(bulletChar, margin + indent, currentY);
        const lines = doc.splitTextToSize(text, contentWidth - indent - 6);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + indent + 4, currentY + (i * 4.5));
        });
        currentY += lines.length * 4.5 + 1.5;
      };

      const addInfoBox = (title: string, text: string, type: 'info' | 'success' | 'warning' = 'info') => {
        checkPageBreak(28);
        const colors: Record<string, { bg: number[]; border: number[]; title: number[] }> = {
          info: { bg: [235, 245, 255], border: [59, 130, 246], title: [20, 60, 140] },
          success: { bg: [236, 253, 245], border: [34, 197, 94], title: [22, 101, 52] },
          warning: { bg: [254, 249, 195], border: [234, 179, 8], title: [161, 98, 7] }
        };
        const c = colors[type];
        doc.setFillColor(c.bg[0], c.bg[1], c.bg[2]);
        doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
        const lines = doc.splitTextToSize(text, contentWidth - 12);
        const boxHeight = (lines.length * 4.5) + 14;
        doc.roundedRect(margin, currentY - 2, contentWidth, boxHeight, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(c.title[0], c.title[1], c.title[2]);
        doc.text(title, margin + 5, currentY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(8);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, currentY + 10 + (i * 4.5));
        });
        currentY += boxHeight + 4;
        doc.setTextColor(0, 0, 0);
      };

      const addProgressBar = (label: string, percentage: number) => {
        checkPageBreak(10);
        doc.setFontSize(8);
        doc.text(`${label}: ${percentage}%`, margin, currentY);
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(margin + 50, currentY - 3, 60, 4, 1, 1, 'F');
        const color: [number, number, number] = percentage >= 90 ? [34, 197, 94] : percentage >= 70 ? [234, 179, 8] : [239, 68, 68];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(margin + 50, currentY - 3, (60 * percentage / 100), 4, 1, 1, 'F');
        currentY += 7;
      };

      const addTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
        checkPageBreak(25);
        const defaultWidth = contentWidth / headers.length;
        const widths = colWidths || headers.map(() => defaultWidth);
        
        doc.setFillColor(15, 50, 120);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        let xPos = margin;
        doc.rect(margin, currentY - 4, contentWidth, 7, 'F');
        headers.forEach((header, i) => {
          const headerLines = doc.splitTextToSize(header, widths[i] - 3);
          doc.text(headerLines[0] || '', xPos + 1.5, currentY);
          xPos += widths[i];
        });
        currentY += 5;

        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        rows.forEach((row, rowIndex) => {
          const cellLines = row.map((cell, i) => doc.splitTextToSize(cell || '', widths[i] - 3));
          const maxLines = Math.max(...cellLines.map(lines => lines.length), 1);
          const rowHeight = Math.max(5, maxLines * 3.5);
          
          checkPageBreak(rowHeight + 2);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(245, 247, 250);
            doc.rect(margin, currentY - 3, contentWidth, rowHeight, 'F');
          }
          
          xPos = margin;
          row.forEach((cell, i) => {
            const lines = doc.splitTextToSize(cell || '', widths[i] - 3);
            lines.slice(0, 4).forEach((line: string, lineIdx: number) => {
              doc.text(line, xPos + 1.5, currentY + (lineIdx * 3.5));
            });
            xPos += widths[i];
          });
          currentY += rowHeight;
        });
        currentY += 3;
      };

      // ==================== PORTADA ====================
      setProgress(10);
      
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 80, 'F');
      doc.setFillColor(20, 60, 140);
      doc.rect(0, 55, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADO DETALLADO DEL APLICATIVO', pageWidth / 2, 32, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('CRM Bancario Creand', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Cumplido vs Pendiente por Modulo', pageWidth / 2, 70, { align: 'center' });
      
      currentY = 95;
      doc.setTextColor(0, 0, 0);
      
      // Estadisticas generales
      const totalModules = MODULES_STATUS.length;
      const avgCompletion = Math.round(MODULES_STATUS.reduce((acc, m) => acc + m.completionPercentage, 0) / totalModules);
      const completedFeatures = MODULES_STATUS.reduce((acc, m) => acc + m.completedFeatures.length, 0);
      const pendingFeatures = MODULES_STATUS.reduce((acc, m) => acc + m.pendingFeatures.length, 0);
      const criticalModules = MODULES_STATUS.filter(m => m.criticalForProduction).length;
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY - 5, contentWidth, 45, 3, 3, 'F');
      
      doc.setFontSize(10);
      const metadata = [
        ['Fecha:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Total Modulos:', String(totalModules)],
        ['Completitud Media:', `${avgCompletion}%`],
        ['Funcionalidades Completadas:', String(completedFeatures)],
        ['Funcionalidades Pendientes:', String(pendingFeatures)],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 5, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 60, currentY);
        currentY += 8;
      });

      currentY += 10;
      addInfoBox('RESUMEN EJECUTIVO', 
        `El aplicativo CRM Creand cuenta con ${totalModules} modulos principales, con una completitud media del ${avgCompletion}%. Se han implementado ${completedFeatures} funcionalidades y quedan ${pendingFeatures} pendientes. ${criticalModules} modulos son criticos para produccion.`,
        'info');

      addFooter();

      // ==================== INDICE ====================
      addNewPage();
      setProgress(15);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('INDICE DE MODULOS', pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
      doc.setTextColor(0, 0, 0);

      // Agrupar por categoria
      const categories = [...new Set(MODULES_STATUS.map(m => m.category))];
      
      categories.forEach(cat => {
        addTitle(cat, 3);
        const modules = MODULES_STATUS.filter(m => m.category === cat);
        modules.forEach(mod => {
          const status = mod.completionPercentage >= 90 ? '[OK]' : mod.completionPercentage >= 70 ? '[~]' : '[!]';
          addBullet(`${mod.name} - ${mod.completionPercentage}% ${status}`, 3, '-');
        });
        currentY += 3;
      });

      addFooter();

      // ==================== RESUMEN TABLA ====================
      addNewPage();
      setProgress(25);
      
      addMainTitle('RESUMEN EJECUTIVO POR MODULO');
      
      addTable(
        ['Modulo', 'Categoria', '%', 'Critico', 'Tiempo Pendiente'],
        MODULES_STATUS.map(m => [
          m.name,
          m.category,
          `${m.completionPercentage}%`,
          m.criticalForProduction ? 'SI' : 'No',
          m.estimatedToComplete
        ]),
        [55, 30, 20, 20, 40]
      );

      // ==================== DETALLE POR MODULO ====================
      addNewPage();
      setProgress(30);
      
      addMainTitle('DETALLE POR MODULO');
      
      let moduleIndex = 1;
      const progressIncrement = 60 / MODULES_STATUS.length;
      
      for (const module of MODULES_STATUS) {
        checkPageBreak(80);
        setProgress(30 + Math.round(moduleIndex * progressIncrement));
        
        addTitle(`${moduleIndex}. ${module.name}`, 2);
        
        if (module.criticalForProduction) {
          doc.setFillColor(254, 226, 226);
          doc.setDrawColor(239, 68, 68);
          doc.roundedRect(margin, currentY - 2, contentWidth, 8, 2, 2, 'FD');
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(153, 27, 27);
          doc.text('MODULO CRITICO PARA PRODUCCION', margin + 5, currentY + 3);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          currentY += 12;
        }
        
        addParagraph(`Categoria: ${module.category}`);
        addParagraph(module.description);
        
        addProgressBar('Completitud', module.completionPercentage);
        
        if (module.dependencies.length > 0) {
          addParagraph(`Dependencias: ${module.dependencies.join(', ')}`);
        }
        addParagraph(`Tiempo para completar: ${module.estimatedToComplete}`);
        
        currentY += 3;
        addTitle('Funcionalidades COMPLETADAS', 3);
        module.completedFeatures.forEach(feat => {
          addBullet(feat, 3, '+');
        });
        
        currentY += 3;
        if (module.pendingFeatures.length > 0) {
          addTitle('Funcionalidades PENDIENTES', 3);
          module.pendingFeatures.forEach(feat => {
            addBullet(feat, 3, 'o');
          });
        } else {
          addInfoBox('MODULO COMPLETO', 'Todas las funcionalidades planificadas han sido implementadas.', 'success');
        }
        
        currentY += 8;
        moduleIndex++;
      }

      // ==================== RESUMEN FINAL ====================
      addNewPage();
      setProgress(95);
      
      addMainTitle('RESUMEN Y PROXIMOS PASOS');
      
      const highPriority = MODULES_STATUS.filter(m => m.criticalForProduction && m.completionPercentage < 100);
      
      if (highPriority.length > 0) {
        addInfoBox('MODULOS CRITICOS PENDIENTES',
          highPriority.map(m => `${m.name} (${m.completionPercentage}%)`).join(', '),
          'warning');
      }
      
      addTitle('Estadisticas Finales', 2);
      addParagraph(`- Total modulos: ${totalModules}`);
      addParagraph(`- Completitud media: ${avgCompletion}%`);
      addParagraph(`- Funcionalidades completadas: ${completedFeatures}`);
      addParagraph(`- Funcionalidades pendientes: ${pendingFeatures}`);
      addParagraph(`- Modulos >90% completados: ${MODULES_STATUS.filter(m => m.completionPercentage >= 90).length}`);
      addParagraph(`- Modulos criticos: ${criticalModules}`);
      
      currentY += 5;
      addTitle('Recomendaciones Inmediatas', 2);
      addBullet('Priorizar completar modulos criticos para produccion', 0, '1.');
      addBullet('Implementar MFA/2FA en Sistema de Autenticacion', 0, '2.');
      addBullet('Iniciar proceso certificacion ISO 27001', 0, '3.');
      addBullet('Desarrollar app movil nativa', 0, '4.');
      addBullet('Completar integraciones calendario externo', 0, '5.');

      // ==================== PAGINA FINAL ====================
      addNewPage();
      
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ESTADO DETALLADO DEL APLICATIVO', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('CRM Bancario Creand', pageWidth / 2, 38, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-ES'), pageWidth / 2, 50, { align: 'center' });

      currentY = 75;
      doc.setTextColor(0, 0, 0);
      
      addTitle('Resumen del Documento', 2);
      const summaryData = [
        ['Total modulos analizados:', String(totalModules)],
        ['Completitud media:', `${avgCompletion}%`],
        ['Funcionalidades completadas:', String(completedFeatures)],
        ['Funcionalidades pendientes:', String(pendingFeatures)],
        ['Modulos criticos:', String(criticalModules)],
        ['Total paginas:', String(pageNumber)],
      ];
      
      summaryData.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 55, currentY);
        currentY += 6;
      });

      setProgress(100);
      
      const filename = `Estado_Detallado_Aplicativo_Creand_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Documento Estado Detallado generado', {
        description: `${pageNumber} paginas con ${totalModules} modulos analizados`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  // Calculate stats for display
  const totalModules = MODULES_STATUS.length;
  const avgCompletion = Math.round(MODULES_STATUS.reduce((acc, m) => acc + m.completionPercentage, 0) / totalModules);
  const completedFeatures = MODULES_STATUS.reduce((acc, m) => acc + m.completedFeatures.length, 0);
  const pendingFeatures = MODULES_STATUS.reduce((acc, m) => acc + m.pendingFeatures.length, 0);

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
            <ClipboardList className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Estado Detallado Aplicativo</CardTitle>
            <CardDescription>
              Que hace mi app + Cumplido vs Pendiente por modulo
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {totalModules} modulos
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {avgCompletion}% medio
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-muted-foreground">{completedFeatures} completadas</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <span className="text-muted-foreground">{pendingFeatures} pendientes</span>
          </div>
        </div>

        {generating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Generando documento... {progress}%
            </p>
          </div>
        )}

        <Button 
          onClick={generatePDF} 
          disabled={generating}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generar Estado Detallado PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
