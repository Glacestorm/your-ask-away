import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, CheckCircle, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface FeatureComparison {
  category: string;
  feature: string;
  creandStatus: 'implemented' | 'partial' | 'pending';
  competitorStatus: 'common' | 'advanced' | 'unique';
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: string;
  phase: number;
  description: string;
}

interface CompetitorFeature {
  competitor: string;
  url: string;
  features: string[];
  uniqueFeatures: string[];
  pricing: string;
}

const COMPETITOR_FEATURES: CompetitorFeature[] = [
  {
    competitor: "Salesforce Financial Services Cloud",
    url: "salesforce.com/financial-services-cloud",
    features: [
      "CRM 360 grados cliente bancario",
      "Einstein AI para predicciones",
      "Flujos de trabajo automatizados",
      "Integracion con core bancarios",
      "App movil nativa iOS/Android",
      "Reportes y dashboards avanzados",
      "Omnicanalidad completa",
      "Compliance y auditoria"
    ],
    uniqueFeatures: [
      "AppExchange con +5000 integraciones",
      "IA generativa Einstein GPT",
      "Marketing Cloud integrado",
      "Commerce Cloud bancario"
    ],
    pricing: "150-300 EUR/usuario/mes"
  },
  {
    competitor: "Microsoft Dynamics 365 Banking",
    url: "microsoft.com/dynamics-365",
    features: [
      "CRM unificado Microsoft 365",
      "Power BI nativo integrado",
      "Azure AI para analytics",
      "Teams integrado",
      "Excel y Outlook nativos",
      "Automatizacion Power Automate",
      "Cumplimiento GDPR/normativo"
    ],
    uniqueFeatures: [
      "Ecosistema Microsoft completo",
      "Copilot AI asistente",
      "LinkedIn Sales Navigator",
      "Azure cloud escala infinita"
    ],
    pricing: "100-200 EUR/usuario/mes"
  },
  {
    competitor: "Temenos T24/Transact",
    url: "temenos.com",
    features: [
      "Core bancario completo",
      "Contabilidad bancaria nativa",
      "Riesgos y compliance integrado",
      "Multimoneda nativo",
      "Canales digitales",
      "Reportes regulatorios",
      "Procesamiento tiempo real"
    ],
    uniqueFeatures: [
      "Core bancario lider mundial",
      "450+ bancos clientes",
      "Open banking nativo",
      "SaaS banking as a service"
    ],
    pricing: "Licencia 500K-2M EUR + 15-20% anual"
  },
  {
    competitor: "Backbase",
    url: "backbase.com",
    features: [
      "Plataforma engagement bancario",
      "Onboarding digital completo",
      "Portales cliente omnicanal",
      "App bancaria white-label",
      "Journey orchestration",
      "Widget library bancaria"
    ],
    uniqueFeatures: [
      "Experience platform especializada",
      "Micro-frontends arquitectura",
      "Journey builder visual",
      "Marketplace bancario"
    ],
    pricing: "80-150K EUR/year licencia"
  },
  {
    competitor: "nCino",
    url: "ncino.com",
    features: [
      "CRM originacion prestamos",
      "Workflow automatizado",
      "Document management",
      "Firma electronica integrada",
      "Reporting regulatorio",
      "Portal cliente/banquero"
    ],
    uniqueFeatures: [
      "Especializado en lending",
      "Salesforce native",
      "OCR documentos inteligente",
      "Scoring crediticio IA"
    ],
    pricing: "Suscripcion 50-100K EUR/year"
  }
];

