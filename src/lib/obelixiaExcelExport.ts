/**
 * ObelixIA Excel Export Utility
 * Exporta cifras financieras del Plan de Negocio y Estudio de Viabilidad a Excel
 */

import * as XLSX from 'xlsx';

export interface ObelixiaFinancialData {
  companyName: string;
  // Proyecciones por año
  years: number[];
  revenue: number[];
  costs: number[];
  ebitda: number[];
  netIncome: number[];
  cashFlow: number[];
  
  // Métricas principales
  metrics: {
    npv: number;
    irr: number;
    paybackMonths: number;
    roi: number;
    breakEvenYear: number;
    grossMargin: number;
    netMargin: number;
    ltvcac: number;
  };
  
  // Inversión y financiación
  investment: {
    initial: number;
    seedRound: number;
    seriesA: number;
    totalRequired: number;
  };
  
  // Estructura de costes
  costStructure: {
    infrastructure: number;
    development: number;
    commercial: number;
    operations: number;
    administration: number;
  };
  
  // Ingresos por tipo
  revenueStreams: {
    subscriptions: number;
    licenses: number;
    implementation: number;
    training: number;
    support: number;
    modules: number;
    api: number;
  };
}

// Datos financieros completos de ObelixIA
export const obelixiaFinancialData: ObelixiaFinancialData = {
  companyName: 'ObelixIA Technologies S.L.',
  years: [2025, 2026, 2027, 2028, 2029],
  revenue: [450000, 980000, 2500000, 4200000, 6800000],
  costs: [380000, 720000, 1625000, 2520000, 3740000],
  ebitda: [70000, 260000, 875000, 1680000, 3060000],
  netIncome: [45000, 195000, 656250, 1260000, 2295000],
  cashFlow: [85000, 245000, 785000, 1450000, 2650000],
  
  metrics: {
    npv: 1850000,
    irr: 42.5,
    paybackMonths: 24,
    roi: 320,
    breakEvenYear: 2026,
    grossMargin: 72,
    netMargin: 34,
    ltvcac: 3.5
  },
  
  investment: {
    initial: 250000,
    seedRound: 500000,
    seriesA: 2000000,
    totalRequired: 2750000
  },
  
  costStructure: {
    infrastructure: 15,
    development: 35,
    commercial: 25,
    operations: 15,
    administration: 10
  },
  
  revenueStreams: {
    subscriptions: 40,
    licenses: 25,
    implementation: 15,
    training: 5,
    support: 8,
    modules: 5,
    api: 2
  }
};

/**
 * Exporta el Plan de Negocio a Excel
 */
