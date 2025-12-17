import { createEnhancedPDF } from './pdfUtils';

interface AuditData {
  globalScore: number;
  timestamp: string;
  executiveSummary: any;
  sections: any;
  coreWebVitals: any[];
  bundleAnalysis: any;
  disruptiveImprovements: any;
  roadmap: any[];
  competitorBenchmark: any[];
  visualImprovements: any[];
  financialAnalysis: any;
  conclusions: any;
}

export async function generateComprehensiveAuditPDF(
  auditData: AuditData,
  onProgress?: (progress: number) => void
): Promise<void> {
  const pdf = createEnhancedPDF('p', 'a4');
  const doc = (pdf as any).doc;
  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const setProgress = (p: number) => onProgress?.(p);

  // Helper functions
  const addColoredText = (text: string, x: number, y: number, color: [number, number, number]) => {
    doc.setTextColor(...color);
    doc.text(text, x, y);
    doc.setTextColor(0, 0, 0);
  };

  const getStatusColor = (status: string): [number, number, number] => {
    switch (status) {
      case 'success': case 'good': return [34, 197, 94];
      case 'warning': case 'needs-improvement': return [245, 158, 11];
      case 'critical': case 'poor': return [239, 68, 68];
      default: return [100, 116, 139];
    }
  };

  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (doc.getTextWidth(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // ========================================
  // PAGE 1: COVER
  // ========================================
  let y = await pdf.addHeader('AUDITORIA TOTAL DE RENDIMENT WEB', 'Anàlisi Exhaustiu Tècnic, Operatiu, Funcional i Visual');
  setProgress(5);

  y += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Puntuació Global', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Score circle
  const scoreColor = auditData.globalScore >= 90 ? [34, 197, 94] : auditData.globalScore >= 70 ? [245, 158, 11] : [239, 68, 68];
  doc.setFillColor(...scoreColor as [number, number, number]);
  doc.circle(pageWidth / 2, y + 15, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text(String(auditData.globalScore), pageWidth / 2, y + 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text('/100', pageWidth / 2, y + 28, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  y += 50;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Data generació: ${new Date(auditData.timestamp).toLocaleString('ca-ES')}`, pageWidth / 2, y, { align: 'center' });
  doc.text('Versió ObelixIA: 3.0 Enterprise', pageWidth / 2, y + 6, { align: 'center' });

  // Section scores preview
  y += 20;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Puntuacions per Secció:', margin, y);
  y += 8;

  const sectionNames = ['technical', 'performance', 'operational', 'functional', 'accessibility', 'seo', 'security', 'uxVisual'];
  const sectionLabels: Record<string, string> = {
    technical: 'Tècnica',
    performance: 'Rendiment',
    operational: 'Operacional',
    functional: 'Funcional',
    accessibility: 'Accessibilitat',
    seo: 'SEO',
    security: 'Seguretat',
    uxVisual: 'UX/Visual'
  };

  sectionNames.forEach((key, i) => {
    const section = auditData.sections[key];
    if (!section) return;
    const col = i < 4 ? 0 : 1;
    const row = i % 4;
    const xPos = margin + col * 90;
    const yPos = y + row * 8;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sectionLabels[key]}:`, xPos, yPos);
    
    const scoreColor = getStatusColor(section.score >= 80 ? 'success' : section.score >= 60 ? 'warning' : 'critical');
    doc.setTextColor(...scoreColor);
    doc.text(`${section.score}/100`, xPos + 55, yPos);
    doc.setTextColor(0, 0, 0);
  });

  setProgress(10);

  // ========================================
  // PAGE 2-3: TABLE OF CONTENTS
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('ÍNDEX DE CONTINGUTS', 'Navegació del Document');
  y += 10;

  const tocItems = [
    { title: '1. Resum Executiu', page: 4 },
    { title: '2. Core Web Vitals (LCP, INP, CLS, FCP, TTFB)', page: 6 },
    { title: '3. Auditoria Tècnica', page: 12 },
    { title: '4. Auditoria de Rendiment', page: 15 },
    { title: '5. Auditoria Operacional', page: 17 },
    { title: '6. Auditoria Funcional', page: 19 },
    { title: '7. Accessibilitat (WCAG)', page: 21 },
    { title: '8. SEO', page: 23 },
    { title: '9. Seguretat', page: 25 },
    { title: '10. UX i Millores Visuals', page: 27 },
    { title: '11. Anàlisi del Bundle', page: 30 },
    { title: '12. Millores Disruptives', page: 32 },
    { title: '13. Roadmap d\'Implementació', page: 36 },
    { title: '14. Benchmark Competidors', page: 38 },
    { title: '15. Anàlisi Financera i ROI', page: 40 },
    { title: '16. Conclusions i Recomanacions', page: 42 }
  ];

  tocItems.forEach((item, i) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(item.title, margin, y);
    doc.setTextColor(30, 58, 95);
    doc.text(String(item.page), pageWidth - margin - 10, y);
    doc.setTextColor(0, 0, 0);
    
    // Dotted line
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    const textWidth = doc.getTextWidth(item.title);
    doc.line(margin + textWidth + 5, y - 1, pageWidth - margin - 20, y - 1);
    doc.setLineDashPattern([], 0);
    
    y += 10;
    if (y > 270) {
      pdf.addPage();
      y = 30;
    }
  });

  setProgress(15);

  // ========================================
  // PAGES 4-5: EXECUTIVE SUMMARY
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('RESUM EXECUTIU', 'Visió General i Prioritats');
  y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const overviewLines = wrapText(auditData.executiveSummary.overview, contentWidth);
  overviewLines.forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Troballes Clau:', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  auditData.executiveSummary.keyFindings.forEach((finding: string, i: number) => {
    const icon = finding.startsWith('Arquitectura') || finding.startsWith('Seguretat') ? '[OK]' : '[!]';
    doc.text(`${icon} ${finding}`, margin + 5, y);
    y += 6;
    if (y > 270) { pdf.addPage(); y = 30; }
  });

  y += 8;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Prioritats Principals:', margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  auditData.executiveSummary.topPriorities.forEach((priority: string) => {
    doc.text(priority, margin + 5, y);
    y += 6;
    if (y > 270) { pdf.addPage(); y = 30; }
  });

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  addColoredText(`Inversió Estimada: ${auditData.executiveSummary.estimatedTotalInvestment}`, margin, y, [30, 58, 95]);
  y += 7;
  addColoredText(`ROI Esperat: ${auditData.executiveSummary.expectedROI}`, margin, y, [34, 197, 94]);
  y += 7;
  doc.setTextColor(0, 0, 0);
  doc.text(`Timeline: ${auditData.executiveSummary.timeline}`, margin, y);

  setProgress(20);

  // ========================================
  // PAGES 6-11: CORE WEB VITALS (1 page per metric)
  // ========================================
  for (const vital of auditData.coreWebVitals) {
    pdf.addPage();
    y = await pdf.addHeader(`CORE WEB VITAL: ${vital.metric}`, vital.fullName);
    y += 5;

    // Status indicator
    const statusColor = getStatusColor(vital.status);
    doc.setFillColor(...statusColor);
    doc.roundedRect(margin, y, 50, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(vital.status.toUpperCase(), margin + 25, y + 8, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Values
    doc.setFontSize(11);
    doc.text(`Valor Actual: ${vital.value !== null ? vital.value : 'No mesurat'}`, margin + 60, y + 5);
    doc.text(`Objectiu: < ${vital.target}`, margin + 60, y + 11);
    y += 20;

    // What it measures
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Què mesura:', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    wrapText(vital.whatItMeasures, contentWidth).forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });

    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Per què importa:', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    wrapText(vital.whyItMatters, contentWidth).forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });

    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Impacte en Negoci:', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    wrapText(vital.businessImpact, contentWidth).forEach(line => {
      doc.text(line, margin, y);
      y += 5;
    });

    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomanacions:', margin, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    vital.recommendations.slice(0, 5).forEach((rec: string) => {
      doc.text(`• ${rec}`, margin + 3, y);
      y += 5;
    });

    if (y < 240 && vital.implementationGuide) {
      y += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Guia d\'Implementació:', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      vital.implementationGuide.slice(0, 4).forEach((step: string) => {
        doc.text(step, margin + 3, y);
        y += 5;
      });
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Millora esperada: ${vital.expectedImprovement}`, margin, 275);
    doc.setTextColor(0, 0, 0);
  }

  setProgress(35);

  // ========================================
  // PAGES 12-26: AUDIT SECTIONS
  // ========================================
  for (const sectionKey of sectionNames) {
    const section = auditData.sections[sectionKey];
    if (!section) continue;

    pdf.addPage();
    y = await pdf.addHeader(section.title.toUpperCase(), section.description);
    y += 5;

    // Score bar
    const scorePercent = section.score / 100;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    const barColor = getStatusColor(section.score >= 80 ? 'success' : section.score >= 60 ? 'warning' : 'critical');
    doc.setFillColor(...barColor);
    doc.roundedRect(margin, y, contentWidth * scorePercent, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${section.score}/100`, margin + contentWidth * scorePercent / 2, y + 7, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 18;

    // Detailed analysis
    if (section.detailedAnalysis) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      wrapText(section.detailedAnalysis, contentWidth).forEach(line => {
        doc.text(line, margin, y);
        y += 5;
      });
      y += 5;
    }

    // KPIs table
    if (section.kpis && section.kpis.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('KPIs:', margin, y);
      y += 8;

      const kpiData = section.kpis.map((kpi: any) => [kpi.name, kpi.current, kpi.target, kpi.status === 'success' ? 'OK' : kpi.status === 'warning' ? '!' : 'i']);
      y = pdf.addTable(['Mètrica', 'Actual', 'Objectiu', 'Estat'], kpiData, y);
      y += 5;
    }

    // Findings
    if (section.findings && y < 200) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Troballes Principals:', margin, y);
      y += 8;

      section.findings.slice(0, 4).forEach((finding: any) => {
        const icon = finding.type === 'success' ? '[OK]' : finding.type === 'warning' ? '[!]' : '[i]';
        const color = getStatusColor(finding.type);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        addColoredText(`${icon} ${finding.title || finding.category}`, margin, y, color);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        wrapText(finding.description, contentWidth - 5).slice(0, 2).forEach(line => {
          doc.text(line, margin + 5, y);
          y += 4;
        });
        y += 3;
        if (y > 250) return;
      });
    }

    // Recommendations
    if (section.recommendations && y < 260) {
      y += 3;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomanacions:', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      section.recommendations.slice(0, 4).forEach((rec: string) => {
        doc.text(`• ${rec}`, margin + 3, y);
        y += 5;
      });
    }
  }

  setProgress(55);

  // ========================================
  // BUNDLE ANALYSIS PAGE
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('ANÀLISI DEL BUNDLE', 'Desglossament de Mida i Optimitzacions');
  y += 5;

  const bundle = auditData.bundleAnalysis;
  const bundleData = [
    ['Total', bundle.totalSize, bundle.totalSizeGzip],
    ['JavaScript', bundle.jsSize, bundle.jsSizeGzip],
    ['CSS', bundle.cssSize, bundle.cssSizeGzip],
    ['Imatges', bundle.imageSize, '-'],
    ['Fonts', bundle.fontSize, '-']
  ];
  y = pdf.addTable(['Tipus', 'Mida', 'Gzip'], bundleData, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Oportunitats d\'Optimització:', margin, y);
  y += 8;

  if (bundle.optimizationOpportunities) {
    const optData = bundle.optimizationOpportunities.map((opt: any) => [opt.area, opt.savings, opt.difficulty]);
    y = pdf.addTable(['Àrea', 'Estalvi', 'Dificultat'], optData, y);
  }

  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tree Shaking Potencial: ${bundle.treeshakingPotential}`, margin, y);
  y += 6;
  doc.text(`Lazy Load Coverage: ${bundle.lazyLoadCoverage}`, margin, y);
  y += 6;
  doc.text(`Codi No Utilitzat: ${bundle.unusedCode}`, margin, y);

  setProgress(60);

  // ========================================
  // DISRUPTIVE IMPROVEMENTS PAGES
  // ========================================
  const priorities = ['high', 'medium', 'low'];
  const priorityLabels: Record<string, string> = { high: 'ALTA', medium: 'MITJANA', low: 'BAIXA' };
  const priorityColors: Record<string, [number, number, number]> = {
    high: [239, 68, 68],
    medium: [245, 158, 11],
    low: [34, 197, 94]
  };

  for (const priority of priorities) {
    const improvements = auditData.disruptiveImprovements[priority];
    if (!improvements || improvements.length === 0) continue;

    pdf.addPage();
    y = await pdf.addHeader(`MILLORES DISRUPTIVES - PRIORITAT ${priorityLabels[priority]}`, `${improvements.length} millores identificades`);
    y += 5;

    for (const imp of improvements.slice(0, 2)) {
      // Title with priority badge
      doc.setFillColor(...priorityColors[priority]);
      doc.roundedRect(margin, y, 8, 8, 1, 1, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(imp.title, margin + 12, y + 6);
      y += 12;

      // Description
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      wrapText(imp.description, contentWidth).slice(0, 3).forEach(line => {
        doc.text(line, margin, y);
        y += 4;
      });
      y += 3;

      // Key metrics
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      addColoredText(`Millora esperada: ${imp.expectedImprovement}`, margin, y, [34, 197, 94]);
      y += 5;
      doc.setTextColor(0, 0, 0);
      doc.text(`Esforç: ${imp.effort} | Cost: ${imp.estimatedCost || 'Variable'}`, margin, y);
      y += 5;
      if (imp.roi) {
        addColoredText(`ROI: ${imp.roi}`, margin, y, [30, 58, 95]);
        y += 5;
      }

      // Technologies
      if (imp.technologies) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Tecnologies: ${imp.technologies.join(', ')}`, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 6;
      }

      // Implementation steps
      if (imp.implementationSteps && y < 220) {
        doc.setFont('helvetica', 'bold');
        doc.text('Passos d\'implementació:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        imp.implementationSteps.slice(0, 4).forEach((step: string) => {
          doc.text(step, margin + 3, y);
          y += 4;
        });
      }

      y += 10;
      if (y > 230) break;
    }
  }

  setProgress(70);

  // ========================================
  // ROADMAP PAGE
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('ROADMAP D\'IMPLEMENTACIÓ', 'Pla d\'Acció per Fases');
  y += 5;

  for (const phase of auditData.roadmap) {
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`${phase.phase} (${phase.duration})`, margin + 5, y + 7);
    doc.setTextColor(0, 0, 0);
    y += 15;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Objectius:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    phase.objectives.slice(0, 3).forEach((obj: string) => {
      doc.text(`• ${obj}`, margin + 3, y);
      y += 4;
    });

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Entregables:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    phase.deliverables.slice(0, 3).forEach((del: string) => {
      doc.text(`• ${del}`, margin + 3, y);
      y += 4;
    });

    addColoredText(`Cost: ${phase.estimatedCost} | Millora: ${phase.expectedImprovement}`, margin, y + 3, [30, 58, 95]);
    y += 15;

    if (y > 240) {
      pdf.addPage();
      y = 30;
    }
  }

  setProgress(80);

  // ========================================
  // COMPETITOR BENCHMARK PAGE
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('BENCHMARK COMPETIDORS', 'Posicionament vs Mercat');
  y += 5;

  const compData = auditData.competitorBenchmark.map((comp: any) => [
    comp.name,
    String(comp.lighthouse),
    comp.lcp,
    comp.cls,
    comp.ttfb
  ]);
  y = pdf.addTable(['Competidor', 'Lighthouse', 'LCP', 'CLS', 'TTFB'], compData, y);

  y += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Anàlisi Comparativa:', margin, y);
  y += 8;

  auditData.competitorBenchmark.slice(0, 4).forEach((comp: any) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(comp.name, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(` - ${comp.comparison}`, margin + doc.getTextWidth(comp.name), y);
    y += 6;
  });

  setProgress(85);

  // ========================================
  // FINANCIAL ANALYSIS PAGE
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('ANÀLISI FINANCERA I ROI', 'Inversió i Retorn Esperat');
  y += 5;

  const fin = auditData.financialAnalysis;
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  addColoredText(`Inversió Total: ${fin.totalInvestment}`, margin, y, [30, 58, 95]);
  y += 12;

  doc.setFontSize(11);
  doc.text('Desglossament per Sprint:', margin, y);
  y += 8;

  const breakdownData = fin.breakdown.map((b: any) => [b.category, b.cost, `${b.percentage}%`]);
  y = pdf.addTable(['Fase', 'Cost', '%'], breakdownData, y);

  y += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Projecció de ROI:', margin, y);
  y += 8;

  const roiData = fin.roiProjection.map((r: any) => [r.period, r.expectedReturn, `${r.percentage}%`]);
  y = pdf.addTable(['Període', 'Retorn Esperat', 'ROI %'], roiData, y);

  y += 10;
  doc.setFontSize(11);
  addColoredText(`Període de Payback: ${fin.paybackPeriod}`, margin, y, [34, 197, 94]);
  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.text(`Cost per Usuari: ${fin.costPerUser}`, margin, y);

  setProgress(90);

  // ========================================
  // CONCLUSIONS PAGE
  // ========================================
  pdf.addPage();
  y = await pdf.addHeader('CONCLUSIONS I RECOMANACIONS', 'Resum Final i Pròxims Passos');
  y += 5;

  const conc = auditData.conclusions;

  // SWOT mini
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Strengths
  addColoredText('Punts Forts:', margin, y, [34, 197, 94]);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  conc.strengths.slice(0, 3).forEach((s: string) => {
    doc.text(`+ ${s}`, margin + 3, y);
    y += 5;
  });

  y += 3;
  doc.setFont('helvetica', 'bold');
  addColoredText('Àrees de Millora:', margin, y, [245, 158, 11]);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  conc.weaknesses.slice(0, 3).forEach((w: string) => {
    doc.text(`- ${w}`, margin + 3, y);
    y += 5;
  });

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomanació Final:', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  wrapText(conc.finalRecommendation, contentWidth).forEach(line => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Pròxims Passos:', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  conc.nextSteps.forEach((step: string) => {
    doc.text(step, margin + 3, y);
    y += 5;
  });

  setProgress(95);

  // Add footer to all pages
  pdf.addFooter();

  setProgress(100);

  // Save
  pdf.save(`ObelixIA_Auditoria_Total_${new Date().toISOString().split('T')[0]}.pdf`);
}
