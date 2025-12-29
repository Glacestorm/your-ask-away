/**
 * Business Plan PDF Export Utility
 * Generates professional PDF documents for business plans
 */

import jsPDF from 'jspdf';
import { openPrintDialogForJsPdf } from './pdfPrint';

export interface BusinessPlanPDFData {
  title: string;
  companyName?: string;
  planType?: string;
  targetAudience?: string;
  status?: string;
  createdAt?: string;
  executiveSummary?: {
    vision?: string;
    mission?: string;
    objectives?: string[];
    keyHighlights?: string[];
  };
  marketAnalysis?: {
    marketSize?: string;
    targetSegments?: string[];
    competitors?: string[];
    opportunities?: string[];
  };
  businessModel?: {
    revenueStreams?: string[];
    valueProposition?: string;
    keyPartners?: string[];
    costStructure?: string[];
  };
  financialPlan?: {
    projectedRevenue?: number;
    projectedCosts?: number;
    breakEvenPoint?: string;
    fundingRequired?: number;
  };
  marketingStrategy?: {
    channels?: string[];
    budget?: number;
    tactics?: string[];
  };
  operationsPlan?: {
    keyActivities?: string[];
    resources?: string[];
    timeline?: string;
  };
  teamOrganization?: {
    roles?: string[];
    structure?: string;
  };
  riskAnalysis?: {
    risks?: { name: string; mitigation: string }[];
  };
}

const PRIMARY_COLOR: [number, number, number] = [79, 70, 229]; // Indigo
const SECONDARY_COLOR: [number, number, number] = [99, 102, 241];
const TEXT_COLOR: [number, number, number] = [31, 41, 55];
const MUTED_COLOR: [number, number, number] = [107, 114, 128];

