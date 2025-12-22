import * as XLSX from 'xlsx';
import { FinancialPlanAccount, FinancialScenario, FinancialPlanRatio } from '@/hooks/useStrategicPlanning';

/**
 * Export financial statements to Excel
 */
export function exportFinancialStatementsToExcel(
  planName: string,
  accounts: FinancialPlanAccount[],
  ratios: FinancialPlanRatio[],
  years: number[]
) {
  const workbook = XLSX.utils.book_new();

  // Balance Sheet
  const balanceData: any[][] = [
    ['BALANCE DE SITUACIÓN', ...years.map(y => y.toString())],
    [],
    ['ACTIVO NO CORRIENTE'],
  ];
  
  const assetCodes = ['20', '21', '22', '23'];
  const assetNames: Record<string, string> = {
    '20': 'Inmovilizado Intangible',
    '21': 'Inmovilizado Material',
    '22': 'Inversiones Inmobiliarias',
    '23': 'Inversiones Financieras LP'
  };
  
  assetCodes.forEach(code => {
    const row: (string | number)[] = [assetNames[code]];
    years.forEach(year => {
      const account = accounts.find(a => a.account_code === code && a.year === year);
      row.push(account?.amount || 0);
    });
    balanceData.push(row);
  });

  balanceData.push([]);
  balanceData.push(['ACTIVO CORRIENTE']);
  
  const currentAssetCodes = ['30', '40', '57'];
  const currentAssetNames: Record<string, string> = {
    '30': 'Existencias',
    '40': 'Deudores Comerciales',
    '57': 'Tesorería'
  };
  
  currentAssetCodes.forEach(code => {
    const row: (string | number)[] = [currentAssetNames[code]];
    years.forEach(year => {
      const account = accounts.find(a => a.account_code === code && a.year === year);
      row.push(account?.amount || 0);
    });
    balanceData.push(row);
  });

  const balanceSheet = XLSX.utils.aoa_to_sheet(balanceData);
  XLSX.utils.book_append_sheet(workbook, balanceSheet, 'Balance');

  // P&L
  const plData: any[][] = [
    ['CUENTA DE RESULTADOS', ...years.map(y => y.toString())],
    [],
    ['INGRESOS'],
  ];
  
  const incomeCodes = ['70', '71', '73', '75'];
  const incomeNames: Record<string, string> = {
    '70': 'Importe Neto Cifra Negocios',
    '71': 'Variación de Existencias',
    '73': 'Trabajos para Inmovilizado',
    '75': 'Otros Ingresos'
  };
  
  incomeCodes.forEach(code => {
    const row: (string | number)[] = [incomeNames[code]];
    years.forEach(year => {
      const account = accounts.find(a => a.account_code === code && a.year === year);
      row.push(account?.amount || 0);
    });
    plData.push(row);
  });

  plData.push([]);
  plData.push(['GASTOS']);
  
  const expenseCodes = ['60', '62', '64', '68', '65', '66', '63'];
  const expenseNames: Record<string, string> = {
    '60': 'Aprovisionamientos',
    '62': 'Servicios Exteriores',
    '64': 'Gastos de Personal',
    '68': 'Amortización',
    '65': 'Otros Gastos',
    '66': 'Gastos Financieros',
    '63': 'Impuesto sobre Beneficios'
  };
  
  expenseCodes.forEach(code => {
    const row: (string | number)[] = [expenseNames[code]];
    years.forEach(year => {
      const account = accounts.find(a => a.account_code === code && a.year === year);
      row.push(account?.amount || 0);
    });
    plData.push(row);
  });

  const plSheet = XLSX.utils.aoa_to_sheet(plData);
  XLSX.utils.book_append_sheet(workbook, plSheet, 'PyG');

  // Ratios
  const ratiosData: any[][] = [
    ['RATIOS FINANCIEROS', ...years.map(y => y.toString())],
    [],
  ];

  const ratioKeys = [...new Set(ratios.map(r => r.ratio_key))];
  ratioKeys.forEach(key => {
    const row = [ratios.find(r => r.ratio_key === key)?.ratio_name || key];
    years.forEach(year => {
      const ratio = ratios.find(r => r.ratio_key === key && r.year === year);
      row.push(ratio?.ratio_value?.toFixed(2) || 'N/A');
    });
    ratiosData.push(row);
  });

  const ratiosSheet = XLSX.utils.aoa_to_sheet(ratiosData);
  XLSX.utils.book_append_sheet(workbook, ratiosSheet, 'Ratios');

  // Download
  XLSX.writeFile(workbook, `${planName.replace(/\s+/g, '_')}_Estados_Financieros.xlsx`);
}

