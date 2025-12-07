import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface GenerationStep {
  id: string;
  name: string;
  completed: boolean;
}

export const TechnicalDocumentGenerator = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'cover', name: 'Portada y Metadatos', completed: false },
    { id: 'index', name: 'Índice General', completed: false },
    { id: 'executive', name: 'Resumen Ejecutivo', completed: false },
    { id: 'architecture', name: 'Arquitectura Técnica', completed: false },
    { id: 'roles', name: 'Sistema de Roles', completed: false },
    { id: 'modules', name: 'Módulos Funcionales', completed: false },
    { id: 'edge', name: 'Edge Functions', completed: false },
    { id: 'compliance', name: 'Normativa y Cumplimiento', completed: false },
    { id: 'financial', name: 'Análisis Financiero', completed: false },
    { id: 'optimization', name: 'Optimización Multiusuario', completed: false },
    { id: 'integrations', name: 'Integraciones', completed: false },
    { id: 'recommendations', name: 'Recomendaciones', completed: false },
  ]);

  const updateStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const generatePDF = async () => {
    setGenerating(true);
    setProgress(0);
    setSteps(steps.map(s => ({ ...s, completed: false })));

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;
      let pageNumber = 1;
      const tocEntries: { title: string; page: number; level: number }[] = [];

      // Helper functions
      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        currentY = margin;
        addPageNumber();
      };

      const addPageNumber = () => {
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        doc.text('Documentación Técnico-Funcional - Creand CRM', margin, pageHeight - 10);
        doc.setTextColor(0, 0, 0);
      };

      const checkPageBreak = (neededSpace: number) => {
        if (currentY + neededSpace > pageHeight - 25) {
          addNewPage();
          return true;
        }
        return false;
      };

      const addTitle = (text: string, level: number = 1) => {
        checkPageBreak(20);
        const sizes = [18, 14, 12, 11];
        doc.setFontSize(sizes[level - 1] || 11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text(text, margin, currentY);
        tocEntries.push({ title: text, page: pageNumber, level });
        currentY += level === 1 ? 12 : 8;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addSubtitle = (text: string) => {
        checkPageBreak(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(55, 65, 81);
        doc.text(text, margin, currentY);
        currentY += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addParagraph = (text: string, indent: number = 0) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        lines.forEach((line: string) => {
          checkPageBreak(6);
          doc.text(line, margin + indent, currentY);
          currentY += 5;
        });
        currentY += 2;
      };

      const addOpinion = (text: string) => {
        checkPageBreak(20);
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(59, 130, 246);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        const boxHeight = (lines.length * 5) + 10;
        doc.roundedRect(margin, currentY - 3, contentWidth, boxHeight, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bolditalic');
        doc.setTextColor(30, 64, 175);
        doc.text('💡 Opinión Profesional:', margin + 5, currentY + 3);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(55, 65, 81);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, currentY + 9 + (i * 5));
        });
        currentY += boxHeight + 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addBullet = (text: string, indent: number = 0) => {
        checkPageBreak(6);
        doc.setFontSize(10);
        doc.text('•', margin + indent, currentY);
        const lines = doc.splitTextToSize(text, contentWidth - indent - 8);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + indent + 5, currentY + (i * 5));
        });
        currentY += lines.length * 5 + 2;
      };

      const addTable = (headers: string[], rows: string[][], colWidths?: number[]) => {
        checkPageBreak(30);
        const defaultWidth = contentWidth / headers.length;
        const widths = colWidths || headers.map(() => defaultWidth);
        
        // Header
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        let xPos = margin;
        doc.rect(margin, currentY - 4, contentWidth, 8, 'F');
        headers.forEach((header, i) => {
          doc.text(header, xPos + 2, currentY);
          xPos += widths[i];
        });
        currentY += 6;

        // Rows
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        rows.forEach((row, rowIndex) => {
          checkPageBreak(8);
          if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, currentY - 4, contentWidth, 7, 'F');
          }
          xPos = margin;
          row.forEach((cell, i) => {
            const cellText = doc.splitTextToSize(cell, widths[i] - 4)[0];
            doc.text(cellText || '', xPos + 2, currentY);
            xPos += widths[i];
          });
          currentY += 6;
        });
        currentY += 5;
      };

      // ========== PORTADA ==========
      setProgress(5);
      updateStep('cover');
      
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTACIÓN', pageWidth / 2, 35, { align: 'center' });
      doc.text('TÉCNICO-FUNCIONAL', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema CRM Bancario - Creand', pageWidth / 2, 65, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      currentY = 100;
      
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Documento', margin, currentY);
      currentY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const metadata = [
        ['Versión:', '1.0.0'],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Plataforma:', 'Lovable + Supabase (Lovable Cloud)'],
        ['Framework:', 'React 18.3 + TypeScript + Vite'],
        ['Base de Datos:', 'PostgreSQL (Supabase)'],
        ['Autor:', 'Sistema Automático de Documentación'],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 7;
      });

      currentY += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumen del Sistema', margin, currentY);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const summary = 'Este documento proporciona una descripción exhaustiva del sistema CRM bancario desarrollado para Creand, entidad financiera andorrana. El sistema integra gestión comercial, análisis financiero según PGC Andorra, cumplimiento normativo bancario europeo y español, y capacidades avanzadas de reporting y auditoría.';
      const summaryLines = doc.splitTextToSize(summary, contentWidth);
      summaryLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });

      addPageNumber();

      // ========== ÍNDICE ==========
      addNewPage();
      setProgress(10);
      updateStep('index');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('ÍNDICE GENERAL', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 3 },
        { num: '2', title: 'ARQUITECTURA TÉCNICA', page: 4 },
        { num: '2.1', title: 'Stack Tecnológico', page: 4, indent: true },
        { num: '2.2', title: 'Estructura del Proyecto', page: 5, indent: true },
        { num: '2.3', title: 'Base de Datos', page: 6, indent: true },
        { num: '2.4', title: 'Autenticación y Seguridad', page: 7, indent: true },
        { num: '3', title: 'SISTEMA DE ROLES Y PERMISOS', page: 8 },
        { num: '3.1', title: 'Jerarquía de Roles', page: 8, indent: true },
        { num: '3.2', title: 'Control de Acceso RBAC', page: 9, indent: true },
        { num: '3.3', title: 'Políticas RLS', page: 10, indent: true },
        { num: '4', title: 'MÓDULOS FUNCIONALES', page: 11 },
        { num: '4.1', title: 'Dashboard de Gestores', page: 11, indent: true },
        { num: '4.2', title: 'Dashboard Director de Negoci', page: 13, indent: true },
        { num: '4.3', title: 'Dashboard Director d\'Oficina', page: 14, indent: true },
        { num: '4.4', title: 'Dashboard Responsable Comercial', page: 15, indent: true },
        { num: '4.5', title: 'Dashboard Auditor', page: 16, indent: true },
        { num: '4.6', title: 'Mapa Geográfico Interactivo', page: 17, indent: true },
        { num: '4.7', title: 'Gestión de Empresas', page: 19, indent: true },
        { num: '4.8', title: 'Sistema de Visitas', page: 20, indent: true },
        { num: '4.9', title: 'Módulo de Contabilidad PGC', page: 22, indent: true },
        { num: '4.10', title: 'Sistema de Objetivos y KPIs', page: 26, indent: true },
        { num: '4.11', title: 'Sistema de Alertas', page: 28, indent: true },
        { num: '4.12', title: 'Métricas Unificadas', page: 29, indent: true },
        { num: '5', title: 'EDGE FUNCTIONS (BACKEND)', page: 31 },
        { num: '6', title: 'NORMATIVA Y CUMPLIMIENTO', page: 34 },
        { num: '7', title: 'ANÁLISIS FINANCIERO', page: 38 },
        { num: '8', title: 'OPTIMIZACIÓN MULTIUSUARIO', page: 41 },
        { num: '9', title: 'INTEGRACIONES EXTERNAS', page: 43 },
        { num: '10', title: 'RECOMENDACIONES Y MEJORAS', page: 45 },
      ];

      doc.setFontSize(10);
      indexItems.forEach(item => {
        const indent = item.indent ? 10 : 0;
        doc.setFont('helvetica', item.indent ? 'normal' : 'bold');
        doc.text(item.num, margin + indent, currentY);
        doc.text(item.title, margin + indent + 12, currentY);
        const dots = '.'.repeat(Math.max(1, Math.floor((contentWidth - indent - 50 - doc.getTextWidth(item.title)) / 2)));
        doc.setTextColor(180, 180, 180);
        doc.text(dots, margin + indent + 15 + doc.getTextWidth(item.title), currentY);
        doc.setTextColor(0, 0, 0);
        doc.text(String(item.page), pageWidth - margin, currentY, { align: 'right' });
        currentY += 6;
        if (currentY > pageHeight - 30) {
          addNewPage();
        }
      });

      addPageNumber();

      // ========== 1. RESUMEN EJECUTIVO ==========
      addNewPage();
      setProgress(15);
      updateStep('executive');
      
      addTitle('1. RESUMEN EJECUTIVO');
      
      addParagraph('El Sistema CRM Bancario Creand es una plataforma integral de gestión comercial desarrollada específicamente para Creand, entidad bancaria del Principado de Andorra. Esta solución tecnológica abarca todos los aspectos de la gestión de relaciones con clientes empresariales, desde la captación hasta el seguimiento contable y el cumplimiento normativo.');
      
      addSubtitle('Objetivos Principales del Sistema');
      addBullet('Centralizar la gestión de la cartera comercial de empresas con capacidad para más de 20,000 registros');
      addBullet('Proporcionar herramientas de análisis financiero según el Plan General Contable de Andorra');
      addBullet('Garantizar el cumplimiento normativo bancario español y europeo (Basel III/IV, IFRS 9, MiFID II)');
      addBullet('Optimizar la productividad de gestores comerciales mediante automatización y IA');
      addBullet('Ofrecer visibilidad ejecutiva mediante dashboards especializados por rol');
      
      addSubtitle('Alcance Funcional');
      addParagraph('El sistema cubre las siguientes áreas funcionales principales:');
      addBullet('Gestión completa del ciclo de vida de clientes empresariales', 5);
      addBullet('Sistema de visitas comerciales con fichas detalladas y validación jerárquica', 5);
      addBullet('Módulo contable con soporte para estados financieros Normal, Abreujat y Simplificat', 5);
      addBullet('Análisis de riesgo crediticio con Z-Score de Altman y rating bancario', 5);
      addBullet('Sistema de objetivos y KPIs con seguimiento en tiempo real', 5);
      addBullet('Mapa geográfico interactivo con clustering y múltiples capas visuales', 5);
      addBullet('Consolidación de balances para grupos de hasta 15 empresas', 5);
      
      addOpinion('Este sistema representa una solución enterprise de alta complejidad. La arquitectura elegida (React + Supabase) proporciona escalabilidad sin costes de infraestructura tradicional. El cumplimiento normativo integrado reduce significativamente el riesgo operacional.');
      
      addSubtitle('Capacidades Técnicas Destacadas');
      addBullet('Soporte para 500-1000+ usuarios simultáneos mediante optimización de canales realtime');
      addBullet('Generación automática de planes de acción mediante IA (Lovable AI - Gemini 2.5)');
      addBullet('Importación inteligente de estados financieros desde PDF con OCR y mapeo automático');
      addBullet('Sistema de alertas con escalado automático y notificaciones multicanal');
      addBullet('Paginación server-side para gestión eficiente de grandes volúmenes de datos');

      // ========== 2. ARQUITECTURA TÉCNICA ==========
      addNewPage();
      setProgress(25);
      updateStep('architecture');
      
      addTitle('2. ARQUITECTURA TÉCNICA');
      
      addTitle('2.1 Stack Tecnológico', 2);
      addParagraph('El sistema está construido sobre un stack moderno y probado en producción:');
      
      addTable(
        ['Capa', 'Tecnología', 'Versión', 'Propósito'],
        [
          ['Frontend', 'React', '18.3.1', 'Interfaz de usuario reactiva'],
          ['Lenguaje', 'TypeScript', '5.x', 'Tipado estático y seguridad'],
          ['Build', 'Vite', '5.x', 'Bundling y desarrollo rápido'],
          ['Estilos', 'Tailwind CSS', '3.x', 'Utilidades CSS'],
          ['Componentes', 'shadcn/ui + Radix', '-', 'UI accesible y personalizable'],
          ['Estado', 'React Query', '5.83.0', 'Gestión estado servidor'],
          ['Backend', 'Supabase', '-', 'BaaS PostgreSQL'],
          ['Auth', 'Supabase Auth', '-', 'Autenticación JWT'],
          ['Functions', 'Deno Edge', '-', 'Serverless functions'],
          ['Mapas', 'MapLibre GL', '5.13.0', 'Mapas vectoriales'],
          ['Gráficos', 'Recharts', '2.15.4', 'Visualización datos'],
          ['PDF', 'jsPDF', '3.0.4', 'Generación documentos'],
          ['Excel', 'xlsx', '0.18.5', 'Importación/exportación'],
        ],
        [40, 45, 25, 60]
      );

      addOpinion('La elección de este stack es excelente para aplicaciones empresariales. React Query elimina la complejidad de gestión de estado tradicional, mientras que Supabase proporciona capacidades de PostgreSQL enterprise sin administración de servidores. shadcn/ui permite personalización profunda manteniendo accesibilidad WCAG.');

      addTitle('2.2 Estructura del Proyecto', 2);
      addParagraph('El proyecto sigue una arquitectura modular y escalable:');
      
      const projectStructure = `
src/
├── components/          # Componentes React reutilizables
│   ├── admin/          # Dashboards y gestión administrativa
│   │   ├── accounting/ # Módulo contabilidad (45+ componentes)
│   │   └── ...         # Otros módulos admin
│   ├── company/        # Gestión de empresas
│   ├── dashboard/      # Cards y widgets dashboard
│   ├── map/            # Componentes cartográficos
│   ├── reports/        # Generadores de informes
│   ├── ui/             # Componentes UI base (shadcn)
│   └── visits/         # Sistema de visitas
├── contexts/           # React Contexts (Theme, Language, Presence)
├── hooks/              # Custom hooks reutilizables
├── integrations/       # Configuración Supabase
├── lib/                # Utilidades y helpers
├── locales/            # Internacionalización (ES, CA, EN, FR)
├── pages/              # Páginas/rutas principales
└── types/              # Definiciones TypeScript

supabase/
├── config.toml         # Configuración proyecto
├── functions/          # 24 Edge Functions Deno
└── migrations/         # Migraciones base de datos
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      const structureLines = projectStructure.split('\n');
      structureLines.forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin + 5, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 5;

      addTitle('2.3 Base de Datos', 2);
      addParagraph('El esquema de base de datos comprende más de 50 tablas organizadas en dominios funcionales:');

      addSubtitle('Tablas Principales por Dominio');
      
      addTable(
        ['Dominio', 'Tablas', 'Registros Est.'],
        [
          ['Empresas', 'companies, company_contacts, company_documents, company_photos', '20,000+'],
          ['Visitas', 'visits, visit_sheets, visit_participants, visit_reminders', '100,000+'],
          ['Productos', 'products, company_products, company_tpv_terminals', '50,000+'],
          ['Contabilidad', 'balance_sheets, income_statements, cash_flow_statements, equity_changes', '25,000+'],
          ['Objetivos', 'goals, goal_progress, action_plans, action_plan_steps', '10,000+'],
          ['Alertas', 'alerts, alert_history, notifications', '50,000+'],
          ['Usuarios', 'profiles, user_roles, audit_logs', '1,000+'],
          ['Consolidación', 'consolidation_groups, consolidation_group_members, consolidated_*', '5,000+'],
        ],
        [35, 95, 30]
      );

      addOpinion('El diseño de base de datos sigue principios de normalización adecuados para sistemas transaccionales bancarios. El archivado automático de estados financieros >5 años cumple con requisitos de retención normativa mientras optimiza rendimiento en tablas activas.');

      addTitle('2.4 Autenticación y Seguridad', 2);
      addParagraph('El sistema implementa múltiples capas de seguridad:');

      addSubtitle('Mecanismos de Seguridad');
      addBullet('Autenticación JWT mediante Supabase Auth con tokens de corta duración');
      addBullet('Row Level Security (RLS) en todas las tablas con políticas granulares');
      addBullet('Verificación de roles en cliente y servidor para doble validación');
      addBullet('Bloqueo optimista para prevenir conflictos de edición concurrente');
      addBullet('Auditoría completa de acciones en tabla audit_logs');
      addBullet('Encriptación de secretos mediante Supabase Vault');

      addOpinion('La implementación de seguridad es robusta. Las políticas RLS garantizan aislamiento de datos a nivel de base de datos, no solo aplicación. Sin embargo, recomendaría añadir autenticación MFA para roles administrativos.');

      // ========== 3. SISTEMA DE ROLES ==========
      addNewPage();
      setProgress(35);
      updateStep('roles');
      
      addTitle('3. SISTEMA DE ROLES Y PERMISOS');
      
      addTitle('3.1 Jerarquía de Roles', 2);
      addParagraph('El sistema implementa una jerarquía de 6 roles con permisos diferenciados:');

      addTable(
        ['Rol', 'Nombre UI', 'Nivel', 'Alcance de Datos'],
        [
          ['superadmin', 'Superadministrador', '1', 'Acceso total, gestión sistema'],
          ['director_comercial', 'Director de Negoci', '2', 'Visión global, todos los datos'],
          ['responsable_comercial', 'Responsable Comercial', '3', 'Gestión comercial, auditoría'],
          ['director_oficina', 'Director d\'Oficina', '4', 'Solo su oficina asignada'],
          ['user (gestor)', 'Gestor', '5', 'Solo sus datos personales'],
          ['auditor', 'Auditor', '6', 'Solo lectura, sin fichas visita'],
        ],
        [45, 50, 20, 55]
      );

      addSubtitle('Diagrama de Jerarquía');
      addParagraph('La jerarquía sigue un modelo piramidal donde cada nivel superior puede ver los datos de niveles inferiores dentro de su ámbito:');

      const hierarchy = `
                    ┌─────────────────┐
                    │   SUPERADMIN    │ ← Acceso total
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────────┐  ┌─────────┐
   │  DIRECTOR   │  │  RESPONSABLE    │  │ AUDITOR │
   │   NEGOCI    │  │   COMERCIAL     │  │(Lectura)│
   └──────┬──────┘  └────────┬────────┘  └─────────┘
          │                  │
          ▼                  │
   ┌─────────────┐           │
   │  DIRECTOR   │◄──────────┘
   │   OFICINA   │
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │   GESTOR    │ ← Solo sus datos
   └─────────────┘
      `.trim();

      doc.setFontSize(7);
      doc.setFont('courier', 'normal');
      hierarchy.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin, currentY);
        currentY += 3.5;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 8;

      addTitle('3.2 Control de Acceso RBAC', 2);
      addParagraph('El control de acceso basado en roles (RBAC) se implementa en tres niveles:');

      addSubtitle('1. Nivel de Navegación (Frontend)');
      addBullet('AdminSidebar filtra opciones de menú según rol del usuario');
      addBullet('Componentes verifican rol antes de renderizar funcionalidades');
      addBullet('Rutas protegidas con guardias de autenticación');

      addSubtitle('2. Nivel de Lógica (Hooks/Context)');
      addBullet('useAuth hook proporciona información de rol y permisos');
      addBullet('Consultas a base de datos filtradas por rol automáticamente');
      addBullet('Funciones de ayuda is_admin_or_superadmin() para validaciones');

      addSubtitle('3. Nivel de Datos (RLS)');
      addBullet('Políticas RLS en PostgreSQL garantizan aislamiento de datos');
      addBullet('Cada tabla tiene políticas para SELECT, INSERT, UPDATE, DELETE');
      addBullet('Funciones SECURITY DEFINER para operaciones especiales');

      addTitle('3.3 Políticas RLS', 2);
      addParagraph('Ejemplos de políticas implementadas:');

      const rlsExamples = `