const FEATURE_GAP_ANALYSIS: FeatureComparison[] = [
  // FASE 1 - Critico
  {
    category: "Movil",
    feature: "App movil nativa iOS/Android con modo offline",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'critical',
    effort: "3-4 meses",
    phase: 1,
    description: "Todos los competidores ofrecen app movil. Salesforce, Dynamics y Backbase tienen apps nativas premium. Creand requiere desarrollo React Native o Flutter."
  },
  {
    category: "IA",
    feature: "Asistente IA conversacional (chatbot bancario)",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'critical',
    effort: "2-3 meses",
    phase: 1,
    description: "Salesforce Einstein GPT, Microsoft Copilot lideran. Creand puede integrar Lovable AI para crear asistente especializado banca."
  },
  {
    category: "Integraciones",
    feature: "Conectores core bancarios (T24, Finacle, etc)",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'critical',
    effort: "4-6 meses",
    phase: 1,
    description: "Temenos T24, Finacle, Flexcube son los cores mas usados. Creand necesita APIs REST/SOAP para sincronizar datos clientes/cuentas."
  },
  {
    category: "Compliance",
    feature: "Certificacion ISO 27001",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'critical',
    effort: "6-12 meses",
    phase: 1,
    description: "Requisito obligatorio banca. Todos los competidores enterprise estan certificados. Creand debe iniciar proceso auditoria externa."
  },
  // FASE 2 - Alta prioridad
  {
    category: "Notificaciones",
    feature: "Push notifications movil y desktop",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'high',
    effort: "1-2 meses",
    phase: 2,
    description: "Firebase Cloud Messaging para movil, Web Push para desktop. Alertas en tiempo real visitas, objetivos, oportunidades."
  },
  {
    category: "Calendario",
    feature: "Integracion Google Calendar y Outlook",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'high',
    effort: "1 mes",
    phase: 2,
    description: "Sincronizacion bidireccional visitas con calendarios corporativos. OAuth2 para Google, Microsoft Graph API para Outlook."
  },
  {
    category: "Analytics",
    feature: "Export a PowerBI/Tableau",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'high',
    effort: "1-2 meses",
    phase: 2,
    description: "Dynamics tiene Power BI nativo. Creand necesita conectores ODBC o API REST para datasets BI externos."
  },
  {
    category: "Automatizacion",
    feature: "Workflow builder visual (low-code)",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'high',
    effort: "3-4 meses",
    phase: 2,
    description: "Salesforce Flow, Power Automate permiten crear automatizaciones sin codigo. Creand requiere builder drag-and-drop."
  },
  // FASE 3 - Media prioridad
  {
    category: "Open Banking",
    feature: "APIs PSD2/Open Banking",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'medium',
    effort: "3-4 meses",
    phase: 3,
    description: "Temenos, Backbase lideran en open banking. Creand puede agregar cuenta agregacion via Plaid, Tink o Salt Edge."
  },
  {
    category: "Scoring",
    feature: "Credit scoring ML integrado",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'medium',
    effort: "2-3 meses",
    phase: 3,
    description: "nCino, Salesforce ofrecen scoring IA. Creand puede integrar modelos ML propios o APIs terceros (Experian, Equifax)."
  },
  {
    category: "Documentos",
    feature: "Firma electronica integrada",
    creandStatus: 'pending',
    competitorStatus: 'common',
    priority: 'medium',
    effort: "1 mes",
    phase: 3,
    description: "DocuSign, Adobe Sign comunes en competidores. Creand puede integrar API DocuSign o alternativas europeas."
  },
  {
    category: "Marketing",
    feature: "Email marketing y campanas automatizadas",
    creandStatus: 'pending',
    competitorStatus: 'advanced',
    priority: 'medium',
    effort: "2 meses",
    phase: 3,
    description: "Salesforce Marketing Cloud, Dynamics Marketing lideran. Creand puede integrar Mailchimp, SendGrid, o Brevo."
  },
  // LO QUE CREAND YA TIENE (diferenciadores)
  {
    category: "Contabilidad",
    feature: "Contabilidad PGC Andorra/Espana integrada",
    creandStatus: 'implemented',
    competitorStatus: 'unique',
    priority: 'critical',
    effort: "Completado",
    phase: 0,
    description: "DIFERENCIADOR: Ningun competidor CRM tiene contabilidad nativa PGC. Salesforce/Dynamics requieren integraciones costosas con ERPs."
  },
  {
    category: "GIS",
    feature: "Sistema GIS bancario 20.000+ empresas",
    creandStatus: 'implemented',
    competitorStatus: 'unique',
    priority: 'critical',
    effort: "Completado",
    phase: 0,
    description: "DIFERENCIADOR: GIS con clustering, rutas y visualizacion cartera geografica. Competidores no tienen modulo GIS integrado."
  },
  {
    category: "Analisis Financiero",
    feature: "Ratios avanzados (DuPont, Z-Score, NOF)",
    creandStatus: 'implemented',
    competitorStatus: 'unique',
    priority: 'high',
    effort: "Completado",
    phase: 0,
    description: "DIFERENCIADOR: Analisis financiero completo con pyramide DuPont, Altman Z-Score, NOF. Competidores no incluyen."
  },
  {
    category: "IA Documentos",
    feature: "Parsing PDF estados financieros con IA",
    creandStatus: 'implemented',
    competitorStatus: 'advanced',
    priority: 'high',
    effort: "Completado",
    phase: 0,
    description: "VENTAJA: Gemini 2.5 para extraer datos PDF automaticamente. Similar a OCR de nCino pero especializado en EEFF."
  },
  {
    category: "Consolidacion",
    feature: "Consolidacion grupos empresariales",
    creandStatus: 'implemented',
    competitorStatus: 'unique',
    priority: 'medium',
    effort: "Completado",
    phase: 0,
    description: "DIFERENCIADOR: Consolidacion hasta 15 empresas con eliminaciones intergrupo. Competidores CRM no consolidan."
  }
];