/**
 * Export scenarios to Excel
 */
export function exportScenariosToExcel(
  planName: string,
  scenarios: FinancialScenario[],
  years: number[]
) {
  const workbook = XLSX.utils.book_new();

  // Comparison data
  const comparisonData: any[][] = [
    ['COMPARATIVA DE ESCENARIOS'],
    [],
    ['Escenario', 'Tipo', 'VAN (€)', 'TIR (%)', 'Payback (años)', 'Breakeven (año)'],
  ];

  scenarios.forEach(s => {
    comparisonData.push([
      s.scenario_name,
      s.scenario_type,
      s.npv || 0,
      s.irr ? (s.irr * 100).toFixed(1) : 'N/A',
      s.payback_period?.toFixed(1) || 'N/A',
      s.breakeven_year || 'N/A'
    ]);
  });

  const comparisonSheet = XLSX.utils.aoa_to_sheet(comparisonData);
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, 'Comparativa');

  // Variables by scenario
  const variablesData: any[][] = [
    ['VARIABLES DE ESCENARIOS'],
    [],
    ['Escenario', 'Crecimiento Ingresos (%)', 'Reducción Costes (%)', 'Nivel Inversión (%)', 'Expansión Mercado (%)'],
  ];

  scenarios.forEach(s => {
    const vars = s.variables as Record<string, number>;
    variablesData.push([
      s.scenario_name,
      vars?.revenue_growth || 0,
      vars?.cost_reduction || 0,
      vars?.investment_level || 0,
      vars?.market_expansion || 0
    ]);
  });

  const variablesSheet = XLSX.utils.aoa_to_sheet(variablesData);
  XLSX.utils.book_append_sheet(workbook, variablesSheet, 'Variables');

  // Download
  XLSX.writeFile(workbook, `${planName.replace(/\s+/g, '_')}_Escenarios.xlsx`);
}

/**
 * Export DAFO to Excel
 */
export function exportDafoToExcel(
  analysisName: string,
  items: { category: string; description: string; importance: number; action_plan: string | null }[]
) {
  const workbook = XLSX.utils.book_new();

  const categories = ['strengths', 'weaknesses', 'opportunities', 'threats'];
  const categoryNames: Record<string, string> = {
    strengths: 'Fortalezas',
    weaknesses: 'Debilidades',
    opportunities: 'Oportunidades',
    threats: 'Amenazas'
  };

  const dafoData: any[][] = [
    ['ANÁLISIS DAFO', analysisName],
    [],
  ];

  categories.forEach(cat => {
    dafoData.push([categoryNames[cat].toUpperCase()]);
    dafoData.push(['Descripción', 'Importancia', 'Plan de Acción']);
    
    const catItems = items.filter(i => i.category === cat);
    catItems.forEach(item => {
      dafoData.push([item.description, item.importance, item.action_plan || '']);
    });
    dafoData.push([]);
  });

  const dafoSheet = XLSX.utils.aoa_to_sheet(dafoData);
  XLSX.utils.book_append_sheet(workbook, dafoSheet, 'DAFO');

  XLSX.writeFile(workbook, `${analysisName.replace(/\s+/g, '_')}_DAFO.xlsx`);
}
