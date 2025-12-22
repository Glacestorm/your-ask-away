import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { openPrintDialogForJsPdf } from '@/lib/pdfPrint';
import { DafoItem, BusinessPlanSection, FinancialPlanAccount, FinancialPlanRatio, FinancialScenario } from '@/hooks/useStrategicPlanning';

const PRIMARY_COLOR = [59, 130, 246] as [number, number, number]; // Blue
const HEADER_BG = [241, 245, 249] as [number, number, number]; // Light gray

/**
 * Generate DAFO Analysis PDF
 */
export function generateDafoPDF(
  projectName: string,
  description: string,
  items: DafoItem[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('ANÁLISIS DAFO', 14, 20);
  doc.setFontSize(12);
  doc.text(projectName, 14, 28);

  // Description
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  if (description) {
    doc.text(description, 14, 45, { maxWidth: pageWidth - 28 });
  }

  const categories = [
    { key: 'strengths', label: 'FORTALEZAS', color: [34, 197, 94] as [number, number, number] },
    { key: 'weaknesses', label: 'DEBILIDADES', color: [239, 68, 68] as [number, number, number] },
    { key: 'opportunities', label: 'OPORTUNIDADES', color: [59, 130, 246] as [number, number, number] },
    { key: 'threats', label: 'AMENAZAS', color: [249, 115, 22] as [number, number, number] }
  ];

  let yPos = 55;

  categories.forEach((cat, idx) => {
    if (idx === 2 && yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    const catItems = items.filter(i => i.category === cat.key);
    
    doc.setFillColor(...cat.color);
    doc.rect(14, yPos, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(cat.label, 16, yPos + 6);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    if (catItems.length > 0) {
      autoTable(doc, {
        startY: yPos + 10,
        head: [['Descripción', 'Imp.', 'Plan de Acción']],
        body: catItems.map(item => [
          item.description,
          item.importance.toString(),
          item.action_plan || '-'
        ]),
        headStyles: { fillColor: cat.color, fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 'auto' }
        },
        margin: { left: 14, right: 14 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    } else {
      yPos += 15;
      doc.setFontSize(9);
      doc.text('No hay elementos en esta categoría', 16, yPos);
      yPos += 10;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

/**
 * Generate Business Plan Scorecard PDF
 */
export function generateBusinessPlanPDF(
  projectName: string,
  totalScore: number,
  viabilityLevel: string,
  sections: BusinessPlanSection[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('BUSINESS PLAN SCORECARD', 14, 20);
  doc.setFontSize(12);
  doc.text(projectName, 14, 28);

  // Score summary
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('Puntuación Global:', 14, 50);
  
  const scoreColor = totalScore >= 70 ? [34, 197, 94] : totalScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(...scoreColor as [number, number, number]);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${totalScore.toFixed(0)}%`, 70, 52);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nivel de Viabilidad: ${viabilityLevel || 'En evaluación'}`, 14, 62);

  // Sections table
  autoTable(doc, {
    startY: 75,
    head: [['#', 'Sección', 'Peso', 'Puntuación', 'Estado']],
    body: sections.map(s => {
      const score = (s.section_score / s.section_max_score) * 100;
      const status = score >= 70 ? '✓ Bueno' : score >= 50 ? '⚠ Aceptable' : '✗ Mejorar';
      return [
        s.section_number.toString(),
        s.section_name,
        `${(s.section_weight * 100).toFixed(0)}%`,
        `${score.toFixed(0)}%`,
        status
      ];
    }),
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 35, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

/**
 * Generate Financial Statements PDF
 */
export function generateFinancialStatementsPDF(
  planName: string,
  years: number[],
  accounts: FinancialPlanAccount[],
  ratios: FinancialPlanRatio[]
) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('ESTADOS FINANCIEROS PROYECTADOS', 14, 18);
  doc.setFontSize(11);
  doc.text(`${planName} | ${years[0]} - ${years[years.length - 1]}`, 14, 25);

  const getAmount = (code: string, year: number) => {
    return accounts.find(a => a.account_code === code && a.year === year)?.amount || 0;
  };

  // Balance Sheet
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BALANCE DE SITUACIÓN', 14, 42);

  const balanceRows: any[][] = [];
  const assetCodes = [
    { code: '20', name: 'Inmovilizado Intangible' },
    { code: '21', name: 'Inmovilizado Material' },
    { code: '30', name: 'Existencias' },
    { code: '40', name: 'Deudores Comerciales' },
    { code: '57', name: 'Tesorería' }
  ];

  assetCodes.forEach(acc => {
    const row = [acc.name];
    years.forEach(year => row.push(getAmount(acc.code, year).toLocaleString()));
    balanceRows.push(row);
  });

  autoTable(doc, {
    startY: 46,
    head: [['Cuenta', ...years.map(y => y.toString())]],
    body: balanceRows,
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: pageWidth / 2 + 5 },
    tableWidth: pageWidth / 2 - 20
  });

  // Ratios
  doc.setFont('helvetica', 'bold');
  doc.text('RATIOS FINANCIEROS', pageWidth / 2 + 5, 42);

  const ratioKeys = [...new Set(ratios.map(r => r.ratio_key))];
  const ratioRows = ratioKeys.map(key => {
    const row = [ratios.find(r => r.ratio_key === key)?.ratio_name || key];
    years.forEach(year => {
      const ratio = ratios.find(r => r.ratio_key === key && r.year === year);
      row.push(ratio?.ratio_value?.toFixed(2) || '-');
    });
    return row;
  });

  autoTable(doc, {
    startY: 46,
    head: [['Ratio', ...years.map(y => y.toString())]],
    body: ratioRows,
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: pageWidth / 2 + 5, right: 14 },
    tableWidth: pageWidth / 2 - 20
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

/**
 * Generate Viability Analysis PDF
 */
export function generateViabilityPDF(
  planName: string,
  scenarios: FinancialScenario[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('ANÁLISIS DE VIABILIDAD', 14, 20);
  doc.setFontSize(12);
  doc.text(planName, 14, 28);

  // Summary metrics
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Escenarios', 14, 50);

  const avgNPV = scenarios.reduce((sum, s) => sum + (s.npv || 0), 0) / scenarios.length;
  const avgIRR = scenarios.reduce((sum, s) => sum + (s.irr || 0), 0) / scenarios.length;
  const avgPayback = scenarios.reduce((sum, s) => sum + (s.payback_period || 0), 0) / scenarios.length;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`VAN Promedio: ${avgNPV.toLocaleString()} €`, 14, 60);
  doc.text(`TIR Promedio: ${(avgIRR * 100).toFixed(1)}%`, 14, 68);
  doc.text(`Payback Promedio: ${avgPayback.toFixed(1)} años`, 14, 76);

  // Scenarios table
  autoTable(doc, {
    startY: 90,
    head: [['Escenario', 'Tipo', 'VAN (€)', 'TIR (%)', 'Payback', 'Breakeven']],
    body: scenarios.map(s => [
      s.scenario_name,
      s.scenario_type === 'optimistic' ? 'Optimista' : s.scenario_type === 'pessimistic' ? 'Pesimista' : 'Realista',
      (s.npv || 0).toLocaleString(),
      s.irr ? `${(s.irr * 100).toFixed(1)}%` : '-',
      s.payback_period ? `${s.payback_period.toFixed(1)} años` : '-',
      s.breakeven_year ? `Año ${s.breakeven_year}` : '-'
    ]),
    headStyles: { fillColor: PRIMARY_COLOR, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 }
  });

  // Recommendation
  const bestScenario = [...scenarios].sort((a, b) => (b.npv || 0) - (a.npv || 0))[0];
  const yPos = (doc as any).lastAutoTable.finalY + 20;

  doc.setFillColor(...HEADER_BG);
  doc.rect(14, yPos, pageWidth - 28, 30, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Conclusión', 18, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const conclusion = avgNPV > 0 && avgIRR > 0.1
    ? 'El proyecto presenta indicadores de viabilidad positivos en los diferentes escenarios analizados.'
    : 'Se recomienda revisar las hipótesis del modelo para mejorar los indicadores de viabilidad.';
  doc.text(conclusion, 18, yPos + 18, { maxWidth: pageWidth - 40 });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

// Helper to download or print
export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}

export function printPDF(doc: jsPDF) {
  openPrintDialogForJsPdf(doc);
}