export const CompetitorGapAnalysisGenerator = () => {
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
        doc.text('Gap Analysis Competitivo - CRM Creand', margin, pageHeight - 8);
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
      doc.text('ANALISIS GAP COMPETITIVO', pageWidth / 2, 32, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('CRM Bancario Creand vs Competidores', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Plan de Mejora por Fases', pageWidth / 2, 70, { align: 'center' });
      
      currentY = 95;
      doc.setTextColor(0, 0, 0);
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY - 5, contentWidth, 40, 3, 3, 'F');
      
      doc.setFontSize(10);
      const metadata = [
        ['Fecha:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Competidores Analizados:', String(COMPETITOR_FEATURES.length)],
        ['Funcionalidades Comparadas:', String(FEATURE_GAP_ANALYSIS.length)],
        ['Fases de Mejora:', '3 fases (18-24 meses)'],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 5, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 60, currentY);
        currentY += 8;
      });

      currentY += 10;
      addInfoBox('OBJETIVO DEL DOCUMENTO', 
        'Este documento analiza las funcionalidades de los principales competidores en CRM bancario (Salesforce, Dynamics, Temenos, Backbase, nCino) e identifica las brechas respecto a Creand, organizando las mejoras necesarias en fases priorizadas por impacto y esfuerzo.',
        'info');

      addFooter();

      // ==================== INDICE ====================
      addNewPage();
      setProgress(15);
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('INDICE', pageWidth / 2, currentY, { align: 'center' });
      currentY += 12;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 3 },
        { num: '2', title: 'COMPETIDORES ANALIZADOS', page: 4 },
        { num: '3', title: 'MATRIZ DE FUNCIONALIDADES', page: 8 },
        { num: '4', title: 'DIFERENCIADORES CREAND (VENTAJAS)', page: 12 },
        { num: '5', title: 'GAPS IDENTIFICADOS', page: 14 },
        { num: '6', title: 'PLAN DE MEJORA FASE 1 (CRITICO)', page: 16 },
        { num: '7', title: 'PLAN DE MEJORA FASE 2 (ALTA)', page: 20 },
        { num: '8', title: 'PLAN DE MEJORA FASE 3 (MEDIA)', page: 24 },
        { num: '9', title: 'ESTIMACION DE COSTES Y TIEMPOS', page: 28 },
        { num: '10', title: 'CONCLUSIONES Y ROADMAP', page: 30 },
      ];

      doc.setFontSize(9);
      indexItems.forEach(item => {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, margin, currentY);
        doc.text(item.title, margin + 12, currentY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        const dotsWidth = contentWidth - 45 - doc.getTextWidth(item.title);
        const dots = '.'.repeat(Math.max(1, Math.floor(dotsWidth / 1.5)));
        doc.text(dots, margin + 17 + doc.getTextWidth(item.title), currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), pageWidth - margin, currentY, { align: 'right' });
        currentY += 6;
      });

      addFooter();

      // ==================== 1. RESUMEN EJECUTIVO ====================
      addNewPage();
      setProgress(20);
      
      addMainTitle('1. RESUMEN EJECUTIVO');
      
      addParagraph('Este analisis compara CRM Bancario Creand con los 5 principales competidores del sector: Salesforce Financial Services Cloud, Microsoft Dynamics 365 Banking, Temenos T24/Transact, Backbase y nCino.');

      addInfoBox('CONCLUSION PRINCIPAL',
        'Creand tiene DIFERENCIADORES UNICOS en contabilidad PGC integrada, GIS bancario y analisis financiero avanzado que ningun competidor ofrece. Sin embargo, requiere mejoras en app movil, integraciones core bancario, certificacion ISO 27001 y automatizacion para competir en el segmento enterprise.',
        'warning');

      addTitle('Resumen de Gaps Criticos', 2);
      const criticalGaps = FEATURE_GAP_ANALYSIS.filter(f => f.priority === 'critical' && f.creandStatus === 'pending');
      criticalGaps.forEach(gap => {
        addBullet(`${gap.feature} (${gap.effort})`, 0, '*');
      });

      currentY += 5;
      addTitle('Diferenciadores Unicos de Creand', 2);
      const differentiators = FEATURE_GAP_ANALYSIS.filter(f => f.creandStatus === 'implemented');
      differentiators.forEach(diff => {
        addBullet(`${diff.feature} - ${diff.description.split('.')[0]}`, 0, '+');
      });

      // ==================== 2. COMPETIDORES ANALIZADOS ====================
      addNewPage();
      setProgress(30);
      
      addMainTitle('2. COMPETIDORES ANALIZADOS');
      
      COMPETITOR_FEATURES.forEach((comp, index) => {
        checkPageBreak(70);
        
        addTitle(`2.${index + 1} ${comp.competitor}`, 2);
        addParagraph(`URL: ${comp.url}`);
        addParagraph(`Pricing: ${comp.pricing}`);
        
        addTitle('Funcionalidades Principales', 3);
        comp.features.forEach(feat => {
          addBullet(feat, 3, '-');
        });
        
        addTitle('Funcionalidades Unicas/Avanzadas', 3);
        comp.uniqueFeatures.forEach(feat => {
          addBullet(feat, 3, '*');
        });
        
        currentY += 5;
      });

      // ==================== 3. MATRIZ DE FUNCIONALIDADES ====================
      addNewPage();
      setProgress(45);
      
      addMainTitle('3. MATRIZ DE FUNCIONALIDADES');
      
      addParagraph('Comparativa de funcionalidades entre Creand y competidores:');
      
      addTable(
        ['Funcionalidad', 'Creand', 'Salesforce', 'Dynamics', 'Temenos', 'Backbase'],
        [
          ['CRM 360 cliente', 'SI', 'SI', 'SI', 'SI', 'SI'],
          ['Contabilidad PGC', 'SI (Unico)', 'NO', 'NO', 'Parcial', 'NO'],
          ['GIS Bancario', 'SI (Unico)', 'NO', 'NO', 'NO', 'NO'],
          ['Analisis financiero avanzado', 'SI (Unico)', 'Basico', 'Power BI', 'SI', 'NO'],
          ['App movil nativa', 'NO', 'SI', 'SI', 'SI', 'SI'],
          ['IA Generativa', 'Parcial', 'Einstein GPT', 'Copilot', 'Parcial', 'NO'],
          ['Workflow visual', 'NO', 'Flow', 'Power Auto', 'SI', 'SI'],
          ['Open Banking PSD2', 'NO', 'Partners', 'Partners', 'SI', 'SI'],
          ['ISO 27001', 'Pendiente', 'SI', 'SI', 'SI', 'SI'],
          ['Firma electronica', 'NO', 'DocuSign', 'Adobe Sign', 'SI', 'SI'],
        ],
        [45, 28, 28, 28, 28, 28]
      );

      addInfoBox('INTERPRETACION',
        'Creand tiene ventaja competitiva en verticalizacion bancaria (contabilidad, GIS, ratios). Los gaps principales son: movilidad, automatizacion y certificaciones. Estos son subsanables en 18-24 meses.',
        'info');

      // ==================== 4. DIFERENCIADORES CREAND ====================
      addNewPage();
      setProgress(55);
      
      addMainTitle('4. DIFERENCIADORES CREAND (VENTAJAS COMPETITIVAS)');
      
      addParagraph('Funcionalidades que Creand tiene y NINGUN competidor ofrece:');
      
      differentiators.forEach((diff, index) => {
        checkPageBreak(30);
        addTitle(`4.${index + 1} ${diff.feature}`, 2);
        addParagraph(diff.description);
        addInfoBox('VALOR DE NEGOCIO', 
          `Categoria: ${diff.category} | Prioridad: ${diff.priority.toUpperCase()} | Esta funcionalidad diferencia a Creand de todos los competidores CRM analizados.`,
          'success');
      });

      // ==================== 5. GAPS IDENTIFICADOS ====================
      addNewPage();
      setProgress(65);
      
      addMainTitle('5. GAPS IDENTIFICADOS');
      
      const gaps = FEATURE_GAP_ANALYSIS.filter(f => f.creandStatus !== 'implemented');
      
      addTable(
        ['Funcionalidad', 'Categoria', 'Prioridad', 'Esfuerzo', 'Fase'],
        gaps.map(g => [g.feature, g.category, g.priority.toUpperCase(), g.effort, `Fase ${g.phase}`]),
        [60, 30, 25, 25, 25]
      );

      // ==================== 6. PLAN FASE 1 ====================
      addNewPage();
      setProgress(72);
      
      addMainTitle('6. PLAN DE MEJORA FASE 1 (CRITICO - 0-6 MESES)');
      
      addInfoBox('OBJETIVO FASE 1',
        'Implementar las funcionalidades criticas que son requisito minimo para competir en el segmento bancario enterprise: app movil, integraciones core, certificacion ISO.',
        'warning');
      
      const phase1 = FEATURE_GAP_ANALYSIS.filter(f => f.phase === 1);
      
      phase1.forEach((item, index) => {
        checkPageBreak(40);
        addTitle(`6.${index + 1} ${item.feature}`, 2);
        addParagraph(item.description);
        addParagraph(`Esfuerzo estimado: ${item.effort}`);
        addParagraph(`Categoria: ${item.category} | Prioridad: ${item.priority.toUpperCase()}`);
        currentY += 3;
      });

      // ==================== 7. PLAN FASE 2 ====================
      addNewPage();
      setProgress(80);
      
      addMainTitle('7. PLAN DE MEJORA FASE 2 (ALTA - 6-12 MESES)');
      
      addInfoBox('OBJETIVO FASE 2',
        'Mejorar productividad y experiencia de usuario con notificaciones push, integracion calendarios, analytics avanzados y automatizacion workflows.',
        'info');
      
      const phase2 = FEATURE_GAP_ANALYSIS.filter(f => f.phase === 2);
      
      phase2.forEach((item, index) => {
        checkPageBreak(40);
        addTitle(`7.${index + 1} ${item.feature}`, 2);
        addParagraph(item.description);
        addParagraph(`Esfuerzo estimado: ${item.effort}`);
        currentY += 3;
      });

      // ==================== 8. PLAN FASE 3 ====================
      addNewPage();
      setProgress(88);
      
      addMainTitle('8. PLAN DE MEJORA FASE 3 (MEDIA - 12-24 MESES)');
      
      addInfoBox('OBJETIVO FASE 3',
        'Funcionalidades avanzadas que aportan diferenciacion adicional: Open Banking, scoring ML, firma electronica, email marketing.',
        'info');
      
      const phase3 = FEATURE_GAP_ANALYSIS.filter(f => f.phase === 3);
      
      phase3.forEach((item, index) => {
        checkPageBreak(40);
        addTitle(`8.${index + 1} ${item.feature}`, 2);
        addParagraph(item.description);
        addParagraph(`Esfuerzo estimado: ${item.effort}`);
        currentY += 3;
      });

      // ==================== 9. ESTIMACION COSTES ====================
      addNewPage();
      setProgress(92);
      
      addMainTitle('9. ESTIMACION DE COSTES Y TIEMPOS');
      
      addTable(
        ['Fase', 'Duracion', 'Recursos', 'Coste Estimado'],
        [
          ['Fase 1 - Critico', '0-6 meses', '2-3 desarrolladores senior', '80.000 - 120.000 EUR'],
          ['Fase 2 - Alta', '6-12 meses', '2 desarrolladores', '50.000 - 80.000 EUR'],
          ['Fase 3 - Media', '12-24 meses', '1-2 desarrolladores', '40.000 - 60.000 EUR'],
          ['ISO 27001 (paralelo)', '12 meses', 'Consultor + interno', '25.000 - 45.000 EUR'],
          ['TOTAL', '18-24 meses', '-', '195.000 - 305.000 EUR'],
        ],
        [45, 35, 45, 45]
      );

      addInfoBox('NOTA SOBRE COSTES',
        'Los costes incluyen desarrollo, testing, documentacion y deployment. No incluyen licencias de terceros (DocuSign, Firebase, etc.) ni costes de certificacion ISO externos. Tarifas calculadas a 85-95 EUR/hora desarrollador senior.',
        'warning');

      // ==================== 10. CONCLUSIONES ====================
      addNewPage();
      setProgress(96);
      
      addMainTitle('10. CONCLUSIONES Y ROADMAP');
      
      addInfoBox('POSICIONAMIENTO ESTRATEGICO',
        'Creand debe posicionarse como "CRM bancario especializado con contabilidad nativa" - un nicho donde Salesforce/Dynamics no compiten directamente. La estrategia es fortalecer diferenciadores existentes mientras se cierran gaps criticos de movilidad y certificacion.',
        'success');
      
      addTitle('Roadmap Recomendado', 2);
      addBullet('Q1-Q2: Iniciar desarrollo app movil + proceso ISO 27001', 0, '1.');
      addBullet('Q2-Q3: Integraciones calendario + push notifications', 0, '2.');
      addBullet('Q3-Q4: Primeros conectores core bancario (API T24)', 0, '3.');
      addBullet('Q4+: Certificacion ISO + workflow builder + Open Banking', 0, '4.');
      
      currentY += 5;
      addTitle('Metricas de Exito', 2);
      addBullet('App movil publicada en stores con >4.0 estrellas', 0, '-');
      addBullet('Certificacion ISO 27001 obtenida', 0, '-');
      addBullet('3+ integraciones core bancario operativas', 0, '-');
      addBullet('NPS usuarios >50', 0, '-');

      // ==================== PAGINA FINAL ====================
      addNewPage();
      
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ANALISIS GAP COMPETITIVO', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('CRM Bancario Creand', pageWidth / 2, 38, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-ES'), pageWidth / 2, 50, { align: 'center' });

      currentY = 75;
      doc.setTextColor(0, 0, 0);
      
      addTitle('Resumen del Documento', 2);
      const summaryData = [
        ['Competidores analizados:', String(COMPETITOR_FEATURES.length)],
        ['Funcionalidades comparadas:', String(FEATURE_GAP_ANALYSIS.length)],
        ['Diferenciadores Creand:', String(differentiators.length)],
        ['Gaps identificados:', String(gaps.length)],
        ['Fases de mejora:', '3'],
        ['Inversion total estimada:', '195.000 - 305.000 EUR'],
        ['Tiempo total estimado:', '18-24 meses'],
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
      
      const filename = `Gap_Analysis_Competitivo_Creand_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Documento Gap Analysis generado', {
        description: `${pageNumber} paginas con comparativa de ${COMPETITOR_FEATURES.length} competidores`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Target className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Gap Analysis Competitivo</CardTitle>
            <CardDescription>
              Que hacen los competidores vs Creand + Plan de mejora por fases
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              5 competidores
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              3 fases mejora
            </Badge>
          </div>
        </div>

        {generating && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Generando analisis... {progress}%
            </p>
          </div>
        )}

        <Button 
          onClick={generatePDF} 
          disabled={generating}
          className="w-full bg-amber-600 hover:bg-amber-700"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generar Gap Analysis PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
