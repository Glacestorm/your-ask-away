/**
 * Viability Study PDF Export Utility
 * Generates professional PDF documents for viability studies
 */

import jsPDF from 'jspdf';
import { openPrintDialogForJsPdf } from './pdfPrint';

export interface ViabilityStudyPDFData {
  projectName: string;
  projectType?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  initialInvestment?: number;
  projectionYears?: number;
  // Scores
  financialScore?: number;
  technicalScore?: number;
  commercialScore?: number;
  overallViability?: number;
  // Financial metrics
  npv?: number;
  irr?: number;
  paybackPeriod?: number;
  roi?: number;
  breakEvenPoint?: string;
  // Projections
  revenueProjections?: number[];
  costProjections?: number[];
  cashFlowProjections?: number[];
  // Analysis
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  risks?: { name: string; probability: string; impact: string; mitigation: string }[];
  recommendations?: string[];
  conclusion?: string;
}

const PRIMARY_COLOR: [number, number, number] = [16, 185, 129]; // Emerald
const SECONDARY_COLOR: [number, number, number] = [52, 211, 153];
const TEXT_COLOR: [number, number, number] = [31, 41, 55];
const MUTED_COLOR: [number, number, number] = [107, 114, 128];
const SUCCESS_COLOR: [number, number, number] = [34, 197, 94];
const WARNING_COLOR: [number, number, number] = [245, 158, 11];
const DANGER_COLOR: [number, number, number] = [239, 68, 68];

