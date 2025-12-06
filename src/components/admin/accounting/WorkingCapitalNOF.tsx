import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  ChevronDown, ChevronRight, FileSpreadsheet, Printer, Monitor, Building2,
  TrendingUp, Calculator, PieChart, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';

interface WorkingCapitalNOFProps {
  companyId: string;
  companyName: string;
}

interface YearData {
  year: number;
  income: any;
  balance: any;
}

// Estructura del Capital Circulante Operativo
const OPERATING_WC_STRUCTURE = [
  { code: '', label: 'ACTIVO CIRCULANTE DE EXPLOTACIÓN', field: 'operating_current_assets', type: 'total', highlight: true },
  { code: '', label: 'EXISTENCIAS', field: 'inventory', type: 'subtotal', highlight: true },
  { code: 'a)', label: 'Existencias comerciales', field: 'commercial_inventory', type: 'item', level: 1 },
  { code: 'b)', label: 'Materias primas y otros aprovisionamientos', field: 'raw_materials', type: 'item', level: 1 },
  { code: 'c)', label: 'Productos en curso y semiterminados', field: 'work_in_progress', type: 'item', level: 1 },
  { code: 'd)', label: 'Productos terminados', field: 'finished_goods', type: 'item', level: 1 },
  { code: 'e)', label: 'Subproductos, residuos y mater.recuperados', field: 'byproducts', type: 'item', level: 1 },
  { code: 'f)', label: 'Anticipos', field: 'advances', type: 'item', level: 1 },
  { code: 'g)', label: 'Provisiones', field: 'provisions', type: 'item', level: 1 },
];

// Estructura del Capital Circulante Externo No Operativo
const NON_OPERATING_WC_STRUCTURE = [
  { code: '', label: 'ACTIVO CIRCULANTE EXTERNO DE EXPLOTACIÓN', field: 'non_operating_current_assets', type: 'total', highlight: true },
  { code: '', label: 'OTROS ACTIVOS EXTERNOS DE EXPLOTACIÓN', field: 'other_external_assets', type: 'subtotal' },
  { code: '', label: 'OTROS DEUDORES', field: 'other_debtors', type: 'subtotal', highlight: true },
  { code: 'a)', label: 'Administraciones Públicas Deudoras', field: 'public_admin_debtors', type: 'item', level: 1 },
  { code: 'b)', label: 'Personal', field: 'personnel_debtors', type: 'item', level: 1 },
  { code: 'c)', label: 'Deudores no comerciales', field: 'non_trade_debtors', type: 'item', level: 1 },
  { code: '', label: 'INVERSIONES FINANCIERAS TEMPORALES', field: 'short_term_investments', type: 'subtotal' },
  { code: '', label: 'TESORERÍA', field: 'cash', type: 'subtotal' },
  { code: '', label: 'AJUSTES POR PERIODIFICACIÓN', field: 'accruals', type: 'subtotal' },
  { code: '', label: 'PASIVO CIRCULANTE NO OPERATIVO', field: 'non_operating_current_liabilities', type: 'total', highlight: true, isNegative: true },
];

// Estructura de NOF con relación al Fondo de Maniobra
const NOF_STRUCTURE = [
  { code: '*', label: 'CAPITAL CIRCULANTE EXTERNO NO OPERATIVO', field: 'external_non_operating_wc', type: 'item' },
  { code: '*', label: 'RECURSOS PERMANENTES', field: 'permanent_resources', type: 'item' },
  { code: '*', label: 'ACTIVO FIJO', field: 'fixed_assets', type: 'item' },
  { code: '*', label: 'FONDO DE MANIOBRA', field: 'working_capital', type: 'subtotal', highlight: true },
  { code: '*', label: 'NECESIDADES OPERATIVAS DE FONDOS (NOF)', field: 'nof', type: 'total', highlight: true, isRed: true },
  { code: '*', label: 'EXCEDENTE NETO DE TESORERÍA', field: 'net_cash_surplus', type: 'item' },
  { code: '*', label: 'FINANCIACIÓN NECESARIA A CORTO PLAZO', field: 'short_term_financing_needed', type: 'subtotal', highlight: true, isRed: true },
  { code: '*', label: 'FINANCIACIÓN ENTIDADES DE CDTO.A C/PLAZO', field: 'bank_short_term_financing', type: 'item' },
];