export function generateBusinessPlanPDF(data: BusinessPlanPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const drawSectionTitle = (title: string) => {
    addNewPageIfNeeded(20);
    doc.setFillColor(...PRIMARY_COLOR);
    doc.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), margin + 5, yPos + 7);
    yPos += 15;
    doc.setTextColor(...TEXT_COLOR);
  };

  const drawSubSection = (title: string) => {
    addNewPageIfNeeded(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(title, margin, yPos);
    yPos += 6;
    doc.setTextColor(...TEXT_COLOR);
  };

  const drawText = (text: string, fontSize = 10) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(7);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 3;
  };

  const drawBulletList = (items: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    items.forEach((item) => {
      addNewPageIfNeeded(7);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text('•', margin, yPos);
      doc.setTextColor(...TEXT_COLOR);
      const lines = doc.splitTextToSize(item, contentWidth - 8);
      lines.forEach((line: string, idx: number) => {
        doc.text(line, margin + 6, yPos + (idx * 5));
      });
      yPos += lines.length * 5 + 2;
    });
    yPos += 3;
  };

  // === COVER PAGE ===
  // Background gradient effect
  doc.setFillColor(245, 243, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative element
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Company logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 50, 20, 'F');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('O', pageWidth / 2 - 7, 57);

  // Title
  yPos = 100;
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(data.title || 'Plan de Negocio', contentWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
  });

  // Company name
  if (data.companyName) {
    yPos += 5;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(data.companyName, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
  }

  // Metadata
  yPos = pageHeight - 60;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Tipo: ${data.planType || 'General'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Audiencia: ${data.targetAudience || 'No especificada'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Estado: ${data.status || 'Borrador'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Fecha: ${data.createdAt || new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Footer
  yPos = pageHeight - 15;
  doc.setFontSize(9);
  doc.text('Generado con ObelixIA Contabilidad Pro', pageWidth / 2, yPos, { align: 'center' });

  // === CONTENT PAGES ===
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  yPos = margin;

  // Table of Contents
  drawSectionTitle('Índice');
  const sections = [
    '1. Resumen Ejecutivo',
    '2. Análisis de Mercado',
    '3. Modelo de Negocio',
    '4. Plan Financiero',
    '5. Estrategia de Marketing',
    '6. Plan de Operaciones',
    '7. Equipo y Organización',
    '8. Análisis de Riesgos',
  ];
  sections.forEach((section) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(section, margin + 5, yPos);
    yPos += 8;
  });
  yPos += 10;

  // 1. Executive Summary
  drawSectionTitle('1. Resumen Ejecutivo');
  if (data.executiveSummary) {
    if (data.executiveSummary.vision) {
      drawSubSection('Visión');
      drawText(data.executiveSummary.vision);
    }
    if (data.executiveSummary.mission) {
      drawSubSection('Misión');
      drawText(data.executiveSummary.mission);
    }
    if (data.executiveSummary.objectives?.length) {
      drawSubSection('Objetivos');
      drawBulletList(data.executiveSummary.objectives);
    }
    if (data.executiveSummary.keyHighlights?.length) {
      drawSubSection('Puntos Clave');
      drawBulletList(data.executiveSummary.keyHighlights);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 2. Market Analysis
  drawSectionTitle('2. Análisis de Mercado');
  if (data.marketAnalysis) {
    if (data.marketAnalysis.marketSize) {
      drawSubSection('Tamaño del Mercado');
      drawText(data.marketAnalysis.marketSize);
    }
    if (data.marketAnalysis.targetSegments?.length) {
      drawSubSection('Segmentos Objetivo');
      drawBulletList(data.marketAnalysis.targetSegments);
    }
    if (data.marketAnalysis.competitors?.length) {
      drawSubSection('Competidores');
      drawBulletList(data.marketAnalysis.competitors);
    }
    if (data.marketAnalysis.opportunities?.length) {
      drawSubSection('Oportunidades');
      drawBulletList(data.marketAnalysis.opportunities);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 3. Business Model
  drawSectionTitle('3. Modelo de Negocio');
  if (data.businessModel) {
    if (data.businessModel.valueProposition) {
      drawSubSection('Propuesta de Valor');
      drawText(data.businessModel.valueProposition);
    }
    if (data.businessModel.revenueStreams?.length) {
      drawSubSection('Fuentes de Ingresos');
      drawBulletList(data.businessModel.revenueStreams);
    }
    if (data.businessModel.keyPartners?.length) {
      drawSubSection('Socios Clave');
      drawBulletList(data.businessModel.keyPartners);
    }
    if (data.businessModel.costStructure?.length) {
      drawSubSection('Estructura de Costes');
      drawBulletList(data.businessModel.costStructure);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 4. Financial Plan
  drawSectionTitle('4. Plan Financiero');
  if (data.financialPlan) {
    const formatCurrency = (value?: number) => 
      value ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value) : 'No especificado';
    
    drawSubSection('Proyecciones Financieras');
    drawText(`Ingresos Proyectados: ${formatCurrency(data.financialPlan.projectedRevenue)}`);
    drawText(`Costes Proyectados: ${formatCurrency(data.financialPlan.projectedCosts)}`);
    drawText(`Punto de Equilibrio: ${data.financialPlan.breakEvenPoint || 'No calculado'}`);
    drawText(`Financiación Requerida: ${formatCurrency(data.financialPlan.fundingRequired)}`);
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 5. Marketing Strategy
  drawSectionTitle('5. Estrategia de Marketing');
  if (data.marketingStrategy) {
    if (data.marketingStrategy.channels?.length) {
      drawSubSection('Canales');
      drawBulletList(data.marketingStrategy.channels);
    }
    if (data.marketingStrategy.budget) {
      drawSubSection('Presupuesto');
      drawText(new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(data.marketingStrategy.budget));
    }
    if (data.marketingStrategy.tactics?.length) {
      drawSubSection('Tácticas');
      drawBulletList(data.marketingStrategy.tactics);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 6. Operations Plan
  drawSectionTitle('6. Plan de Operaciones');
  if (data.operationsPlan) {
    if (data.operationsPlan.keyActivities?.length) {
      drawSubSection('Actividades Clave');
      drawBulletList(data.operationsPlan.keyActivities);
    }
    if (data.operationsPlan.resources?.length) {
      drawSubSection('Recursos');
      drawBulletList(data.operationsPlan.resources);
    }
    if (data.operationsPlan.timeline) {
      drawSubSection('Cronograma');
      drawText(data.operationsPlan.timeline);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 7. Team & Organization
  drawSectionTitle('7. Equipo y Organización');
  if (data.teamOrganization) {
    if (data.teamOrganization.structure) {
      drawSubSection('Estructura');
      drawText(data.teamOrganization.structure);
    }
    if (data.teamOrganization.roles?.length) {
      drawSubSection('Roles Clave');
      drawBulletList(data.teamOrganization.roles);
    }
  } else {
    drawText('Sección pendiente de completar.');
  }

  // 8. Risk Analysis
  drawSectionTitle('8. Análisis de Riesgos');
  if (data.riskAnalysis?.risks?.length) {
    data.riskAnalysis.risks.forEach((risk, idx) => {
      drawSubSection(`Riesgo ${idx + 1}: ${risk.name}`);
      drawText(`Mitigación: ${risk.mitigation}`);
    });
  } else {
    drawText('No se han identificado riesgos.');
  }

  // Page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`Página ${i - 1} de ${totalPages - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text('ObelixIA Contabilidad Pro', margin, pageHeight - 10);
  }

  return doc;
}

export function downloadBusinessPlanPDF(data: BusinessPlanPDFData, filename?: string) {
  const doc = generateBusinessPlanPDF(data);
  const name = filename || `plan-negocio-${data.companyName?.toLowerCase().replace(/\s+/g, '-') || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

export function printBusinessPlanPDF(data: BusinessPlanPDFData) {
  const doc = generateBusinessPlanPDF(data);
  openPrintDialogForJsPdf(doc);
}