export function generateViabilityStudyPDF(data: ViabilityStudyPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25; // Margen aumentado
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper functions
  const addNewPageIfNeeded = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin - 15) { // Margen inferior mayor
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  const getScoreColor = (score?: number): [number, number, number] => {
    if (!score) return MUTED_COLOR;
    if (score >= 70) return SUCCESS_COLOR;
    if (score >= 40) return WARNING_COLOR;
    return DANGER_COLOR;
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
    const lines = doc.splitTextToSize(text, contentWidth - 5);
    lines.forEach((line: string) => {
      addNewPageIfNeeded(8);
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    yPos += 4;
  };

  const drawBulletList = (items: string[]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentWidth - 12);
      addNewPageIfNeeded(lines.length * 6 + 4);
      doc.setTextColor(...SECONDARY_COLOR);
      doc.text('-', margin, yPos);
      doc.setTextColor(...TEXT_COLOR);
      lines.forEach((line: string, idx: number) => {
        doc.text(line, margin + 8, yPos + (idx * 6));
      });
      yPos += lines.length * 6 + 3;
    });
    yPos += 4;
  };

  const drawScoreGauge = (label: string, score: number, x: number, width: number) => {
    const gaugeHeight = 6;
    const color = getScoreColor(score);
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(label, x, yPos);
    
    // Background bar
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(x, yPos + 2, width, gaugeHeight, 1, 1, 'F');
    
    // Progress bar
    doc.setFillColor(...color);
    const progressWidth = (score / 100) * width;
    doc.roundedRect(x, yPos + 2, progressWidth, gaugeHeight, 1, 1, 'F');
    
    // Score text
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(`${score}/100`, x + width + 3, yPos + 6);
  };

  const formatCurrency = (value?: number) => 
    value !== undefined ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value) : 'N/A';

  const formatPercent = (value?: number) =>
    value !== undefined ? `${value.toFixed(1)}%` : 'N/A';

  // === COVER PAGE ===
  doc.setFillColor(240, 253, 244);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header band
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Logo
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 50, 20, 'F');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('V', pageWidth / 2 - 7, 57);

  // Title
  yPos = 100;
  doc.setTextColor(...TEXT_COLOR);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTUDIO DE VIABILIDAD', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Project name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PRIMARY_COLOR);
  const projectLines = doc.splitTextToSize(data.projectName || 'Proyecto', contentWidth);
  projectLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });

  // Overall viability score (big)
  yPos += 20;
  const overallScore = data.overallViability || data.commercialScore || 0;
  const scoreColor = getScoreColor(overallScore);
  
  doc.setFillColor(...scoreColor);
  doc.circle(pageWidth / 2, yPos + 20, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${overallScore}`, pageWidth / 2, yPos + 24, { align: 'center' });
  doc.setFontSize(10);
  doc.text('VIABILIDAD', pageWidth / 2, yPos + 32, { align: 'center' });

  // Verdict
  yPos += 55;
  doc.setTextColor(...scoreColor);
  doc.setFontSize(14);
  const verdict = overallScore >= 70 ? 'VIABLE' : overallScore >= 40 ? 'VIABLE CON CONDICIONES' : 'NO VIABLE';
  doc.text(verdict, pageWidth / 2, yPos, { align: 'center' });

  // Metadata
  yPos = pageHeight - 50;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED_COLOR);
  doc.text(`Tipo: ${data.projectType || 'General'}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;
  doc.text(`Inversión Inicial: ${formatCurrency(data.initialInvestment)}`, pageWidth / 2, yPos, { align: 'center' });
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

  // 1. Executive Summary with Scores
  drawSectionTitle('1. Resumen de Viabilidad');
  
  // Score gauges
  yPos += 5;
  const gaugeWidth = 45;
  const startX = margin;
  
  drawScoreGauge('Financiero', data.financialScore || 0, startX, gaugeWidth);
  drawScoreGauge('Técnico', data.technicalScore || 0, startX + gaugeWidth + 25, gaugeWidth);
  drawScoreGauge('Comercial', data.commercialScore || 0, startX + (gaugeWidth + 25) * 2, gaugeWidth);
  
  yPos += 15;

  if (data.description) {
    drawSubSection('Descripción del Proyecto');
    drawText(data.description);
  }

  // 2. Financial Metrics
  drawSectionTitle('2. Métricas Financieras');
  
  // Metrics table
  const metrics = [
    { label: 'Inversión Inicial', value: formatCurrency(data.initialInvestment) },
    { label: 'VAN (NPV)', value: formatCurrency(data.npv) },
    { label: 'TIR (IRR)', value: formatPercent(data.irr) },
    { label: 'Payback', value: data.paybackPeriod ? `${data.paybackPeriod} meses` : 'N/A' },
    { label: 'ROI', value: formatPercent(data.roi) },
    { label: 'Punto de Equilibrio', value: data.breakEvenPoint || 'N/A' },
  ];

  metrics.forEach((metric) => {
    addNewPageIfNeeded(10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(metric.label + ':', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXT_COLOR);
    doc.text(metric.value, margin + 50, yPos);
    yPos += 7;
  });
  yPos += 5;

  // 3. SWOT Analysis
  if (data.strengths?.length || data.weaknesses?.length || data.opportunities?.length || data.threats?.length) {
    drawSectionTitle('3. Análisis DAFO');
    
    if (data.strengths?.length) {
      drawSubSection('Fortalezas');
      drawBulletList(data.strengths);
    }
    if (data.weaknesses?.length) {
      drawSubSection('Debilidades');
      drawBulletList(data.weaknesses);
    }
    if (data.opportunities?.length) {
      drawSubSection('Oportunidades');
      drawBulletList(data.opportunities);
    }
    if (data.threats?.length) {
      drawSubSection('Amenazas');
      drawBulletList(data.threats);
    }
  }

  // 4. Risk Analysis
  if (data.risks?.length) {
    drawSectionTitle('4. Análisis de Riesgos');
    
    data.risks.forEach((risk, idx) => {
      addNewPageIfNeeded(25);
      drawSubSection(`Riesgo ${idx + 1}: ${risk.name}`);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Probabilidad: ${risk.probability}`, margin, yPos);
      yPos += 5;
      doc.text(`Impacto: ${risk.impact}`, margin, yPos);
      yPos += 5;
      doc.text(`Mitigación: ${risk.mitigation}`, margin, yPos);
      yPos += 8;
    });
  }

  // 5. Recommendations
  if (data.recommendations?.length) {
    drawSectionTitle('5. Recomendaciones');
    drawBulletList(data.recommendations);
  }

  // 6. Conclusion
  if (data.conclusion) {
    drawSectionTitle('6. Conclusión');
    drawText(data.conclusion);
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

export function downloadViabilityStudyPDF(data: ViabilityStudyPDFData, filename?: string) {
  const doc = generateViabilityStudyPDF(data);
  const name = filename || `estudio-viabilidad-${data.projectName?.toLowerCase().replace(/\s+/g, '-') || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(name);
}

export function printViabilityStudyPDF(data: ViabilityStudyPDFData) {
  const doc = generateViabilityStudyPDF(data);
  openPrintDialogForJsPdf(doc);
}