export function exportBusinessPlanToExcel(data: ObelixiaFinancialData = obelixiaFinancialData): void {
  const workbook = XLSX.utils.book_new();
  
  // === HOJA 1: Proyecciones Financieras ===
  const projectionsData: (string | number)[][] = [
    ['PROYECCIONES FINANCIERAS - ' + data.companyName],
    [],
    ['Concepto', ...data.years.map(y => y.toString())],
    ['Ingresos (EUR)', ...data.revenue],
    ['Costes (EUR)', ...data.costs],
    ['EBITDA (EUR)', ...data.ebitda],
    ['Beneficio Neto (EUR)', ...data.netIncome],
    ['Cash Flow (EUR)', ...data.cashFlow],
    [],
    ['CRECIMIENTO INTERANUAL (%)'],
    ['Crecimiento Ingresos', 
      '-', 
      ...data.revenue.slice(1).map((r, i) => ((r - data.revenue[i]) / data.revenue[i] * 100).toFixed(1))
    ],
    ['Crecimiento EBITDA', 
      '-', 
      ...data.ebitda.slice(1).map((e, i) => ((e - data.ebitda[i]) / data.ebitda[i] * 100).toFixed(1))
    ],
  ];
  
  const projectionsSheet = XLSX.utils.aoa_to_sheet(projectionsData);
  projectionsSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, projectionsSheet, 'Proyecciones');
  
  // === HOJA 2: Métricas Clave ===
  const metricsData: (string | number)[][] = [
    ['METRICAS FINANCIERAS CLAVE'],
    [],
    ['Metrica', 'Valor', 'Unidad'],
    ['VAN (NPV)', data.metrics.npv, 'EUR'],
    ['TIR (IRR)', data.metrics.irr, '%'],
    ['Payback Period', data.metrics.paybackMonths, 'meses'],
    ['ROI', data.metrics.roi, '%'],
    ['Ano Break-Even', data.metrics.breakEvenYear, 'ano'],
    ['Margen Bruto', data.metrics.grossMargin, '%'],
    ['Margen Neto', data.metrics.netMargin, '%'],
    ['Ratio LTV/CAC', data.metrics.ltvcac, 'x'],
  ];
  
  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData);
  metricsSheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metricas');
  
  // === HOJA 3: Inversión y Financiación ===
  const investmentData: (string | number)[][] = [
    ['INVERSION Y FINANCIACION'],
    [],
    ['Ronda', 'Importe (EUR)', '% del Total'],
    ['Inversion Inicial (Fundadores)', data.investment.initial, (data.investment.initial / data.investment.totalRequired * 100).toFixed(1)],
    ['Ronda Seed', data.investment.seedRound, (data.investment.seedRound / data.investment.totalRequired * 100).toFixed(1)],
    ['Serie A', data.investment.seriesA, (data.investment.seriesA / data.investment.totalRequired * 100).toFixed(1)],
    [],
    ['TOTAL REQUERIDO', data.investment.totalRequired, '100%'],
  ];
  
  const investmentSheet = XLSX.utils.aoa_to_sheet(investmentData);
  investmentSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, investmentSheet, 'Inversion');
  
  // === HOJA 4: Estructura de Costes ===
  const costData: (string | number)[][] = [
    ['ESTRUCTURA DE COSTES (% sobre ingresos)'],
    [],
    ['Categoria', '% Ingresos', 'Descripcion'],
    ['Infraestructura Cloud', data.costStructure.infrastructure, 'Supabase, CDN, servicios IA'],
    ['Desarrollo y Producto', data.costStructure.development, 'Equipo tecnico, herramientas'],
    ['Comercial y Marketing', data.costStructure.commercial, 'Ventas, eventos, contenido'],
    ['Operaciones', data.costStructure.operations, 'Soporte, formacion, servicios'],
    ['Administracion', data.costStructure.administration, 'G&A, legal, compliance'],
    [],
    ['TOTAL', Object.values(data.costStructure).reduce((a, b) => a + b, 0), ''],
  ];
  
  const costSheet = XLSX.utils.aoa_to_sheet(costData);
  costSheet['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, costSheet, 'Costes');
  
  // === HOJA 5: Fuentes de Ingresos ===
  const revenueData: (string | number)[][] = [
    ['FUENTES DE INGRESOS (% del total)'],
    [],
    ['Fuente', '% Total', 'Descripcion'],
    ['Suscripciones por Usuario', data.revenueStreams.subscriptions, 'Licencias mensuales/anuales'],
    ['Licencias Enterprise', data.revenueStreams.licenses, 'Por oficina, usuarios ilimitados'],
    ['Servicios Implementacion', data.revenueStreams.implementation, 'Despliegue, migracion'],
    ['Formacion y Certificacion', data.revenueStreams.training, 'Programas capacitacion'],
    ['Soporte Premium', data.revenueStreams.support, 'SLA 24/7'],
    ['Modulos Adicionales', data.revenueStreams.modules, 'Funcionalidades avanzadas'],
    ['API y Consumo', data.revenueStreams.api, 'Facturacion por uso'],
    [],
    ['TOTAL', Object.values(data.revenueStreams).reduce((a, b) => a + b, 0), ''],
  ];
  
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
  revenueSheet['!cols'] = [{ wch: 28 }, { wch: 10 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Ingresos');
  
  // Descargar
  const filename = `ObelixIA_Plan_Negocio_Financiero_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta el Estudio de Viabilidad a Excel
 */
export function exportViabilityStudyToExcel(data: ObelixiaFinancialData = obelixiaFinancialData): void {
  const workbook = XLSX.utils.book_new();
  
  // === HOJA 1: Resumen Viabilidad ===
  const summaryData: (string | number)[][] = [
    ['ESTUDIO DE VIABILIDAD - ' + data.companyName],
    [],
    ['INDICADORES DE VIABILIDAD', 'Valor', 'Benchmark', 'Estado'],
    ['VAN (Valor Actual Neto)', data.metrics.npv + ' EUR', '> 0 EUR', 'VIABLE'],
    ['TIR (Tasa Interna Retorno)', data.metrics.irr + '%', '> 15%', 'EXCELENTE'],
    ['Periodo Recuperacion', data.metrics.paybackMonths + ' meses', '< 36 meses', 'VIABLE'],
    ['ROI Proyectado', data.metrics.roi + '%', '> 100%', 'EXCELENTE'],
    ['Ratio LTV/CAC', data.metrics.ltvcac + 'x', '> 3x', 'OPTIMO'],
    [],
    ['CONCLUSION', '', '', ''],
    ['Viabilidad General', '82%', '> 70%', 'PROYECTO VIABLE'],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
  
  // === HOJA 2: Proyecciones ===
  const projectionsData: (string | number)[][] = [
    ['PROYECCIONES FINANCIERAS A 5 ANOS'],
    [],
    ['Ano', ...data.years.map(y => y.toString())],
    ['Ingresos', ...data.revenue.map(v => v + ' EUR')],
    ['Costes', ...data.costs.map(v => v + ' EUR')],
    ['EBITDA', ...data.ebitda.map(v => v + ' EUR')],
    ['Beneficio Neto', ...data.netIncome.map(v => v + ' EUR')],
    ['Cash Flow Libre', ...data.cashFlow.map(v => v + ' EUR')],
    [],
    ['MARGENES (%)'],
    ['Margen EBITDA', ...data.ebitda.map((e, i) => (e / data.revenue[i] * 100).toFixed(1) + '%')],
    ['Margen Neto', ...data.netIncome.map((n, i) => (n / data.revenue[i] * 100).toFixed(1) + '%')],
  ];
  
  const projectionsSheet = XLSX.utils.aoa_to_sheet(projectionsData);
  projectionsSheet['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, projectionsSheet, 'Proyecciones');
  
  // === HOJA 3: Análisis de Sensibilidad ===
  const sensitivityData: (string | number | string)[][] = [
    ['ANALISIS DE SENSIBILIDAD'],
    [],
    ['Escenario', 'VAN (EUR)', 'TIR (%)', 'Payback (meses)', 'Viabilidad'],
    ['Pesimista (-20% ingresos)', Math.round(data.metrics.npv * 0.6), (data.metrics.irr * 0.7).toFixed(1), 32, 'VIABLE CON CONDICIONES'],
    ['Base', data.metrics.npv, data.metrics.irr, data.metrics.paybackMonths, 'VIABLE'],
    ['Optimista (+20% ingresos)', Math.round(data.metrics.npv * 1.4), (data.metrics.irr * 1.25).toFixed(1), 18, 'MUY VIABLE'],
    [],
    ['FACTORES DE RIESGO'],
    [],
    ['Factor', 'Probabilidad', 'Impacto', 'Mitigacion'],
    ['Competencia agresiva', 'Media', 'Alto', 'Diferenciacion IA, fidelizacion'],
    ['Cambios regulatorios', 'Baja', 'Medio', 'Equipo compliance dedicado'],
    ['Retrasos desarrollo', 'Media', 'Medio', 'Metodologia agil, sprints cortos'],
    ['Rotacion talento', 'Baja', 'Alto', 'Cultura remoto, equity'],
  ];
  
  const sensitivitySheet = XLSX.utils.aoa_to_sheet(sensitivityData);
  sensitivitySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, sensitivitySheet, 'Sensibilidad');
  
  // === HOJA 4: DAFO ===
  const dafoData: (string | number)[][] = [
    ['ANALISIS DAFO'],
    [],
    ['FORTALEZAS'],
    ['1. Tecnologia IA diferenciadora (Gemini 2.5 nativo)'],
    ['2. Equipo con experiencia en banca'],
    ['3. Arquitectura cloud-native moderna'],
    ['4. Enfoque compliance-first europeo'],
    [],
    ['DEBILIDADES'],
    ['1. Empresa nueva sin track record'],
    ['2. Equipo pequeno inicial'],
    ['3. Dependencia de infraestructura terceros'],
    [],
    ['OPORTUNIDADES'],
    ['1. Regulacion DORA (enero 2025)'],
    ['2. Demanda IA en banca'],
    ['3. Consolidacion bancaria'],
    ['4. Open Banking PSD2/PSD3'],
    [],
    ['AMENAZAS'],
    ['1. Competidores grandes (Salesforce, Microsoft)'],
    ['2. Cambios regulatorios imprevistos'],
    ['3. Escasez talento tech'],
  ];
  
  const dafoSheet = XLSX.utils.aoa_to_sheet(dafoData);
  dafoSheet['!cols'] = [{ wch: 55 }];
  XLSX.utils.book_append_sheet(workbook, dafoSheet, 'DAFO');
  
  // Descargar
  const filename = `ObelixIA_Estudio_Viabilidad_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * Exporta todos los datos financieros en un único Excel
 */
export function exportAllFinancialsToExcel(data: ObelixiaFinancialData = obelixiaFinancialData): void {
  const workbook = XLSX.utils.book_new();
  
  // Dashboard resumen
  const dashboardData: (string | number)[][] = [
    ['OBELIXIA TECHNOLOGIES - RESUMEN FINANCIERO EJECUTIVO'],
    [],
    ['Generado el:', new Date().toLocaleDateString('es-ES')],
    [],
    ['METRICAS CLAVE'],
    ['VAN', data.metrics.npv + ' EUR'],
    ['TIR', data.metrics.irr + '%'],
    ['Payback', data.metrics.paybackMonths + ' meses'],
    ['ROI', data.metrics.roi + '%'],
    [],
    ['NECESIDADES FINANCIACION'],
    ['Inversion total requerida', data.investment.totalRequired + ' EUR'],
    [],
    ['PROYECCION ANO 5 (2029)'],
    ['Ingresos', data.revenue[4] + ' EUR'],
    ['EBITDA', data.ebitda[4] + ' EUR'],
    ['Margen EBITDA', (data.ebitda[4] / data.revenue[4] * 100).toFixed(1) + '%'],
  ];
  
  const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
  dashboardSheet['!cols'] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'Dashboard');
  
  // Proyecciones completas
  const projectionsData: (string | number)[][] = [
    ['PROYECCIONES FINANCIERAS DETALLADAS'],
    [],
    ['Concepto', ...data.years.map(y => y.toString())],
    ['Ingresos', ...data.revenue],
    ['Costes Operativos', ...data.costs],
    ['EBITDA', ...data.ebitda],
    ['Beneficio Neto', ...data.netIncome],
    ['Cash Flow Libre', ...data.cashFlow],
    [],
    ['Cash Flow Acumulado', 
      ...data.cashFlow.reduce((acc: number[], cf, i) => {
        acc.push(i === 0 ? cf : acc[i-1] + cf);
        return acc;
      }, [])
    ],
  ];
  
  const projectionsSheet = XLSX.utils.aoa_to_sheet(projectionsData);
  projectionsSheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(workbook, projectionsSheet, 'Proyecciones');
  
  // Descargar
  const filename = `ObelixIA_Datos_Financieros_Completos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