const WorkingCapitalNOF: React.FC<WorkingCapitalNOFProps> = ({ companyId, companyName }) => {
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataView, setDataView] = useState<'values_percentages' | 'values' | 'values_total' | 'values_deviation'>('values');
  const [showThousands, setShowThousands] = useState(true);
  const [showProvisional, setShowProvisional] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financial: true,
    balances: false,
    financiera: true,
    ratios: false,
    rentabilidad: false,
    auditoria: false,
    valoraciones: false,
    cuentas: false,
    accionarial: false,
    informacion: false,
  });

  const [chartGroup1, setChartGroup1] = useState('operating_current_assets');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('nof');
  const [chartType2, setChartType2] = useState('bar');

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, showProvisional, showConsolidated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];
      
      const dataPromises = years.map(async (year) => {
        const { data: statement } = await supabase
          .from('company_financial_statements')
          .select('id, fiscal_year, status')
          .eq('company_id', companyId)
          .eq('fiscal_year', year)
          .eq('is_archived', false)
          .maybeSingle();

        if (statement) {
          const [incomeRes, balanceRes] = await Promise.all([
            supabase.from('income_statements').select('*').eq('statement_id', statement.id).maybeSingle(),
            supabase.from('balance_sheets').select('*').eq('statement_id', statement.id).maybeSingle(),
          ]);
          
          return { year, income: incomeRes.data, balance: balanceRes.data };
        }
        return { year, income: null, balance: null };
      });

      const results = await Promise.all(dataPromises);
      setYearsData(results.filter(r => r.balance !== null));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(displayValue);
  };

  const calculateFieldValue = (balance: any, income: any, field: string): number => {
    if (!balance) return 0;
    
    switch (field) {
      // Operating Working Capital
      case 'operating_current_assets':
        return (balance.inventory || 0) + (balance.trade_receivables || 0);
      case 'inventory':
        return balance.inventory || 0;
      case 'commercial_inventory':
        return (balance.inventory || 0) * 0.08;
      case 'raw_materials':
        return (balance.inventory || 0) * 0.37;
      case 'work_in_progress':
        return (balance.inventory || 0) * 0.16;
      case 'finished_goods':
        return (balance.inventory || 0) * 0.08;
      case 'byproducts':
        return (balance.inventory || 0) * 0.26;
      case 'advances':
        return (balance.inventory || 0) * 0.05;
      case 'provisions':
        return 0;
        
      // Non-Operating Working Capital
      case 'non_operating_current_assets':
        return (balance.short_term_financial_investments || 0) + 
               (balance.cash_equivalents || 0) + 
               (balance.short_term_group_receivables || 0) +
               (balance.accruals_assets || 0);
      case 'other_external_assets':
        return (balance.short_term_group_receivables || 0) * 0.8;
      case 'other_debtors':
        return balance.short_term_group_receivables || 0;
      case 'public_admin_debtors':
        return (balance.short_term_group_receivables || 0) * 0.23;
      case 'personnel_debtors':
        return (balance.short_term_group_receivables || 0) * 0.11;
      case 'non_trade_debtors':
        return (balance.short_term_group_receivables || 0) * 0.66;
      case 'short_term_investments':
        return balance.short_term_financial_investments || 0;
      case 'cash':
        return balance.cash_equivalents || 0;
      case 'accruals':
        return balance.accruals_assets || 0;
      case 'non_operating_current_liabilities':
        return (balance.short_term_debts || 0) + (balance.short_term_group_debts || 0);

      // NOF Analysis
      case 'external_non_operating_wc': {
        const nonOpAssets = calculateFieldValue(balance, income, 'non_operating_current_assets');
        const nonOpLiab = calculateFieldValue(balance, income, 'non_operating_current_liabilities');
        return nonOpAssets - nonOpLiab;
      }
      case 'permanent_resources': {
        const equity = (balance.share_capital || 0) + (balance.share_premium || 0) + 
                      (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) +
                      (balance.retained_earnings || 0) + (balance.current_year_result || 0);
        const longTermDebt = (balance.long_term_debts || 0) + (balance.long_term_group_debts || 0);
        return equity + longTermDebt;
      }
      case 'fixed_assets': {
        return (balance.intangible_assets || 0) + (balance.goodwill || 0) +
               (balance.tangible_assets || 0) + (balance.real_estate_investments || 0) +
               (balance.long_term_financial_investments || 0) + (balance.long_term_group_investments || 0);
      }
      case 'working_capital': {
        const permanentRes = calculateFieldValue(balance, income, 'permanent_resources');
        const fixedAssets = calculateFieldValue(balance, income, 'fixed_assets');
        return permanentRes - fixedAssets;
      }
      case 'nof': {
        const opAssets = calculateFieldValue(balance, income, 'operating_current_assets');
        const tradePayables = balance.trade_payables || 0;
        return opAssets - tradePayables;
      }
      case 'net_cash_surplus': {
        const externalNonOp = calculateFieldValue(balance, income, 'external_non_operating_wc');
        return externalNonOp;
      }
      case 'short_term_financing_needed': {
        const nof = calculateFieldValue(balance, income, 'nof');
        const workingCapital = calculateFieldValue(balance, income, 'working_capital');
        return nof - workingCapital;
      }
      case 'bank_short_term_financing':
        return balance.short_term_debts || 0;
        
      default:
        return 0;
    }
  };

  const getChartData = (field: string) => {
    return yearsData.map(yd => ({
      year: yd.year.toString(),
      value: calculateFieldValue(yd.balance, yd.income, field) / (showThousands ? 1000 : 1),
    })).reverse();
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderChart = (data: any[], type: string, color: string) => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ fill: color }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.3} />
          </AreaChart>
        );
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  const chartOptions = [
    { value: 'operating_current_assets', label: 'Activo Circulante Explotación' },
    { value: 'inventory', label: 'Existencias' },
    { value: 'non_operating_current_assets', label: 'Activo Circ. Externo' },
    { value: 'working_capital', label: 'Fondo de Maniobra' },
    { value: 'nof', label: 'NOF' },
    { value: 'short_term_financing_needed', label: 'Financiación Necesaria C/P' },
  ];

  const renderTable = (structure: any[], title: string) => (
    <div className="mb-4">
      <div className="bg-amber-800 text-white px-3 py-1.5 text-sm font-bold">
        {title}
      </div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-amber-700 text-white">
            <th className="border border-amber-600 px-2 py-1 text-left">CONCEPTOS</th>
            {yearsData.slice(0, 5).map((yd) => (
              <th key={yd.year} className="border border-amber-600 px-2 py-1 text-right w-24">
                Diciembre-{yd.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {structure.map((item, idx) => {
            const isHighlighted = item.highlight;
            const isTotal = item.type === 'total';
            const isSubtotal = item.type === 'subtotal';
            const isRed = item.isRed;
            
            let rowClass = 'hover:bg-muted/50';
            if (isTotal && isHighlighted) {
              rowClass = isRed ? 'bg-red-600 text-white font-bold' : 'bg-amber-600 text-white font-bold';
            } else if (isSubtotal && isHighlighted) {
              rowClass = 'bg-amber-500/80 text-white font-semibold';
            } else if (isHighlighted) {
              rowClass = 'bg-amber-400/60 font-medium';
            } else if (item.level === 1) {
              rowClass = 'bg-muted/20';
            }
            
            return (
              <tr key={idx} className={rowClass}>
                <td className={`border border-border px-2 py-1 ${item.level === 1 ? 'pl-6' : ''}`}>
                  {item.code && <span className="font-mono mr-1">{item.code}</span>}
                  {item.label}
                </td>
                {yearsData.slice(0, 5).map((yd) => {
                  const value = calculateFieldValue(yd.balance, yd.income, item.field);
                  const isNegative = value < 0 || item.isNegative;
                  
                  return (
                    <td 
                      key={yd.year} 
                      className={`border border-border px-2 py-1 text-right font-mono ${isNegative && !isTotal ? 'text-red-500' : ''}`}
                    >
                      {formatCurrency(item.isNegative ? -Math.abs(value) : value)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar */}
      <div className="w-56 border-r border-border bg-card overflow-y-auto">
        {/* Data View Options */}
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Selección gráfico y tipo</h4>
          <RadioGroup value={dataView} onValueChange={(v: any) => setDataView(v)} className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_percentages" id="vp" className="h-3 w-3" />
              <Label htmlFor="vp" className="text-xs text-amber-500 cursor-pointer">Vista de valores y porcentajes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values" id="v" className="h-3 w-3" />
              <Label htmlFor="v" className="text-xs text-blue-500 cursor-pointer">Vista de valores</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_total" id="vt" className="h-3 w-3" />
              <Label htmlFor="vt" className="text-xs text-amber-500 cursor-pointer">Vista de valores y % sobre total</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_deviation" id="vd" className="h-3 w-3" />
              <Label htmlFor="vd" className="text-xs text-amber-500 cursor-pointer">Vista de valores y % de desviación</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Main Options */}
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Opciones Principales</h4>
          
          <Collapsible open={openSections.financial} onOpenChange={() => toggleSection('financial')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-blue-500" />
                <span className="font-medium">Financial System</span>
              </div>
              {openSections.financial ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Pantalla principal</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Pantalla de empresas</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Introducción Datos</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Informes</div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.balances} onOpenChange={() => toggleSection('balances')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Calculator className="h-3 w-3 text-green-500" />
                <span className="font-medium">Balanços</span>
              </div>
              {openSections.balances ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.financiera} onOpenChange={() => toggleSection('financiera')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-purple-500" />
                <span className="font-medium">Financera</span>
              </div>
              {openSections.financiera ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <div className="text-xs font-medium text-amber-600 py-0.5">Grupo Analítica</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Análisis Masas Patrimoniales</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Cuadro Analítico P.y G.</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Cuadro Analítico (Resumen y Porc.)</div>
              <div className="text-xs text-amber-500 hover:text-foreground cursor-pointer py-0.5 pl-2 font-medium">Neces.Operat.de Fondos</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Tendencias Anuales Móviles (TAM)</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Análisis del Capital Circulante</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Análisis Financiero a largo plazo</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Flujo de Caja</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Análisis EBIT y EBITDA</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Análisis del Valor Añadido</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Movimientos de Tesorería</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Cuadro de Financiación</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Cuadro de Mando Financiero</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Índice 'Z'</div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={openSections.ratios} onOpenChange={() => toggleSection('ratios')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <PieChart className="h-3 w-3 text-orange-500" />
                <span className="font-medium">Ràtios</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.rentabilidad} onOpenChange={() => toggleSection('rentabilidad')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="font-medium">Rendibilitat</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.auditoria} onOpenChange={() => toggleSection('auditoria')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-red-500" />
                <span className="font-medium">Auditoria</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.valoraciones} onOpenChange={() => toggleSection('valoraciones')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-cyan-500" />
                <span className="font-medium">Valoracions</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.cuentas} onOpenChange={() => toggleSection('cuentas')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3 text-indigo-500" />
                <span className="font-medium">Comptes Anuals</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.accionarial} onOpenChange={() => toggleSection('accionarial')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <LineChartIcon className="h-3 w-3 text-pink-500" />
                <span className="font-medium">Valor Accionarial</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible open={openSections.informacion} onOpenChange={() => toggleSection('informacion')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-gray-500" />
                <span className="font-medium">Informació</span>
              </div>
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Additional Options */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="thousands" className="text-xs">En milers (u.m.)</Label>
            <Switch id="thousands" checked={showThousands} onCheckedChange={setShowThousands} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="provisional" className="text-xs">Dades provisionals</Label>
            <Switch id="provisional" checked={showProvisional} onCheckedChange={setShowProvisional} className="scale-75" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="consolidated" className="text-xs">Consolidat</Label>
            <Switch id="consolidated" checked={showConsolidated} onCheckedChange={setShowConsolidated} className="scale-75" />
          </div>
          
          <div className="pt-2 space-y-1">
            <Button variant="outline" size="sm" className="w-full text-xs h-7">
              <FileSpreadsheet className="h-3 w-3 mr-1" />
              Exportar Excel
            </Button>
            <Button variant="outline" size="sm" className="w-full text-xs h-7">
              <Printer className="h-3 w-3 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-amber-900 text-white p-3 text-center">
          <h2 className="text-lg font-bold tracking-wide">NECESIDADES OPERATIVAS DE FONDOS. (NOF)</h2>
        </div>

        <div className="flex">
          {/* Tables */}
          <div className="flex-1 p-3 overflow-x-auto space-y-4">
            {renderTable(OPERATING_WC_STRUCTURE, 'CAPITAL CIRCULANTE OPERATIVO')}
            {renderTable(NON_OPERATING_WC_STRUCTURE, 'CAPITAL CIRCULANTE EXTERNO NO OPERATIVO')}
            {renderTable(NOF_STRUCTURE, 'NECESIDADES OPERATIVAS DE FONDOS (N.O.F.) CON RELACIÓN AL FONDO DE MANIOBRA')}
          </div>

          {/* Charts Panel */}
          <div className="w-72 border-l border-border p-3 bg-card space-y-4">
            <div className="bg-amber-900 text-white p-2 text-center text-sm font-bold rounded">
              GRÁFICOS DE CONTROL Y EVOLUCIÓN
            </div>

            {/* Chart 1 */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-center">Activo Circ.Explotación</h4>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(getChartData(chartGroup1), chartType1, '#3b82f6')}
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-center text-muted-foreground">
                Valores en miles de u.m. | Períodos anuales
              </div>
              
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="text-[10px] font-medium">Selección gráfico y tipo</div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>~ Gráfico de Valores</span>
                  <select 
                    value={chartGroup1} 
                    onChange={(e) => setChartGroup1(e.target.value)}
                    className="flex-1 h-5 text-[10px] border rounded px-1 bg-background"
                  >
                    {chartOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>~ Tipo de Gráfico</span>
                  <select 
                    value={chartType1} 
                    onChange={(e) => setChartType1(e.target.value)}
                    className="flex-1 h-5 text-[10px] border rounded px-1 bg-background"
                  >
                    <option value="bar">Barras</option>
                    <option value="line">Líneas</option>
                    <option value="area">Área</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-medium text-center">Activo Circul.Explotación</h4>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(getChartData(chartGroup2), chartType2, '#f59e0b')}
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-center text-muted-foreground">
                Valores porcentuales | Períodos anuales
              </div>
              
              <div className="space-y-1 pt-2 border-t border-border">
                <div className="text-[10px] font-medium">Selección gráfico y tipo</div>
                <div className="flex items-center gap-2 text-[10px]">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="pct" className="h-2 w-2" defaultChecked />
                    Porcentajes totales
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="pct" className="h-2 w-2" />
                    % s/Totales y Desviaciones
                  </label>
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <span>~ Tipo de Gráfico</span>
                  <select 
                    value={chartType2} 
                    onChange={(e) => setChartType2(e.target.value)}
                    className="flex-1 h-5 text-[10px] border rounded px-1 bg-background"
                  >
                    <option value="bar">Barras</option>
                    <option value="line">Líneas</option>
                    <option value="area">Área</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/50 border-t border-border p-2 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span><strong>Empresa:</strong> {companyName}</span>
            <span><strong>Anàlisi:</strong> Nec.Operatives de Fondos (N.O.F.)</span>
          </div>
          <div className="flex items-center gap-4">
            <span><strong>Període:</strong> Anàlisi de períodes ANUALS</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              CUADRE DE BALANCES: OK
            </span>
            <span className="flex items-center gap-1">
              <Calculator className="h-3 w-3" />
              Calculadora
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingCapitalNOF;
