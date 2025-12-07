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
    { id: 'map', name: 'Mapa Geográfico Detallado', completed: false },
    { id: 'edge', name: 'Edge Functions', completed: false },
    { id: 'security', name: 'Seguridad y Riesgos', completed: false },
    { id: 'andorra', name: 'Normativa Andorrana', completed: false },
    { id: 'intranet', name: 'Implementación Intranet', completed: false },
    { id: 'compliance', name: 'Normativa Bancaria', completed: false },
    { id: 'financial', name: 'Análisis Financiero', completed: false },
    { id: 'optimization', name: 'Optimización Multiusuario', completed: false },
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

      const addWarning = (text: string) => {
        checkPageBreak(20);
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(245, 158, 11);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        const boxHeight = (lines.length * 5) + 10;
        doc.roundedRect(margin, currentY - 3, contentWidth, boxHeight, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bolditalic');
        doc.setTextColor(180, 83, 9);
        doc.text('⚠️ ADVERTENCIA DE SEGURIDAD:', margin + 5, currentY + 3);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 53, 15);
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, currentY + 9 + (i * 5));
        });
        currentY += boxHeight + 5;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      };

      const addCritical = (text: string) => {
        checkPageBreak(20);
        doc.setFillColor(254, 226, 226);
        doc.setDrawColor(239, 68, 68);
        const lines = doc.splitTextToSize(text, contentWidth - 10);
        const boxHeight = (lines.length * 5) + 10;
        doc.roundedRect(margin, currentY - 3, contentWidth, boxHeight, 2, 2, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bolditalic');
        doc.setTextColor(185, 28, 28);
        doc.text('🔴 RIESGO CRÍTICO:', margin + 5, currentY + 3);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(127, 29, 29);
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

      const addNumberedList = (items: string[]) => {
        items.forEach((item, index) => {
          checkPageBreak(6);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}.`, margin, currentY);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(item, contentWidth - 10);
          lines.forEach((line: string, i: number) => {
            doc.text(line, margin + 8, currentY + (i * 5));
          });
          currentY += lines.length * 5 + 2;
        });
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
      setProgress(3);
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
        ['Versión:', '2.0.0 - Incluye Análisis de Seguridad'],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })],
        ['Plataforma:', 'Lovable + Supabase (Lovable Cloud)'],
        ['Framework:', 'React 18.3 + TypeScript + Vite'],
        ['Base de Datos:', 'PostgreSQL (Supabase)'],
        ['Autor:', 'Sistema Automático de Documentación'],
        ['Clasificación:', 'CONFIDENCIAL - USO INTERNO BANCARIO'],
      ];
      
      metadata.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(value, margin + 50, currentY);
        currentY += 7;
      });

      currentY += 15;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Nuevos Contenidos en Esta Versión', margin, currentY);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      addBullet('Análisis exhaustivo de seguridad y riesgos de datos', 0);
      addBullet('Normativa Andorrana: Llei 29/2021 APDA y requisitos AFA', 0);
      addBullet('Guía de implementación en servidor interno (intranet)', 0);
      addBullet('Funcionalidades detalladas del mapa geográfico', 0);
      addBullet('Grado de autonomía sin conexión a internet', 0);
      addBullet('Parámetros de seguridad recomendados para IT bancario', 0);

      addPageNumber();

      // ========== ÍNDICE ==========
      addNewPage();
      setProgress(6);
      updateStep('index');
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text('ÍNDICE GENERAL', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;
      doc.setTextColor(0, 0, 0);

      const indexItems = [
        { num: '1', title: 'RESUMEN EJECUTIVO', page: 4 },
        { num: '2', title: 'ARQUITECTURA TÉCNICA', page: 5 },
        { num: '3', title: 'SISTEMA DE ROLES Y PERMISOS', page: 8 },
        { num: '4', title: 'MÓDULOS FUNCIONALES', page: 11 },
        { num: '5', title: 'MAPA GEOGRÁFICO - FUNCIONALIDADES DETALLADAS', page: 18 },
        { num: '6', title: 'EDGE FUNCTIONS (BACKEND)', page: 22 },
        { num: '7', title: 'ANÁLISIS DE SEGURIDAD Y RIESGOS', page: 25 },
        { num: '7.1', title: 'Riesgos Identificados', page: 25, indent: true },
        { num: '7.2', title: 'Datos que Salen de la Entidad', page: 27, indent: true },
        { num: '7.3', title: 'Mitigaciones Recomendadas', page: 28, indent: true },
        { num: '8', title: 'NORMATIVA ANDORRANA', page: 30 },
        { num: '8.1', title: 'Llei 29/2021 Protección de Datos (APDA)', page: 30, indent: true },
        { num: '8.2', title: 'Llei 12/2024 Modificación APDA', page: 31, indent: true },
        { num: '8.3', title: 'Requisitos AFA para Entidades Bancarias', page: 32, indent: true },
        { num: '9', title: 'IMPLEMENTACIÓN EN INTRANET BANCARIA', page: 34 },
        { num: '9.1', title: 'Requisitos de Infraestructura', page: 34, indent: true },
        { num: '9.2', title: 'Pasos de Instalación Detallados', page: 35, indent: true },
        { num: '9.3', title: 'Grado de Autonomía sin Internet', page: 38, indent: true },
        { num: '10', title: 'NORMATIVA BANCARIA INTERNACIONAL', page: 40 },
        { num: '11', title: 'ANÁLISIS FINANCIERO IMPLEMENTADO', page: 43 },
        { num: '12', title: 'OPTIMIZACIÓN MULTIUSUARIO', page: 46 },
        { num: '13', title: 'RECOMENDACIONES Y PARAMETRIZACIÓN SEGURIDAD', page: 48 },
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
      setProgress(10);
      updateStep('executive');
      
      addTitle('1. RESUMEN EJECUTIVO');
      
      addParagraph('El Sistema CRM Bancario Creand es una plataforma integral de gestión comercial desarrollada específicamente para Creand, entidad bancaria del Principado de Andorra. Esta solución tecnológica abarca todos los aspectos de la gestión de relaciones con clientes empresariales, desde la captación hasta el seguimiento contable y el cumplimiento normativo.');
      
      addSubtitle('Objetivos Principales del Sistema');
      addBullet('Centralizar la gestión de la cartera comercial de empresas con capacidad para más de 20,000 registros');
      addBullet('Proporcionar herramientas de análisis financiero según el Plan General Contable de Andorra');
      addBullet('Garantizar el cumplimiento normativo bancario andorrano (APDA, AFA) y europeo');
      addBullet('Optimizar la productividad de gestores comerciales mediante automatización y IA');
      addBullet('Ofrecer visibilidad ejecutiva mediante dashboards especializados por rol');
      
      addOpinion('Este sistema representa una solución enterprise de alta complejidad. La arquitectura elegida (React + Supabase) proporciona escalabilidad sin costes de infraestructura tradicional. El cumplimiento normativo integrado reduce significativamente el riesgo operacional.');

      // ========== 2. ARQUITECTURA TÉCNICA ==========
      addNewPage();
      setProgress(15);
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
        ],
        [40, 45, 25, 60]
      );

      addTitle('2.2 Base de Datos', 2);
      addParagraph('El esquema de base de datos comprende más de 50 tablas organizadas en dominios funcionales:');

      addTable(
        ['Dominio', 'Tablas', 'Registros Est.'],
        [
          ['Empresas', 'companies, company_contacts, company_documents, company_photos', '20,000+'],
          ['Visitas', 'visits, visit_sheets, visit_participants, visit_reminders', '100,000+'],
          ['Productos', 'products, company_products, company_tpv_terminals', '50,000+'],
          ['Contabilidad', 'balance_sheets, income_statements, cash_flow_statements', '25,000+'],
          ['Objetivos', 'goals, goal_progress, action_plans', '10,000+'],
          ['Usuarios', 'profiles, user_roles, audit_logs', '1,000+'],
        ],
        [35, 95, 30]
      );

      // ========== 3. SISTEMA DE ROLES ==========
      addNewPage();
      setProgress(20);
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

      addTitle('3.2 Políticas RLS (Row Level Security)', 2);
      addParagraph('Cada tabla implementa políticas de seguridad a nivel de fila:');
      addBullet('Gestores solo ven empresas asignadas (gestor_id = auth.uid())');
      addBullet('Directores de oficina ven solo su oficina');
      addBullet('Roles admin ven todos los datos');
      addBullet('Auditors tienen acceso de solo lectura');

      addOpinion('La implementación de RBAC es ejemplar. La triple capa (UI, lógica, datos) proporciona defensa en profundidad. Las políticas RLS son especialmente importantes para prevenir acceso no autorizado incluso si hay vulnerabilidades en el frontend.');

      // ========== 4. MÓDULOS FUNCIONALES ==========
      addNewPage();
      setProgress(25);
      updateStep('modules');
      
      addTitle('4. MÓDULOS FUNCIONALES');
      
      addTitle('4.1 Dashboard de Gestores', 2);
      addParagraph('Dashboard personal con navegación 3D mediante tarjetas interactivas:');
      addBullet('Estadísticas personales: visitas, tasa de éxito, empresas asignadas');
      addBullet('Gráficos de evolución mensual con comparativa de períodos');
      addBullet('Sistema de objetivos personales con tracking en tiempo real');
      addBullet('Planes de acción generados automáticamente por IA');
      addBullet('Benchmarking contra promedios de oficina y equipo');

      addTitle('4.2 Dashboard Director de Negoci', 2);
      addParagraph('Dashboard ejecutivo para visión global del negocio:');
      addBullet('KPIs ejecutivos con indicadores de tendencia');
      addBullet('Ranking de gestores por múltiples métricas');
      addBullet('Explorador de métricas con drill-down');

      addTitle('4.3 Módulo de Contabilidad PGC Andorra', 2);
      addParagraph('Sistema completo de análisis financiero:');
      addBullet('Tres modelos contables: Normal, Abreujat, Simplificat');
      addBullet('Balance de Situación con >40 partidas');
      addBullet('Cuenta de Pérdidas y Ganancias completa');
      addBullet('Estado de Flujos de Efectivo');
      addBullet('Consolidación de hasta 15 empresas');
      addBullet('Parsing automático de PDF con IA');

      // ========== 5. MAPA GEOGRÁFICO DETALLADO ==========
      addNewPage();
      setProgress(30);
      updateStep('map');
      
      addTitle('5. MAPA GEOGRÁFICO - FUNCIONALIDADES DETALLADAS');
      
      addParagraph('El sistema de mapas es una de las funcionalidades más completas de la plataforma, implementado en MapContainer.tsx con más de 1,598 líneas de código.');

      addTitle('5.1 Motor de Renderizado', 2);
      addTable(
        ['Componente', 'Tecnología', 'Función'],
        [
          ['Motor', 'MapLibre GL JS 5.13.0', 'Renderizado vectorial WebGL'],
          ['Clustering', 'Supercluster 8.0.1', 'Agrupación dinámica de marcadores'],
          ['Geocoding', 'OpenStreetMap Nominatim', 'Conversión dirección a coordenadas'],
          ['Estilos', 'OSM Standard + Satélite', 'Capas visuales intercambiables'],
        ],
        [40, 60, 70]
      );

      addTitle('5.2 Modos de Visualización por Color', 2);
      addParagraph('Los marcadores pueden colorearse según diferentes criterios analíticos:');
      
      addTable(
        ['Modo', 'Criterio de Color', 'Uso Principal', 'Escala'],
        [
          ['Estado', 'Status de empresa', 'Vista general cartera', 'Colores configurables'],
          ['Vinculación', '% afiliación Creand', 'Penetración bancaria', 'Verde alto, rojo bajo'],
          ['Facturación', 'Rango facturación anual', 'Segmentación tamaño', 'Azul escalado'],
          ['P&L Banco', 'Rentabilidad Creand', 'Valor cliente', 'Verde/rojo'],
          ['Visitas', 'Frecuencia visitas', 'Cobertura comercial', 'Intensidad color'],
        ],
        [35, 45, 50, 40]
      );

      addTitle('5.3 Funcionalidades Interactivas', 2);
      
      addSubtitle('Tooltips Configurables');
      addBullet('Información de empresa al pasar sobre marcador');
      addBullet('Click en "Ver fotos" abre galería de imágenes');
      addBullet('Datos financieros resumidos visibles');
      addBullet('Indicador de vinculación con colores por banco');

      addSubtitle('Selección de Empresa');
      addBullet('Click en marcador abre panel lateral de detalle');
      addBullet('Información completa: contactos, productos, documentos');
      addBullet('Historial de visitas y fichas');
      addBullet('Acceso a módulo contable de la empresa');

      addSubtitle('Reubicación de Marcadores');
      addBullet('Long-press (3 segundos) activa modo edición');
      addBullet('Marcador muestra outline visual de activación');
      addBullet('Drag and drop a nueva posición');
      addBullet('Guardado automático en base de datos');
      addBullet('Botón "Deshacer" visible 15 segundos');
      addBullet('Útil para corregir geocodificación imprecisa');

      addNewPage();
      addTitle('5.4 Clustering y Rendimiento', 2);
      addParagraph('El sistema utiliza Supercluster para gestionar miles de marcadores eficientemente:');
      addBullet('Agrupación automática de marcadores cercanos');
      addBullet('Número de empresas mostrado en cluster');
      addBullet('Click en cluster hace zoom para ver empresas');
      addBullet('Transiciones animadas suaves');
      addBullet('Rendimiento optimizado para >20,000 empresas');

      addTitle('5.5 Vista 3D', 2);
      addBullet('Edificios extruidos con control de pitch/inclinación');
      addBullet('Rotación del mapa mediante gestos');
      addBullet('Sombras y profundidad visual');
      addBullet('Control de bearing (orientación)');

      addTitle('5.6 Sidebar y Filtros', 2);
      addSubtitle('Filtros Disponibles');
      addBullet('Por parroquia (jurisdicción territorial)');
      addBullet('Por CNAE (sector de actividad)');
      addBullet('Por gestor asignado');
      addBullet('Por status de empresa');
      addBullet('Por productos contratados');
      addBullet('Por rango de facturación');
      addBullet('Por porcentaje de vinculación');
      addBullet('Por fecha de última visita');

      addSubtitle('Modo Fullscreen Sidebar');
      addBullet('Toggle para expandir sidebar a 100% pantalla');
      addBullet('Oculta mapa completamente');
      addBullet('Ideal para análisis detallado de datos');
      addBullet('Navegación completa sin distracciones');

      addTitle('5.7 Búsqueda Geográfica', 2);
      addBullet('Barra de búsqueda por nombre de empresa');
      addBullet('Búsqueda por dirección con geocoding');
      addBullet('Resultados destacados en mapa');
      addBullet('Zoom automático a resultado');

      addOpinion('La implementación cartográfica es de nivel profesional. El clustering evita sobrecarga visual con miles de empresas, y la reubicación con undo es crucial para correcciones de geocodificación. Los múltiples modos de color permiten análisis visual rápido de la cartera.');

      // ========== 6. EDGE FUNCTIONS ==========
      addNewPage();
      setProgress(35);
      updateStep('edge');
      
      addTitle('6. EDGE FUNCTIONS (BACKEND)');
      addParagraph('El sistema implementa 24 funciones serverless en Deno para lógica de backend:');

      addTable(
        ['Función', 'Propósito', 'Trigger'],
        [
          ['check-alerts', 'Verificar condiciones de alertas', 'Cron 1h'],
          ['check-goal-achievements', 'Detectar objetivos completados', 'Cron 8:00'],
          ['escalate-alerts', 'Escalar alertas no resueltas', 'Cron 4h'],
          ['generate-action-plan', 'Generar plan IA', 'Manual/API'],
          ['geocode-address', 'Geocodificar direcciones', 'API'],
          ['manage-user', 'Gestión usuarios admin', 'API'],
          ['parse-financial-pdf', 'Parsing PDF con IA', 'API'],
          ['send-alert-email', 'Enviar alertas email', 'Event'],
          ['send-weekly-kpi-report', 'Reporte semanal KPI', 'Cron lunes'],
          ['system-health', 'Monitoreo salud sistema', 'Cron/API'],
        ],
        [55, 70, 45]
      );

      // ========== 7. SEGURIDAD Y RIESGOS ==========
      addNewPage();
      setProgress(42);
      updateStep('security');
      
      addTitle('7. ANÁLISIS DE SEGURIDAD Y RIESGOS');
      
      addCritical('Este análisis identifica riesgos de seguridad críticos que deben abordarse antes de desplegar en producción bancaria. El sistema actual está diseñado para desarrollo y requiere hardening adicional.');

      addTitle('7.1 Riesgos Identificados', 2);

      addSubtitle('RIESGO CRÍTICO: Datos de Perfiles Expuestos');
      addParagraph('La tabla "profiles" es legible públicamente para usuarios autenticados y contiene:');
      addBullet('Emails de empleados bancarios', 5);
      addBullet('Nombres completos', 5);
      addBullet('URLs de avatares', 5);
      addBullet('Ubicaciones de oficina', 5);
      addParagraph('Impacto: Atacantes podrían usar esta información para phishing dirigido o suplantación de identidad de empleados.');
      
      addSubtitle('RIESGO ALTO: Datos Empresariales Accesibles');
      addParagraph('La tabla "companies" contiene información sensible accesible a todos los usuarios autenticados:');
      addBullet('Teléfonos y emails de clientes empresariales', 5);
      addBullet('Datos financieros: facturación, beneficios', 5);
      addBullet('NIFs/NRTs e identificadores fiscales', 5);
      addBullet('Relaciones bancarias con competidores', 5);
      addParagraph('Impacto: Competidores con acceso (ej. exempleado) podrían robar cartera de clientes.');

      addSubtitle('RIESGO MEDIO: Estados Financieros');
      addParagraph('Las tablas de contabilidad (balance_sheets, income_statements) contienen datos financieros detallados de clientes. Aunque protegidas por RLS, un gestor con cuenta comprometida tendría acceso a todos los datos de sus empresas asignadas.');

      addSubtitle('RIESGO MEDIO: Logs de Auditoría');
      addParagraph('Los usuarios pueden ver sus propios registros de auditoría, lo que podría ayudar a atacantes a entender qué acciones son monitoreadas y cómo evitar detección.');

      addNewPage();
      addTitle('7.2 Datos que Salen de la Entidad Bancaria', 2);
      
      addWarning('Los siguientes datos viajan a servidores externos (Supabase Cloud, Resend, OpenStreetMap). Evaluar si es aceptable según políticas internas de Creand.');

      addTable(
        ['Servicio Externo', 'Datos Enviados', 'Ubicación Servidores', 'Riesgo'],
        [
          ['Supabase Cloud', 'TODOS los datos del CRM', 'AWS (variable)', 'ALTO'],
          ['Resend (email)', 'Emails empleados, nombres, contenido alertas', 'USA', 'MEDIO'],
          ['OpenStreetMap', 'Direcciones de empresas', 'Voluntarios globales', 'BAJO'],
          ['Lovable AI (Gemini)', 'PDFs financieros, métricas gestores', 'Google Cloud', 'ALTO'],
        ],
        [40, 55, 45, 30]
      );

      addSubtitle('Datos Específicos Expuestos a Terceros');
      addBullet('Supabase: Base de datos completa, incluyendo datos financieros de clientes');
      addBullet('Resend: Nombres de empleados, eventos de sistema, métricas de rendimiento');
      addBullet('Lovable AI: Contenido de PDFs financieros durante parsing, datos de métricas');
      addBullet('OpenStreetMap: Direcciones completas de clientes para geocodificación');

      addTitle('7.3 Mitigaciones Recomendadas', 2);
      
      addSubtitle('Inmediatas (Antes de Producción)');
      addNumberedList([
        'Restringir políticas RLS de profiles para que usuarios solo vean su propio perfil',
        'Implementar políticas RLS en companies para que gestores solo vean sus empresas asignadas',
        'Eliminar política que permite a usuarios ver sus propios audit_logs',
        'Activar "Leaked Password Protection" en Supabase Auth',
        'Mover extensiones de schema "public" a schema dedicado',
        'Implementar MFA obligatorio para roles administrativos',
      ]);

      addSubtitle('A Medio Plazo');
      addNumberedList([
        'Implementar cifrado a nivel de campo para datos financieros sensibles',
        'Añadir re-autenticación para operaciones críticas (cambios contables)',
        'Configurar alertas de seguridad para accesos anómalos',
        'Implementar logging de seguridad más granular',
        'Realizar penetration testing externo',
      ]);

      addSubtitle('Para Máxima Seguridad (Intranet)');
      addParagraph('Si los requisitos de seguridad bancarios no permiten datos en cloud externo, se recomienda migrar a Supabase self-hosted en infraestructura interna (ver sección 9).');

      // ========== 8. NORMATIVA ANDORRANA ==========
      addNewPage();
      setProgress(50);
      updateStep('andorra');
      
      addTitle('8. NORMATIVA ANDORRANA APLICABLE');
      
      addTitle('8.1 Llei 29/2021 - Protección de Datos Personales (APDA)', 2);
      addParagraph('La Llei 29/2021, del 28 de octubre, cualificada de protección de datos personales, adapta el ordenamiento jurídico andorrano al RGPD europeo. Esta ley es administrada por la APDA (Agència de Protecció de Dades d\'Andorra).');

      addSubtitle('Requisitos Clave para el CRM');
      addBullet('Base legal para tratamiento: El sistema debe documentar la base legal para cada tipo de tratamiento de datos (contrato, interés legítimo, etc.)');
      addBullet('Derechos ARSOPOL: Implementar mecanismos para ejercicio de derechos de Acceso, Rectificación, Supresión, Oposición, Portabilidad, Olvido, Limitación');
      addBullet('Registro de actividades de tratamiento: Mantener registro actualizado de todos los tratamientos');
      addBullet('Evaluación de impacto (EIPD): Obligatoria para tratamientos de alto riesgo como datos financieros bancarios');
      addBullet('Notificación de brechas: Obligación de notificar brechas de seguridad a APDA en 72 horas');
      addBullet('Delegado de Protección de Datos (DPD): Obligatorio para entidades bancarias');

      addSubtitle('Cumplimiento del Sistema');
      addTable(
        ['Requisito APDA', 'Estado Actual', 'Acción Requerida'],
        [
          ['Registro tratamientos', 'PARCIAL', 'Documentar en módulo auditoría'],
          ['Derechos ARSOPOL', 'NO IMPLEMENTADO', 'Añadir módulo de solicitudes'],
          ['Base legal documentada', 'NO', 'Revisar políticas de privacidad'],
          ['EIPD', 'NO REALIZADA', 'Contratar evaluación externa'],
          ['Notificación brechas', 'PARCIAL', 'Procedimiento formal + alertas'],
          ['DPD designado', 'DEPENDE BANCO', 'Verificar designación Creand'],
        ],
        [50, 40, 80]
      );

      addTitle('8.2 Llei 12/2024 - Modificación APDA', 2);
      addParagraph('La Llei 12/2024, del 15 de julio, introduce modificaciones a la ley de protección de datos, reforzando requisitos de seguridad y adaptándose a nuevas tecnologías.');

      addSubtitle('Nuevos Requisitos Relevantes');
      addBullet('Tratamiento de datos por IA: Requisitos específicos para sistemas que utilizan inteligencia artificial');
      addBullet('Transferencias internacionales reforzadas: Mayor control sobre envío de datos fuera de Andorra');
      addBullet('Sanciones actualizadas: Incremento en multas por incumplimiento');

      addWarning('El uso de Lovable AI (Gemini) para parsing de PDFs financieros constituye tratamiento de datos con IA y requiere evaluación específica según Llei 12/2024.');

      addNewPage();
      addTitle('8.3 Requisitos AFA para Entidades Bancarias', 2);
      addParagraph('La AFA (Autoritat Financera Andorrana) establece requisitos específicos para sistemas informáticos de entidades bancarias:');

      addSubtitle('Comunicat Tècnic 283/18 - Seguretat Informàtica');
      addBullet('Política de seguridad de la información documentada');
      addBullet('Clasificación de activos de información');
      addBullet('Control de acceso basado en principio de mínimo privilegio');
      addBullet('Registro y monitorización de accesos');
      addBullet('Gestión de incidentes de seguridad');
      addBullet('Plan de continuidad de negocio');
      addBullet('Pruebas de seguridad periódicas');

      addSubtitle('Cumplimiento del Sistema');
      addTable(
        ['Requisito AFA', 'Implementación CRM', 'Nivel'],
        [
          ['Control acceso', 'RBAC + RLS', 'ALTO'],
          ['Registro accesos', 'audit_logs', 'MEDIO'],
          ['Mínimo privilegio', 'Roles granulares', 'ALTO'],
          ['Monitorización', 'system-health edge function', 'MEDIO'],
          ['Gestión incidentes', 'Alertas + escalado', 'MEDIO'],
          ['Continuidad negocio', 'Depende infraestructura', 'PENDIENTE'],
        ],
        [50, 70, 50]
      );

      addOpinion('El cumplimiento normativo andorrano requiere trabajo adicional. Se recomienda contratar auditoría especializada en normativa APDA/AFA para validar implementación antes de producción.');

      // ========== 9. IMPLEMENTACIÓN INTRANET ==========
      addNewPage();
      setProgress(58);
      updateStep('intranet');
      
      addTitle('9. IMPLEMENTACIÓN EN INTRANET BANCARIA');
      
      addParagraph('Para máxima seguridad y cumplimiento normativo, el sistema puede desplegarse completamente en infraestructura interna del banco, eliminando dependencias de servicios cloud externos.');

      addTitle('9.1 Requisitos de Infraestructura', 2);
      
      addSubtitle('Hardware Mínimo Recomendado');
      addTable(
        ['Componente', 'Especificación Mínima', 'Recomendado'],
        [
          ['Servidor Aplicación', '4 vCPU, 8GB RAM', '8 vCPU, 16GB RAM'],
          ['Servidor Base Datos', '4 vCPU, 16GB RAM, SSD', '8 vCPU, 32GB RAM, NVMe'],
          ['Almacenamiento', '100GB SSD', '500GB NVMe + backups'],
          ['Red', '1 Gbps interno', '10 Gbps + segregación'],
        ],
        [50, 60, 60]
      );

      addSubtitle('Software Requerido');
      addTable(
        ['Componente', 'Tecnología', 'Versión Mínima'],
        [
          ['Sistema Operativo', 'Ubuntu Server LTS / RHEL', '22.04 / 8.x'],
          ['Contenedores', 'Docker + Docker Compose', '24.x + 2.x'],
          ['Base de Datos', 'PostgreSQL', '15.x'],
          ['Proxy Reverso', 'Nginx / Traefik', '1.24+ / 2.x'],
          ['Runtime Edge', 'Deno', '1.40+'],
          ['Servidor Email', 'Postfix / SMTP interno', '-'],
        ],
        [50, 60, 60]
      );

      addNewPage();
      addTitle('9.2 Pasos de Instalación Detallados', 2);
      
      addSubtitle('Paso 1: Preparación del Entorno');
      const step1 = `
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Crear directorio del proyecto
sudo mkdir -p /opt/creand-crm
cd /opt/creand-crm
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      step1.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin + 5, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 5;

      addSubtitle('Paso 2: Clonar Supabase Self-Hosted');
      const step2 = `
# Clonar repositorio Supabase
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copiar configuración ejemplo
cp .env.example .env

# Editar configuración
nano .env
# Configurar: POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY
# SITE_URL=https://crm.creand.internal
# SMTP_HOST=smtp.creand.internal
# SMTP_PORT=587
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      step2.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin + 5, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 5;

      addSubtitle('Paso 3: Configurar Base de Datos');
      addBullet('Aplicar migraciones desde carpeta supabase/migrations/');
      addBullet('Crear funciones de base de datos (triggers, RLS)');
      addBullet('Configurar usuarios iniciales');
      addBullet('Importar datos existentes si es necesario');

      addSubtitle('Paso 4: Desplegar Frontend');
      const step4 = `
# Clonar código frontend
git clone [repositorio-crm] /opt/creand-crm/frontend
cd /opt/creand-crm/frontend

# Configurar variables de entorno
echo "VITE_SUPABASE_URL=https://api.crm.creand.internal" > .env
echo "VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]" >> .env

# Build de producción
npm install
npm run build

# Servir con Nginx
sudo cp -r dist/* /var/www/crm.creand.internal/
      `.trim();

      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      step4.split('\n').forEach(line => {
        checkPageBreak(4);
        doc.text(line, margin + 5, currentY);
        currentY += 4;
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += 5;

      addNewPage();
      addSubtitle('Paso 5: Configurar Edge Functions');
      addBullet('Instalar Deno runtime en servidor');
      addBullet('Copiar carpeta supabase/functions/');
      addBullet('Configurar secrets localmente (sin Supabase Vault cloud)');
      addBullet('Desplegar con supabase functions deploy --local');

      addSubtitle('Paso 6: Configurar SSL/TLS');
      addBullet('Generar certificados internos o usar CA corporativo');
      addBullet('Configurar Nginx con SSL');
      addBullet('Forzar HTTPS en toda la aplicación');

      addSubtitle('Paso 7: Configurar Email Interno');
      addBullet('Modificar edge functions para usar SMTP interno');
      addBullet('Eliminar dependencia de Resend');
      addBullet('Configurar plantillas de email');

      addSubtitle('Paso 8: Alternativa a OpenStreetMap');
      addBullet('Opción A: Instalar servidor Nominatim local con datos de Andorra');
      addBullet('Opción B: Usar API de geocodificación interna si existe');
      addBullet('Opción C: Importar coordenadas manualmente/Excel');

      addTitle('9.3 Grado de Autonomía sin Internet', 2);
      
      addTable(
        ['Funcionalidad', 'Sin Internet', 'Requiere Internet', 'Alternativa Local'],
        [
          ['Login/Auth', '✅ Local', '-', 'Supabase self-hosted'],
          ['CRUD Empresas', '✅ Local', '-', 'PostgreSQL local'],
          ['Mapa visualización', '⚠️ Parcial', 'Tiles mapa base', 'Servir tiles localmente'],
          ['Geocodificación', '❌', 'Nominatim API', 'Nominatim local'],
          ['Envío emails', '❌', 'SMTP externo', 'SMTP interno'],
          ['IA parsing PDF', '❌', 'Lovable AI', 'Sin IA o LLM local'],
          ['Generación planes IA', '❌', 'Lovable AI', 'Sin IA o LLM local'],
        ],
        [45, 35, 45, 45]
      );

      addSubtitle('Configuración 100% Offline');
      addParagraph('Para operación completamente sin internet:');
      addBullet('Instalar servidor de tiles de mapa local (ej. TileServer GL con datos OSM Andorra)');
      addBullet('Instalar Nominatim local con datos OSM de Andorra (~500MB)');
      addBullet('Eliminar funciones de IA o instalar LLM local (ej. Ollama con Llama 3)');
      addBullet('Usar SMTP interno del banco para emails');
      addBullet('Resultado: Sistema 100% autónomo sin dependencias externas');

      addOpinion('Para máxima seguridad bancaria, recomiendo instalación self-hosted completa. El esfuerzo inicial de configuración (estimado 2-3 semanas) se compensa con control total de datos y cumplimiento normativo simplificado.');

      // ========== 10. NORMATIVA BANCARIA INTERNACIONAL ==========
      addNewPage();
      setProgress(65);
      updateStep('compliance');
      
      addTitle('10. NORMATIVA BANCARIA INTERNACIONAL');
      addParagraph('El sistema implementa verificaciones de cumplimiento para múltiples marcos regulatorios:');

      addTitle('10.1 Basel III/IV', 2);
      addParagraph('Implementación de ratios de liquidez:');
      addBullet('LCR (Liquidity Coverage Ratio): ≥ 100%');
      addBullet('NSFR (Net Stable Funding Ratio): ≥ 100%');
      addBullet('Tier 1 Capital Ratio: ≥ 6%');

      addTitle('10.2 IFRS 9 - Instrumentos Financieros', 2);
      addTable(
        ['Stage', 'Criterio', 'Provisión'],
        [
          ['Stage 1', 'Sin deterioro significativo', 'ECL 12 meses'],
          ['Stage 2', 'Incremento significativo riesgo', 'ECL lifetime'],
          ['Stage 3', 'Evidencia objetiva deterioro', 'ECL lifetime + write-off'],
        ],
        [30, 70, 70]
      );

      addTitle('10.3 MiFID II', 2);
      addBullet('Registro de interacciones con clientes (fichas de visita)');
      addBullet('Documentación de productos ofertados');
      addBullet('Trazabilidad completa de operaciones comerciales');

      addTitle('10.4 DORA - Resiliencia Operativa Digital', 2);
      addParagraph('El Reglamento (UE) 2022/2554 establece requisitos de ciberseguridad para entidades financieras:');
      addBullet('Gestión de riesgos TIC');
      addBullet('Notificación de incidentes graves');
      addBullet('Pruebas de resiliencia operativa digital');
      addBullet('Gestión de riesgos de terceros TIC');

      // ========== 11. ANÁLISIS FINANCIERO ==========
      addNewPage();
      setProgress(72);
      updateStep('financial');
      
      addTitle('11. ANÁLISIS FINANCIERO IMPLEMENTADO');

      addTitle('11.1 Z-Score de Altman', 2);
      addParagraph('Modelo predictivo de quiebra empresarial:');
      addBullet('Z > 2.99: Zona Segura');
      addBullet('1.81 ≤ Z ≤ 2.99: Zona Gris');
      addBullet('Z < 1.81: Zona de Riesgo');

      addTitle('11.2 Rating Bancario Interno', 2);
      addTable(
        ['Factor', 'Peso', 'Indicadores'],
        [
          ['Liquidez', '20%', 'Ratio corriente, acid test'],
          ['Solvencia', '25%', 'Endeudamiento, autonomía'],
          ['Rentabilidad', '25%', 'ROE, ROA, margen neto'],
          ['Actividad', '15%', 'Rotación activos'],
          ['Tamaño', '15%', 'Facturación, empleados'],
        ],
        [45, 20, 105]
      );

      addTitle('11.3 Pirámide DuPont', 2);
      addParagraph('Descomposición del ROE: Margen Neto × Rotación Activos × Apalancamiento');

      // ========== 12. OPTIMIZACIÓN MULTIUSUARIO ==========
      addNewPage();
      setProgress(80);
      updateStep('optimization');
      
      addTitle('12. OPTIMIZACIÓN MULTIUSUARIO');
      addParagraph('Arquitectura diseñada para soportar 500-1000+ usuarios simultáneos:');

      addTitle('12.1 Canales Realtime Consolidados', 2);
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

      addTitle('12.2 React Query Caché', 2);
      addBullet('staleTime: 5 minutos');
      addBullet('gcTime: 30 minutos');
      addBullet('Invalidación inteligente con realtime');

      addTitle('12.3 Bloqueo Optimista', 2);
      addBullet('Prevención de conflictos de edición concurrente');
      addBullet('ConflictDialog para resolución de conflictos');

      // ========== 13. RECOMENDACIONES ==========
      addNewPage();
      setProgress(90);
      updateStep('recommendations');
      
      addTitle('13. RECOMENDACIONES Y PARAMETRIZACIÓN SEGURIDAD');

      addTitle('13.1 Parámetros de Seguridad Recomendados para IT', 2);
      
      addSubtitle('Configuración Supabase Auth');
      addTable(
        ['Parámetro', 'Valor Recomendado', 'Justificación'],
        [
          ['JWT expiry', '3600 (1 hora)', 'Balance seguridad/UX'],
          ['Refresh token rotation', 'Enabled', 'Limitar tokens robados'],
          ['Leaked password protection', 'Enabled', 'Prevenir credenciales comprometidas'],
          ['MFA', 'Obligatorio admins', 'Protección cuentas privilegiadas'],
          ['Password min length', '12 caracteres', 'Estándar bancario'],
          ['Password requirements', 'Mayús+minús+núm+especial', 'Complejidad'],
        ],
        [55, 50, 65]
      );

      addSubtitle('Configuración PostgreSQL');
      addTable(
        ['Parámetro', 'Valor', 'Propósito'],
        [
          ['log_statement', 'all', 'Auditoría completa'],
          ['log_connections', 'on', 'Rastrear accesos'],
          ['ssl', 'on', 'Cifrado en tránsito'],
          ['password_encryption', 'scram-sha-256', 'Hash robusto'],
        ],
        [60, 50, 60]
      );

      addSubtitle('Headers de Seguridad HTTP');
      addBullet('Strict-Transport-Security: max-age=31536000; includeSubDomains');
      addBullet('X-Content-Type-Options: nosniff');
      addBullet('X-Frame-Options: DENY');
      addBullet('Content-Security-Policy: default-src \'self\'');
      addBullet('X-XSS-Protection: 1; mode=block');

      addNewPage();
      addTitle('13.2 Checklist Pre-Producción', 2);
      
      addTable(
        ['Verificación', 'Responsable', 'Estado'],
        [
          ['Políticas RLS revisadas', 'DBA + Seguridad', '☐ Pendiente'],
          ['MFA configurado para admins', 'IT', '☐ Pendiente'],
          ['Leaked password protection ON', 'IT', '☐ Pendiente'],
          ['Auditoría APDA realizada', 'DPD + Legal', '☐ Pendiente'],
          ['EIPD completada', 'DPD', '☐ Pendiente'],
          ['Penetration test externo', 'Seguridad', '☐ Pendiente'],
          ['Backup strategy definida', 'IT', '☐ Pendiente'],
          ['Plan continuidad documentado', 'IT + Negocio', '☐ Pendiente'],
          ['Formación usuarios completada', 'RRHH', '☐ Pendiente'],
          ['Certificados SSL instalados', 'IT', '☐ Pendiente'],
        ],
        [70, 50, 50]
      );

      addTitle('13.3 Priorización de Mejoras', 2);
      addTable(
        ['Prioridad', 'Mejora', 'Impacto', 'Esfuerzo'],
        [
          ['CRÍTICA', 'Restringir RLS profiles/companies', 'Seguridad', 'Bajo'],
          ['CRÍTICA', 'Activar leaked password protection', 'Seguridad', 'Bajo'],
          ['ALTA', 'MFA para admins', 'Seguridad', 'Medio'],
          ['ALTA', 'Migrar a self-hosted', 'Cumplimiento', 'Alto'],
          ['MEDIA', 'Módulo derechos ARSOPOL', 'Legal', 'Medio'],
          ['MEDIA', 'Tests E2E críticos', 'Calidad', 'Medio'],
        ],
        [30, 65, 40, 35]
      );

      addOpinion('Las recomendaciones priorizadas se basan en análisis de riesgo/beneficio. Los items CRÍTICOS deben implementarse antes de cualquier despliegue en producción. La migración a self-hosted, aunque de alto esfuerzo, es la única forma de garantizar que ningún dato sale del perímetro bancario.');

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
      doc.text('Sistema CRM Bancario Creand - Documentación Técnico-Funcional v2.0', pageWidth / 2, 40, { align: 'center' });
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
        ['Secciones:', '13 principales + subsecciones'],
        ['Análisis de seguridad:', 'Incluido con riesgos y mitigaciones'],
        ['Normativa andorrana:', 'APDA, AFA documentadas'],
        ['Guía intranet:', 'Pasos detallados de instalación'],
        ['Funcionalidades mapa:', 'Documentación extendida'],
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
      doc.text('Aviso Legal y Confidencialidad', margin, currentY);
      currentY += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const disclaimer = 'DOCUMENTO CONFIDENCIAL - USO INTERNO BANCARIO. Este documento contiene información técnica sensible sobre la arquitectura de seguridad del sistema. Su distribución fuera de Creand Banc requiere autorización expresa. El análisis de riesgos incluido debe ser validado por el equipo de seguridad antes de tomar decisiones de despliegue.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
      disclaimerLines.forEach((line: string) => {
        doc.text(line, margin, currentY);
        currentY += 5;
      });

      setProgress(100);
      
      // Save PDF
      const filename = `Documentacion_Tecnico_Funcional_Creand_v2_${new Date().toISOString().split('T')[0]}.pdf`;
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
          Generador de Documentación Técnico-Funcional v2.0
        </CardTitle>
        <CardDescription>
          Genera un documento PDF completo con documentación del sistema, 
          análisis de seguridad, normativa andorrana y guía de implementación en intranet.
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
                  <span className="truncate">{step.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h4 className="font-medium">El documento incluirá:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Índice general con 13 secciones principales</li>
            <li>• Arquitectura técnica y stack tecnológico</li>
            <li>• Sistema de roles y políticas RLS</li>
            <li>• <strong>Mapa geográfico - funcionalidades detalladas</strong></li>
            <li>• <strong>Análisis de seguridad con riesgos y mitigaciones</strong></li>
            <li>• <strong>Normativa Andorrana (APDA, AFA)</strong></li>
            <li>• <strong>Guía implementación en intranet bancaria</strong></li>
            <li>• <strong>Grado de autonomía sin internet</strong></li>
            <li>• <strong>Parámetros seguridad para IT</strong></li>
            <li>• Normativa bancaria internacional (Basel, IFRS9, MiFID II)</li>
            <li>• Recomendaciones priorizadas con checklist</li>
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
              Generar Documento PDF v2.0 (~60 páginas)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