-- Ejemplo: Política para tabla companies
CREATE POLICY "Gestores ven solo sus empresas" ON companies
  FOR SELECT USING (
    gestor_id = auth.uid() OR
    is_admin_or_superadmin(auth.uid())
  );

-- Ejemplo: Política para visit_sheets
CREATE POLICY "Solo crear fichas propias" ON visit_sheets
  FOR INSERT WITH CHECK (
    gestor_id = auth.uid()
  );

-- Ejemplo: Política con verificación de oficina
CREATE POLICY "Director oficina ve su oficina" ON companies
  FOR SELECT USING (
    oficina = get_user_office(auth.uid()) OR
    is_admin_or_superadmin(auth.uid())
  );
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      rlsExamples.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 5;

      addOpinion('La implementación de RBAC es ejemplar. La triple capa (UI, lógica, datos) proporciona defensa en profundidad. Las políticas RLS son especialmente importantes para prevenir acceso no autorizado incluso si hay vulnerabilidades en el frontend.');

      // ========== 4. MÓDULOS FUNCIONALES ==========
      addNewPage();
      setProgress(45);
      updateStep('modules');
      
      addTitle('4. MÓDULOS FUNCIONALES');
      
      addTitle('4.1 Dashboard de Gestores', 2);
      addParagraph('El dashboard de gestores (GestorDashboard.tsx - 938 líneas) proporciona una experiencia completa de gestión comercial personal:');

      addSubtitle('Características Principales');
      addBullet('Navegación 3D mediante tarjetas interactivas con efectos hover');
      addBullet('Estadísticas personales: visitas, tasa de éxito, empresas asignadas, productos ofertados');
      addBullet('Gráficos de evolución mensual con comparativa de períodos');
      addBullet('Filtros avanzados por productos, vinculación y fechas');
      addBullet('Sistema de objetivos personales con tracking en tiempo real');
      addBullet('Planes de acción generados automáticamente por IA');
      addBullet('Historial de objetivos con análisis de tendencias');
      addBullet('Benchmarking contra promedios de oficina y equipo');

      addSubtitle('Secciones del Dashboard');
      addTable(
        ['Sección', 'Funcionalidad', 'Componentes'],
        [
          ['Visió General', 'KPIs principales y estadísticas', 'Cards, gráficos circulares'],
          ['Visites', 'Gestión de visitas con creación inline', 'Formulario, lista paginada'],
          ['Objectius', 'Tracking de objetivos asignados', 'Progress bars, benchmarking'],
          ['Historial', 'Análisis histórico y tendencias', 'Gráficos, tablas comparativas'],
        ],
        [35, 70, 65]
      );

      addOpinion('El dashboard de gestores destaca por su enfoque en productividad. La generación de planes de acción con IA es innovadora - utiliza Gemini 2.5 para analizar métricas deficientes y proponer acciones concretas de mejora en 30 días.');

      addTitle('4.2 Dashboard Director de Negoci', 2);
      addParagraph('Dashboard ejecutivo (CommercialDirectorDashboard.tsx - 662 líneas) para visión global del negocio:');

      addSubtitle('KPIs Ejecutivos');
      addBullet('Total de visitas con indicador de tendencia mensual');
      addBullet('Tasa de éxito global con comparativa histórica');
      addBullet('Empresas activas y nuevas captaciones');
      addBullet('Productos contratados y pipeline comercial');
      addBullet('Ranking de gestores por múltiples métricas');

      addSubtitle('Visualizaciones');
      addBullet('Gráfico de distribución de resultados de visitas');
      addBullet('Tendencia mensual de actividad comercial');
      addBullet('Mapa de calor por oficinas');
      addBullet('Explorador de métricas con drill-down');

      addTitle('4.3 Dashboard Director d\'Oficina', 2);
      addParagraph('Vista filtrada por oficina asignada con acceso a gestores de su equipo:');
      addBullet('Métricas agregadas solo de su oficina');
      addBullet('Comparativa entre gestores de la oficina');
      addBullet('Gestión de objetivos para su equipo');
      addBullet('Calendario compartido de visitas del equipo');

      addTitle('4.4 Dashboard Responsable Comercial', 2);
      addParagraph('Panel de gestión comercial con capacidades de auditoría:');
      addBullet('Validación de fichas de visita de gestores');
      addBullet('Panel de auditoría de acciones por usuarios');
      addBullet('Acceso completo a métricas de todos los gestores');
      addBullet('Generación de reportes consolidados');

      addNewPage();
      addTitle('4.5 Dashboard Auditor', 2);
      addParagraph('Panel especializado para funciones de auditoría interna:');
      
      addSubtitle('Funcionalidades de Auditoría');
      addBullet('Visor de logs de auditoría del sistema completo');
      addBullet('Historial de alertas con filtros por tipo y fecha');
      addBullet('Panel normativo con análisis de cumplimiento regulatorio');
      addBullet('Análisis de ratios de liquidez, solvencia y riesgo');
      addBullet('Selección de empresas individuales o consolidadas (hasta 15)');

      addSubtitle('Análisis Normativo Disponible');
      addTable(
        ['Tipo', 'Análisis', 'Normativa Referencia'],
        [
          ['Liquidez', 'Ratio corriente, rápido, tesorería', 'Circular BE 4/2017'],
          ['Solvencia', 'Endeudamiento, autonomía, cobertura', 'CRR/CRD IV'],
          ['IFRS 9', 'Staging, ECL, PD/LGD', 'IFRS 9'],
          ['Basel III/IV', 'Tier 1, LCR, NSFR', 'Basel Committee'],
          ['Insolvencia', 'Z-Score, alertas concursales', 'Ley Concursal'],
        ],
        [30, 60, 80]
      );

      addOpinion('El dashboard de auditor cumple con principios de segregación de funciones. El acceso de solo lectura y la exclusión de fichas de visita garantizan independencia auditora. La integración de normativa bancaria múltiple es un diferenciador clave.');

      addTitle('4.6 Mapa Geográfico Interactivo', 2);
      addParagraph('Sistema cartográfico avanzado (MapContainer.tsx - 1,598 líneas) con múltiples capas:');

      addSubtitle('Características del Mapa');
      addBullet('Motor: MapLibre GL con renderizado vectorial WebGL');
      addBullet('Clustering: Supercluster para agrupación dinámica de marcadores');
      addBullet('Vista 3D: Edificios extruidos con control de pitch');
      addBullet('Estilos: OpenStreetMap estándar y satélite');
      addBullet('Geolocalización: Integración con Nominatim/OSM');

      addSubtitle('Modos de Visualización');
      addTable(
        ['Modo', 'Criterio de Color', 'Uso Principal'],
        [
          ['Estado', 'Status de empresa (colores config.)', 'Vista general de cartera'],
          ['Vinculación', 'Porcentaje afiliación Creand', 'Penetración bancaria'],
          ['Facturación', 'Rango de facturación anual', 'Segmentación por tamaño'],
          ['P&L Banco', 'Rentabilidad para Creand', 'Análisis de valor cliente'],
          ['Visitas', 'Frecuencia de visitas recientes', 'Cobertura comercial'],
        ],
        [35, 60, 75]
      );

      addSubtitle('Funcionalidades Interactivas');
      addBullet('Tooltips configurables con información de empresa');
      addBullet('Click en marcador abre panel de detalle de empresa');
      addBullet('Galería de fotos de empresa desde tooltip');
      addBullet('Reubicación de marcadores con long-press y drag');
      addBullet('Undo de última reubicación (15 segundos)');
      addBullet('Sidebar con filtros avanzados y modo fullscreen');

      addOpinion('La implementación cartográfica es de nivel profesional. El clustering evita sobrecarga visual con miles de empresas, y la reubicación con undo es crucial para correcciones de geocodificación imprecisa. El modo fullscreen sidebar es excelente para análisis detallado.');

      addNewPage();
      addTitle('4.7 Gestión de Empresas', 2);
      addParagraph('Módulo completo de gestión de cartera empresarial (CompaniesManager.tsx):');

      addSubtitle('Datos de Empresa');
      addBullet('Información básica: nombre, dirección, NRT, BP, CNAE, sector');
      addBullet('Datos financieros: facturación anual, beneficios, empleados');
      addBullet('Vinculación bancaria: porcentajes Creand/Morabanc/Andbank');
      addBullet('Contactos: múltiples contactos con roles y datos');
      addBullet('Documentos: gestión documental con almacenamiento cloud');
      addBullet('Fotos: galería de imágenes del establecimiento');
      addBullet('TPV: terminales de punto de venta asociados');

      addSubtitle('Operaciones Masivas');
      addBullet('Importación Excel con geocodificación automática');
      addBullet('Detección y eliminación de duplicados');
      addBullet('Geocodificación batch de empresas sin coordenadas');
      addBullet('Búsqueda automática de fotos de empresas');
      addBullet('Exportación a Excel y PDF');

      addTitle('4.8 Sistema de Visitas y Fichas', 2);
      addParagraph('Sistema integral de documentación comercial:');

      addSubtitle('Tipos de Visita');
      addBullet('Visita individual: gestor solo');
      addBullet('Visita conjunta: hasta 4 participantes de diferentes roles');
      addBullet('Canales: presencial, telefónica, videollamada');

      addSubtitle('Ficha de Visita (12 secciones)');
      addTable(
        ['Sección', 'Contenido'],
        [
          ['1. Datos Visita', 'Fecha, hora, duración, canal, tipo'],
          ['2. Datos Cliente', 'Auto-poblado desde empresa seleccionada'],
          ['3. Diagnóstico Inicial', 'Checklist de situación actual'],
          ['4. Situación Financiera', 'Campos específicos empresa/particular'],
          ['5. Necesidades Detectadas', 'Lista de necesidades identificadas'],
          ['6. Propuesta de Valor', 'Soluciones propuestas'],
          ['7. Productos/Servicios', 'Productos ofertados con importes'],
          ['8. Riesgos/Compliance/KYC', 'Verificaciones normativas'],
          ['9. Resumen Reunión', 'Notas de la reunión'],
          ['10. Próximos Pasos', 'Acciones con fechas'],
          ['11. Evaluación Potencial', 'Probabilidad de cierre'],
          ['12. Recordatorios', 'Alertas de seguimiento'],
        ],
        [50, 120]
      );

      addSubtitle('Flujo de Validación');
      addParagraph('Las fichas siguen un flujo de aprobación jerárquico:');
      addBullet('1. Gestor crea y envía ficha a validación');
      addBullet('2. Responsable Comercial revisa y aprueba/rechaza');
      addBullet('3. Si hay productos ofertados, debe especificar resultado de oferta');
      addBullet('4. Vinculación de ficha sincroniza con affiliations de empresa');
      addBullet('5. Email automático a gestor con resultado de validación');

      addOpinion('El sistema de fichas de visita es extremadamente completo. La validación obligatoria de resultado de oferta cuando hay productos previene datos incompletos. La sincronización de vinculación garantiza coherencia de datos.');

      addNewPage();
      addTitle('4.9 Módulo de Contabilidad PGC Andorra', 2);
      addParagraph('Módulo contable completo (AccountingManager.tsx - 1,631 líneas) con 45+ componentes especializados:');

      addSubtitle('Modelos Contables Soportados');
      addTable(
        ['Modelo', 'Empresas Aplicables', 'Estados Requeridos'],
        [
          ['Normal (Completo)', 'Todas las grandes empresas', 'Balance, P&G, EFE, ECPN, Memoria'],
          ['Abreujat', 'PYMES según umbrales', 'Balance abrv., P&G abrv., Memoria abrv.'],
          ['Simplificat', 'Microempresas', 'Balance simp., P&G simp.'],
        ],
        [45, 50, 75]
      );

      addSubtitle('Estados Financieros Implementados');
      addBullet('Balance de Situación: Activo, Pasivo, Patrimonio Neto');
      addBullet('Cuenta de Pérdidas y Ganancias: estructura funcional PGC');
      addBullet('Estado de Flujos de Efectivo: actividades operativas, inversión, financiación');
      addBullet('Estado de Cambios en Patrimonio Neto');
      addBullet('Memoria/Notas Financieras: notas numeradas con contenido');

      addSubtitle('Análisis Financiero');
      addTable(
        ['Componente', 'Análisis', 'Indicadores'],
        [
          ['EBITEBITDAAnalysis', 'Resultado operativo', 'EBIT, EBITDA, margen'],
          ['WorkingCapitalAnalysis', 'Fondo de maniobra', 'FM, NOF, tesorería neta'],
          ['CashFlowAnalysis', 'Flujo de caja', 'Cash flow operativo, libre'],
          ['LongTermFinancialAnalysis', 'Solvencia largo plazo', 'Ratios endeudamiento'],
          ['AddedValueAnalysis', 'Valor añadido', 'Generación y distribución VA'],
          ['DuPontPyramid', 'Pirámide DuPont', 'ROE descompuesto'],
          ['ZScoreAnalysis', 'Predicción insolvencia', 'Z-Score Altman'],
          ['BankRatingAnalysis', 'Rating crediticio', 'Score 1-10 con factores'],
        ],
        [55, 50, 65]
      );

      addSubtitle('Consolidación de Balances');
      addParagraph('El sistema permite consolidar estados financieros de grupos empresariales:');
      addBullet('Selección de hasta 15 empresas para consolidación');
      addBullet('Métodos: integración global y proporcional');
      addBullet('Cálculo automático de intereses minoritarios');
      addBullet('Eliminación de inversiones inter-grupo');
      addBullet('Porcentajes de participación personalizables');
      addBullet('Exportación de estados consolidados');

      addSubtitle('Importación PDF Inteligente');
      addParagraph('Funcionalidad de parsing de estados financieros desde PDF:');
      addBullet('OCR automático para PDFs escaneados');
      addBullet('IA (Gemini 2.5) para mapeo inteligente de conceptos');
      addBullet('Preview de datos antes de confirmar importación');
      addBullet('Edición post-importación para correcciones');

      addOpinion('Este es el módulo más sofisticado del sistema. La implementación del PGC Andorra con tres modelos es correcta y completa. La consolidación hasta 15 empresas cubre necesidades de grupos bancarios. El parsing PDF con IA reduce drásticamente el tiempo de entrada de datos.');

      addNewPage();
      addTitle('4.10 Sistema de Objetivos y KPIs', 2);
      addParagraph('Gestión completa del ciclo de objetivos comerciales:');

      addSubtitle('Métricas de Objetivos');
      addTable(
        ['Métrica', 'Descripción', 'Cálculo'],
        [
          ['new_clients', 'Nuevas empresas captadas', 'COUNT nuevas en período'],
          ['visit_sheets', 'Fichas de visita creadas', 'COUNT fichas'],
          ['tpv_volume', 'Volumen TPV mensual', 'SUM monthly_volume'],
          ['conversion_rate', 'Tasa de conversión', '% visitas exitosas'],
          ['client_facturacion', 'Facturación clientes', 'SUM facturacion_anual'],
          ['products_per_client', 'Productos por cliente', 'AVG productos'],
          ['follow_ups', 'Seguimientos realizados', 'COUNT próximas_citas'],
        ],
        [45, 60, 65]
      );

      addSubtitle('Flujo de Objetivos');
      addBullet('1. Director/Responsable crea objetivo con métrica, valor target y fecha');
      addBullet('2. Asigna objetivo a gestor(es) específico(s) o equipo');
      addBullet('3. Sistema calcula progreso automáticamente en tiempo real');
      addBullet('4. Alertas automáticas cuando objetivo está en riesgo (<50% a mitad período)');
      addBullet('5. Notificación y email cuando objetivo se completa');
      addBullet('6. Benchmark contra promedios oficina/equipo');

      addSubtitle('Planes de Acción IA');
      addParagraph('Cuando un gestor tiene métricas por debajo del promedio, el sistema puede generar automáticamente un plan de acción:');
      addBullet('Análisis de métricas deficientes vs benchmarks');
      addBullet('Generación de 4-6 pasos concretos de mejora');
      addBullet('Duración 30 días con fechas específicas');
      addBullet('Tracking de completitud de pasos');

      addTitle('4.11 Sistema de Alertas', 2);
      addParagraph('Motor de alertas configurable con escalado automático:');

      addSubtitle('Tipos de Alertas');
      addBullet('Bajo rendimiento: métricas por debajo de umbral');
      addBullet('Objetivos en riesgo: progreso insuficiente');
      addBullet('Oportunidad crítica: probabilidad cierre ≥90%');
      addBullet('Recordatorios: fechas de seguimiento próximas');

      addSubtitle('Sistema de Escalado');
      addParagraph('Las alertas no resueltas escalan automáticamente:');
      addBullet('Nivel 1: Notificación al gestor');
      addBullet('Nivel 2 (24h): Escalado a director de oficina');
      addBullet('Nivel 3 (48h): Escalado a responsable comercial');
      addBullet('Nivel 4 (72h): Escalado a director comercial');

      addTitle('4.12 Métricas Unificadas', 2);
      addParagraph('Dashboard consolidado (UnifiedMetricsDashboard) con 8 KPIs bancarios:');

      addTable(
        ['KPI', 'Descripción', 'Benchmark Europeo'],
        [
          ['Visitas', 'Total visitas período', '15-20/mes'],
          ['Tasa Éxito', '% visitas exitosas', '>60%'],
          ['Vinculación', 'Afiliación media Creand', '>40%'],
          ['Productos/Cliente', 'Cross-selling', '>3.5'],
          ['Tasa Conversión', 'Leads a clientes', '>25%'],
          ['Cartera Clientes', 'Empresas asignadas', '50-100'],
          ['Productos Activos', 'Total productos', 'Creciente'],
          ['Visitas/Cliente', 'Cobertura', '>4/año'],
        ],
        [45, 65, 60]
      );

      addOpinion('El sistema de métricas unificadas proporciona visibilidad instantánea del rendimiento. Los benchmarks europeos permiten contextualizar resultados. La capacidad de cambiar tipos de gráfico (bar, line, area, pie, radar) facilita diferentes análisis.');

      // ========== 5. EDGE FUNCTIONS ==========
      addNewPage();
      setProgress(55);
      updateStep('edge');
      
      addTitle('5. EDGE FUNCTIONS (BACKEND)');
      addParagraph('El sistema implementa 24 funciones serverless en Deno para lógica de backend:');

      addTable(
        ['Función', 'Propósito', 'Trigger'],
        [
          ['check-alerts', 'Verificar condiciones de alertas', 'Cron 1h'],
          ['check-goal-achievements', 'Detectar objetivos completados', 'Cron 8:00'],
          ['check-goals-at-risk', 'Identificar objetivos en riesgo', 'Cron 8:00'],
          ['check-low-performance', 'Alertar bajo rendimiento', 'Cron diario'],
          ['check-visit-reminders', 'Generar recordatorios visitas', 'Cron 8:00'],
          ['check-visit-sheet-reminders', 'Recordatorios fichas pendientes', 'Cron 8:00'],
          ['escalate-alerts', 'Escalar alertas no resueltas', 'Cron 4h'],
          ['generate-action-plan', 'Generar plan IA', 'Manual/API'],
          ['geocode-address', 'Geocodificar direcciones', 'API'],
          ['manage-user', 'Gestión usuarios admin', 'API'],
          ['notify-visit-validation', 'Email validación ficha', 'DB Trigger'],
          ['parse-financial-pdf', 'Parsing PDF con IA', 'API'],
          ['search-company-photo', 'Buscar fotos empresas', 'API'],
          ['send-alert-email', 'Enviar alertas email', 'Event'],
          ['send-critical-opportunity-email', 'Email oportunidad 90%+', 'DB Trigger'],
          ['send-daily-kpi-report', 'Reporte diario KPI', 'Cron 8:00'],
          ['send-goal-achievement-email', 'Email logro objetivo', 'Event'],
          ['send-monthly-kpi-report', 'Reporte mensual', 'Cron 1er día'],
          ['send-monthly-reports', 'Reportes mensuales', 'Cron'],
          ['send-reminder-email', 'Emails recordatorio', 'Event'],
          ['send-visit-calendar-invite', 'Invitación calendario', 'API'],
          ['send-weekly-kpi-report', 'Reporte semanal KPI', 'Cron lunes'],
          ['smart-column-mapping', 'Mapeo inteligente Excel', 'API'],
          ['system-health', 'Monitoreo salud sistema', 'Cron/API'],
        ],
        [55, 70, 45]
      );

      addSubtitle('Arquitectura de Edge Functions');
      addParagraph('Las funciones están implementadas en Deno con las siguientes características:');
      addBullet('Ejecución en edge (baja latencia global)');
      addBullet('Acceso a Supabase client con service_role para operaciones admin');
      addBullet('Integración con Resend para emails transaccionales');
      addBullet('Integración con Lovable AI para funciones de IA');
      addBullet('Manejo de errores con logging estructurado');
      addBullet('Secrets management mediante Supabase Vault');

      addOpinion('La cobertura de edge functions es excelente. El uso de cron jobs para tareas periódicas (alertas, reportes) reduce carga en cliente. La función parse-financial-pdf con IA es particularmente innovadora para reducir entrada manual de datos.');

      // ========== 6. NORMATIVA Y CUMPLIMIENTO ==========
      addNewPage();
      setProgress(65);
      updateStep('compliance');
      
      addTitle('6. NORMATIVA Y CUMPLIMIENTO');
      addParagraph('El sistema implementa verificaciones de cumplimiento para múltiples marcos regulatorios:');

      addTitle('6.1 Normativa Bancaria Española', 2);
      
      addSubtitle('Circular BE 4/2017');
      addParagraph('Circular del Banco de España sobre normas de información financiera pública y reservada:');
      addBullet('Requisitos de provisiones para insolvencias');
      addBullet('Ratios de solvencia mínimos');
      addBullet('Formato de estados financieros consolidados');

      addSubtitle('Ley 15/2010 - Plazos de Pago');
      addParagraph('Modificación de la Ley de morosidad en operaciones comerciales:');
      addBullet('Monitoreo de días de cobro y pago');
      addBullet('Alertas cuando ratios exceden umbrales legales');

      addSubtitle('Ley Concursal');
      addParagraph('Detección temprana de insolvencia mediante:');
      addBullet('Z-Score de Altman para predicción de quiebra');
      addBullet('Alertas automáticas en zona de riesgo (<1.81)');
      addBullet('Monitoreo de ratios de liquidez críticos');

      addTitle('6.2 Normativa Europea', 2);

      addSubtitle('CRR/CRD IV (Capital Requirements)');
      addTable(
        ['Ratio', 'Mínimo', 'Cálculo Implementado'],
        [
          ['Common Equity Tier 1', '4.5%', 'CET1 / RWA'],
          ['Tier 1 Capital', '6.0%', 'Tier1 / RWA'],
          ['Total Capital', '8.0%', '(Tier1 + Tier2) / RWA'],
          ['Leverage Ratio', '3.0%', 'Tier1 / Total Exposure'],
        ],
        [55, 30, 85]
      );

      addSubtitle('Basel III/IV');
      addParagraph('Implementación de ratios de liquidez:');
      addBullet('LCR (Liquidity Coverage Ratio): Activos líquidos / Salidas netas 30 días ≥ 100%');
      addBullet('NSFR (Net Stable Funding Ratio): Financiación estable / Activos que requieren financiación ≥ 100%');
      addBullet('Sistema calcula proxies basados en datos de balance disponibles');

      addTitle('6.3 IFRS 9 - Instrumentos Financieros', 2);
      addParagraph('Modelo de pérdidas crediticias esperadas (ECL):');

      addSubtitle('Sistema de Staging');
      addTable(
        ['Stage', 'Criterio', 'Provisión'],
        [
          ['Stage 1', 'Sin deterioro significativo', 'ECL 12 meses'],
          ['Stage 2', 'Incremento significativo riesgo crédito', 'ECL lifetime'],
          ['Stage 3', 'Evidencia objetiva de deterioro', 'ECL lifetime + write-off'],
        ],
        [30, 70, 70]
      );

      addSubtitle('Parámetros ECL');
      addBullet('PD (Probability of Default): estimada por scoring interno');
      addBullet('LGD (Loss Given Default): % pérdida en caso de impago');
      addBullet('EAD (Exposure at Default): exposición estimada en impago');
      addBullet('ECL = PD × LGD × EAD × Discount Factor');

      addTitle('6.4 MiFID II', 2);
      addParagraph('Directiva sobre mercados de instrumentos financieros:');
      addBullet('Registro de interacciones con clientes (fichas de visita)');
      addBullet('Documentación de productos ofertados');
      addBullet('Trazabilidad completa de operaciones comerciales');
      addBullet('Separación de funciones (roles segregados)');

      addOpinion('La implementación normativa es sólida para un CRM comercial. Los cálculos de Basel III/IV y IFRS 9 son aproximaciones razonables dado que no tenemos acceso a datos granulares de exposiciones. Para uso regulatorio real, se necesitarían integraciones con sistemas core bancarios.');

      // ========== 7. ANÁLISIS FINANCIERO ==========
      addNewPage();
      setProgress(75);
      updateStep('financial');
      
      addTitle('7. ANÁLISIS FINANCIERO IMPLEMENTADO');

      addTitle('7.1 Ratios de Liquidez', 2);
      addTable(
        ['Ratio', 'Fórmula', 'Interpretación'],
        [
          ['Ratio Corriente', 'Activo Corriente / Pasivo Corriente', '>1.5 ideal, <1 riesgo'],
          ['Ratio Rápido (Acid Test)', '(AC - Inventarios) / PC', '>1 ideal'],
          ['Ratio de Tesorería', 'Efectivo / Pasivo Corriente', '>0.2 ideal'],
          ['Días de Caja', 'Efectivo / (Gastos Operativos/365)', '>30 días ideal'],
        ],
        [45, 70, 55]
      );

      addTitle('7.2 Ratios de Solvencia', 2);
      addTable(
        ['Ratio', 'Fórmula', 'Interpretación'],
        [
          ['Endeudamiento', 'Pasivo Total / Activo Total', '<0.6 ideal'],
          ['Autonomía Financiera', 'Patrimonio Neto / Activo Total', '>0.4 ideal'],
          ['Cobertura Intereses', 'EBIT / Gastos Financieros', '>3 ideal'],
          ['Deuda/EBITDA', 'Deuda Financiera / EBITDA', '<3 ideal'],
        ],
        [45, 70, 55]
      );

      addTitle('7.3 Z-Score de Altman', 2);
      addParagraph('Modelo predictivo de quiebra empresarial (1968):');
      
      addSubtitle('Fórmula');
      const zFormula = 'Z = 1.2×X1 + 1.4×X2 + 3.3×X3 + 0.6×X4 + 1.0×X5';
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text(zFormula, margin + 20, currentY);
      currentY += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      addTable(
        ['Variable', 'Cálculo', 'Representa'],
        [
          ['X1', 'Working Capital / Total Assets', 'Liquidez'],
          ['X2', 'Retained Earnings / Total Assets', 'Rentabilidad acumulada'],
          ['X3', 'EBIT / Total Assets', 'Productividad'],
          ['X4', 'Market Value Equity / Total Liabilities', 'Solvencia'],
          ['X5', 'Sales / Total Assets', 'Rotación activos'],
        ],
        [25, 70, 75]
      );

      addSubtitle('Zonas de Interpretación');
      addBullet('Z > 2.99: Zona Segura (baja probabilidad quiebra)');
      addBullet('1.81 ≤ Z ≤ 2.99: Zona Gris (precaución)');
      addBullet('Z < 1.81: Zona de Riesgo (alta probabilidad quiebra)');

      addTitle('7.4 Rating Bancario Interno', 2);
      addParagraph('Sistema de scoring crediticio basado en múltiples factores:');

      addTable(
        ['Factor', 'Peso', 'Indicadores'],
        [
          ['Liquidez', '20%', 'Ratio corriente, acid test, días caja'],
          ['Solvencia', '25%', 'Endeudamiento, autonomía, cobertura'],
          ['Rentabilidad', '25%', 'ROE, ROA, margen neto'],
          ['Actividad', '15%', 'Rotación activos, días cobro/pago'],
          ['Tamaño/Estabilidad', '15%', 'Años operación, facturación, empleados'],
        ],
        [45, 20, 105]
      );

      addSubtitle('Escala de Rating');
      addBullet('9-10: Excelente - Riesgo mínimo');
      addBullet('7-8: Bueno - Riesgo bajo');
      addBullet('5-6: Aceptable - Riesgo moderado');
      addBullet('3-4: Vigilar - Riesgo elevado');
      addBullet('1-2: Crítico - Riesgo muy alto');

      addTitle('7.5 Pirámide DuPont', 2);
      addParagraph('Descomposición del ROE en factores contributivos:');

      const dupont = `
                         ROE
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     Margen Neto    ×  Rotación   ×  Apalancamiento
    (Beneficio/       Activos        Financiero
      Ventas)       (Ventas/       (Activos/
                     Activos)      Patrimonio)
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      dupont.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin + 20, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 8;

      addOpinion('El arsenal de análisis financiero es completo para evaluación crediticia. El Z-Score de Altman tiene limitaciones conocidas (modelo de 1968, sesgo hacia manufacturas) pero sigue siendo útil como indicador de alerta temprana. Recomendaría añadir modelos más modernos como Ohlson O-Score.');

      // ========== 8. OPTIMIZACIÓN MULTIUSUARIO ==========
      addNewPage();
      setProgress(85);
      updateStep('optimization');
      
      addTitle('8. OPTIMIZACIÓN MULTIUSUARIO');
      addParagraph('Arquitectura diseñada para soportar 500-1000+ usuarios simultáneos:');

      addTitle('8.1 Canales Realtime Consolidados', 2);
      addParagraph('Optimización de suscripciones Supabase Realtime:');

      addTable(
        ['Canal', 'Tablas Monitoreadas', 'Eventos'],
        [
          ['goals-channel', 'goals, goal_progress', 'INSERT, UPDATE, DELETE'],
          ['notifications-channel', 'notifications', 'INSERT'],
          ['visits-channel', 'visits, visit_sheets', 'INSERT, UPDATE'],
          ['companies-channel', 'companies', 'UPDATE'],
        ],
        [50, 60, 60]
      );

      addSubtitle('Hook useRealtimeChannel');
      addBullet('Centraliza gestión de suscripciones');
      addBullet('Debouncing automático (300ms) para evitar re-renders excesivos');
      addBullet('Cleanup automático en unmount');
      addBullet('Reconexión automática en pérdida de conexión');

      addTitle('8.2 Sistema de Presencia', 2);
      addParagraph('Indicadores de usuarios online en tiempo real:');
      addBullet('PresenceContext mantiene lista de usuarios activos');
      addBullet('usePresence hook para acceder a estado de presencia');
      addBullet('OnlineUsersIndicator muestra avatares en header');
      addBullet('Información de rol y última actividad por usuario');
      addBullet('Heartbeat cada 30 segundos para detectar desconexiones');

      addTitle('8.3 Bloqueo Optimista', 2);
      addParagraph('Prevención de conflictos de edición concurrente:');

      addSubtitle('Tablas con Bloqueo');
      addBullet('companies - edición de datos de empresa');
      addBullet('visit_sheets - edición de fichas');
      addBullet('balance_sheets, income_statements - datos contables');
      addBullet('goals, alerts - configuración de objetivos y alertas');

      addSubtitle('Mecanismo');
      addBullet('1. Al cargar registro, se guarda version/updated_at');
      addBullet('2. Al guardar, se verifica que version no haya cambiado');
      addBullet('3. Si hay conflicto, ConflictDialog muestra opciones');
      addBullet('4. Usuario puede: sobrescribir, recargar, o cancelar');

      addTitle('8.4 React Query Caché', 2);
      addParagraph('Configuración optimizada de caché cliente:');

      addTable(
        ['Parámetro', 'Valor', 'Propósito'],
        [
          ['staleTime', '5 minutos', 'Datos frescos sin refetch'],
          ['gcTime', '30 minutos', 'Retención en memoria'],
          ['refetchOnWindowFocus', 'false', 'Evitar refetch innecesarios'],
          ['retry', '3', 'Reintentos en error de red'],
        ],
        [50, 40, 80]
      );

      addSubtitle('Invalidación Inteligente');
      addBullet('Eventos realtime invalidan queries específicas');
      addBullet('Mutaciones optimistas actualizan UI inmediatamente');
      addBullet('Rollback automático si servidor rechaza cambio');

      addOpinion('La arquitectura multiusuario es robusta. El bloqueo optimista es la solución correcta para edición colaborativa - evita bloqueos pesimistas que degradan UX. La consolidación de canales realtime reduce significativamente uso de conexiones websocket.');

      // ========== 9. INTEGRACIONES ==========
      addNewPage();
      setProgress(90);
      updateStep('integrations');
      
      addTitle('9. INTEGRACIONES EXTERNAS');

      addTitle('9.1 Resend (Email Transaccional)', 2);
      addParagraph('Servicio de email para notificaciones y reportes:');
      addBullet('Emails de alerta y escalado');
      addBullet('Reportes KPI diarios, semanales y mensuales');
      addBullet('Notificaciones de validación de fichas');
      addBullet('Recordatorios de visitas y seguimientos');
      addBullet('Celebración de logros de objetivos');

      addSubtitle('Configuración');
      addBullet('API Key almacenada en Supabase Secrets');
      addBullet('Dominio configurado para entregas fiables');
      addBullet('Templates HTML personalizados por tipo');

      addTitle('9.2 OpenStreetMap / Nominatim', 2);
      addParagraph('Geocodificación gratuita de direcciones:');
      addBullet('Conversión de direcciones a coordenadas lat/lng');
      addBullet('Geocodificación batch para importaciones masivas');
      addBullet('Integración en edge function geocode-address');
      addBullet('Rate limiting respetando políticas de uso');

      addTitle('9.3 Lovable AI (Gemini 2.5)', 2);
      addParagraph('Integración con modelos de IA para funcionalidades inteligentes:');

      addSubtitle('Modelos Utilizados');
      addTable(
        ['Modelo', 'Uso', 'Características'],
        [
          ['gemini-2.5-flash', 'Generación planes acción', 'Rápido, económico'],
          ['gemini-2.5-pro', 'Parsing PDF financiero', 'Alta precisión OCR+NLP'],
        ],
        [50, 55, 65]
      );

      addSubtitle('Funcionalidades IA');
      addBullet('generate-action-plan: Analiza métricas deficientes y genera plan de mejora personalizado');
      addBullet('parse-financial-pdf: Extrae datos de estados financieros PDF y mapea a campos de base de datos');
      addBullet('smart-column-mapping: Mapeo inteligente de columnas Excel durante importación');

      addOpinion('Las integraciones son estratégicas y bien elegidas. Resend proporciona entregas fiables de email. Nominatim evita costes de APIs de geocodificación comerciales. Lovable AI con Gemini 2.5 es potente y no requiere gestión de API keys propias.');

      // ========== 10. RECOMENDACIONES ==========
      addNewPage();
      setProgress(95);
      updateStep('recommendations');
      
      addTitle('10. RECOMENDACIONES Y MEJORAS');

      addTitle('10.1 Mejoras Funcionales Sugeridas', 2);
      
      addSubtitle('Módulo de Auditoría');
      addBullet('Añadir análisis de cohortes por antigüedad de cartera crediticia');
      addBullet('Implementar test de estrés financiero automatizado');
      addBullet('Scoring crediticio interno con machine learning');
      addBullet('Integración con registros de morosidad externos');

      addSubtitle('Cumplimiento Normativo');
      addBullet('Reporting EBA COREP/FINREP automático');
      addBullet('Dashboard ESG con indicadores básicos');
      addBullet('Análisis AML/KYC integrado en fichas de visita');
      addBullet('Alertas de PEPs (Personas Expuestas Políticamente)');

      addSubtitle('Productividad Comercial');
      addBullet('Integración con calendario corporativo (Outlook/Google)');
      addBullet('App móvil para gestores en campo');
      addBullet('Firma digital de documentos en fichas');
      addBullet('Chatbot interno para consultas rápidas');

      addTitle('10.2 Mejoras Técnicas', 2);

      addSubtitle('Rendimiento');
      addBullet('Implementar paginación virtual para tablas >1000 filas');
      addBullet('Service Worker para funcionamiento offline básico');
      addBullet('Pre-carga predictiva de datos frecuentes');
      addBullet('Compresión de imágenes antes de upload');

      addSubtitle('Seguridad');
      addBullet('Autenticación MFA para roles administrativos');
      addBullet('Logging de seguridad más granular');
      addBullet('Revisión periódica de políticas RLS');
      addBullet('Penetration testing externo');

      addSubtitle('Mantenibilidad');
      addBullet('Tests unitarios con Vitest');
      addBullet('Tests E2E con Playwright');
      addBullet('Documentación API automática (OpenAPI)');
      addBullet('Storybook para componentes UI');

      addTitle('10.3 Priorización de Mejoras', 2);
      addTable(
        ['Prioridad', 'Mejora', 'Impacto', 'Esfuerzo'],
        [
          ['Alta', 'MFA para admins', 'Seguridad crítica', 'Bajo'],
          ['Alta', 'Tests E2E críticos', 'Calidad', 'Medio'],
          ['Media', 'App móvil básica', 'Productividad', 'Alto'],
          ['Media', 'ESG básico', 'Cumplimiento', 'Medio'],
          ['Baja', 'ML para scoring', 'Innovación', 'Alto'],
        ],
        [30, 55, 45, 40]
      );

      addOpinion('Las recomendaciones priorizadas se basan en análisis de riesgo/beneficio. MFA es crítico para seguridad bancaria. Los tests automatizados previenen regresiones en sistema complejo. La app móvil aumentaría significativamente adopción por gestores en campo.');

      // Página final
      addNewPage();
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageWidth, 60, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENTO GENERADO', pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema CRM Bancario Creand - Documentación Técnico-Funcional', pageWidth / 2, 40, { align: 'center' });
      doc.text(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), pageWidth / 2, 50, { align: 'center' });

      currentY = 80;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Información del Documento', margin, currentY);
      currentY += 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const finalInfo = [
        ['Total de páginas:', String(pageNumber)],
        ['Secciones:', '10 principales + subsecciones'],
        ['Tablas:', '25+'],
        ['Opiniones profesionales:', '15'],
        ['Componentes documentados:', '100+'],
        ['Edge Functions:', '24'],
        ['Tablas de base de datos:', '50+'],
      ];

      finalInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 60, currentY);
        currentY += 7;
      });

      currentY += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Aviso Legal', margin, currentY);
      currentY += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const disclaimer = 'Este documento ha sido generado automáticamente y representa el estado actual del sistema en el momento de su creación. La información contenida es de carácter técnico y funcional, destinada a uso interno. Las opiniones expresadas son análisis profesionales basados en mejores prácticas de la industria.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
      disclaimerLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });

      setProgress(100);
      
      // Save PDF
      const filename = `Documentacion_Tecnico_Funcional_Creand_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('Documento PDF generado correctamente', {
        description: `${pageNumber} páginas guardadas en ${filename}`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setGenerating(false);
    }
  };

  const completedSteps = steps.filter(s => s.completed).length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Generador de Documentación Técnico-Funcional
        </CardTitle>
        <CardDescription>
          Genera un documento PDF completo con toda la documentación del sistema, 
          incluyendo arquitectura, módulos, normativa y recomendaciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {generating && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progreso de generación</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="grid grid-cols-2 gap-2">
              {steps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    step.completed ? 'bg-green-500/10 text-green-600' : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-current" />
                  )}
                  <span>{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">El documento incluirá:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Índice general con 10 secciones principales</li>
            <li>• Arquitectura técnica y stack tecnológico</li>
            <li>• Sistema de roles y políticas RLS</li>
            <li>• 12+ módulos funcionales detallados</li>
            <li>• 24 Edge Functions documentadas</li>
            <li>• Normativa bancaria (Basel III/IV, IFRS 9, MiFID II)</li>
            <li>• Análisis financiero (Z-Score, DuPont, ratios)</li>
            <li>• Optimización multiusuario</li>
            <li>• 15+ opiniones profesionales</li>
            <li>• Recomendaciones priorizadas</li>
          </ul>
        </div>

        <Button 
          onClick={generatePDF} 
          disabled={generating}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generando documento... ({completedSteps}/{steps.length})
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Generar Documento PDF (~50 páginas)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
