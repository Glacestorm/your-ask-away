import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  ChevronDown, ChevronRight, FileSpreadsheet, Printer, Monitor, Building2,
  TrendingUp, TrendingDown, Calculator, PieChart, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';

interface AnalyticalPLChartProps {
  companyId: string;
  companyName: string;
}

interface YearData {
  year: number;
  income: any;
  balance: any;
}

// Estructura analítica del PGC Andorra para Pérdidas y Ganancias
const ANALYTICAL_PL_STRUCTURE = [
  { code: '70', label: '+ Ventas netas y prestación de servicios', field: 'net_turnover', type: 'income', level: 0, highlight: true },
  { code: '71', label: '+/- Variac.de existenc.de prod.term.y en curso de fabr.', field: 'inventory_variation', type: 'income', level: 1 },
  { code: '73', label: '+ Trabajos realizados por la empresa para su inmov.', field: 'capitalized_work', type: 'income', level: 1 },
  { code: '', label: '= VALOR DE LA PRODUCCIÓN', field: 'production_value', type: 'subtotal', level: 0, isTotal: true },
  { code: '(60,61)', label: '- Compras Totales', field: 'supplies', type: 'expense', level: 1 },
  { code: '75', label: '+ Otros ingresos de explotación', field: 'other_operating_income', type: 'income', level: 1 },
  { code: '(62,63,65,69)', label: '- Otros gastos de explotación', field: 'other_operating_expenses', type: 'expense', level: 1 },
  { code: '(62)', label: '- Servicios exteriores', field: 'external_services', type: 'expense', level: 2 },
  { code: '(63)', label: '- Tributos', field: 'taxes', type: 'expense', level: 2 },
  { code: '(65,69)', label: '- Provisiones', field: 'provisions', type: 'expense', level: 2 },
  { code: '(651,6510,6511,659)', label: '- Gastos diversos', field: 'other_expenses', type: 'expense', level: 2 },
  { code: '', label: '= VALOR AÑADIDO DE LA EMPRESA', field: 'added_value', type: 'subtotal', level: 0, isTotal: true },
  { code: '(64)', label: '- Gastos de personal', field: 'personnel_expenses', type: 'expense', level: 1 },
  { code: '', label: '= RESULTADO BRUTO DE LA EXPLOTACIÓN', field: 'gross_operating_result', type: 'subtotal', level: 0, isTotal: true },
  { code: '(68)', label: '- Amortizaciones', field: 'depreciation', type: 'expense', level: 1 },
  { code: '', label: '= RESULTADO NETO DE LA EXPLOTACIÓN', field: 'net_operating_result', type: 'subtotal', level: 0, isTotal: true, highlight: true },
  { code: '76', label: '+ Ingresos financieros', field: 'financial_income', type: 'income', level: 1 },
  { code: '(66)', label: '- Gastos financieros', field: 'financial_expenses', type: 'expense', level: 1 },
  { code: '74,77,79', label: '+/- Otros ingresos y gastos de carácter financiero', field: 'other_financial', type: 'mixed', level: 1 },
  { code: '', label: '= RESULTADO DE LAS ACTIVIDADES ORDINARIAS', field: 'ordinary_result', type: 'subtotal', level: 0, isTotal: true },
  { code: '76', label: '+/- Variación de valor razonable en instrum.financieros', field: 'fair_value_changes', type: 'mixed', level: 1 },
  { code: '765,766,796,797', label: '+/- Deterioro y result.por enajenac.de instrum.financ.', field: 'impairment_financial', type: 'mixed', level: 1 },
  { code: '768,(668)', label: '+/- Diferencias de cambio', field: 'exchange_differences', type: 'mixed', level: 1 },
  { code: '', label: '= RESULTADO ANTES DE IMPUESTOS', field: 'result_before_tax', type: 'subtotal', level: 0, isTotal: true, highlight: true },
  { code: '(630,633,638)', label: '+/- Impuesto sobre beneficios', field: 'corporate_tax', type: 'expense', level: 1 },
  { code: '', label: '= RESULTADO DEL EJERCICIO', field: 'net_result', type: 'total', level: 0, isTotal: true, highlight: true, isFinal: true },
];

const AnalyticalPLChart: React.FC<AnalyticalPLChartProps> = ({ companyId, companyName }) => {
  const { t } = useLanguage();
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [planType, setPlanType] = useState<'complete' | 'simplified'>('complete');
  const [dataView, setDataView] = useState<'values_percentages' | 'values' | 'values_total' | 'values_deviation'>('values_percentages');
  const [showThousands, setShowThousands] = useState(true);
  const [showProvisional, setShowProvisional] = useState(false);
  const [showConsolidated, setShowConsolidated] = useState(false);
  
  // Sidebar sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    financial: true,
    balances: false,
    financiera: false,
    ratios: false,
    rentabilidad: false,
    auditoria: false,
    valoraciones: false,
    cuentas: false,
    accionarial: false,
    informacion: false,
  });

  // Charts
  const [chartGroup1, setChartGroup1] = useState('production_value');
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('net_operating_result');
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
      setYearsData(results.filter(r => r.income !== null));
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

  const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  const calculateFieldValue = (income: any, field: string): number => {
    if (!income) return 0;
    
    switch (field) {
      case 'net_turnover':
        return income.net_turnover || 0;
      case 'inventory_variation':
        return income.inventory_variation || 0;
      case 'capitalized_work':
        return income.capitalized_work || 0;
      case 'production_value':
        return (income.net_turnover || 0) + (income.inventory_variation || 0) + (income.capitalized_work || 0);
      case 'supplies':
        return -(income.supplies || 0);
      case 'other_operating_income':
        return (income.other_operating_income || 0) + (income.operating_grants || 0);
      case 'other_operating_expenses':
        return -(income.other_operating_expenses || 0);
      case 'external_services':
        return -((income.other_operating_expenses || 0) * 0.6);
      case 'taxes':
        return -((income.other_operating_expenses || 0) * 0.15);
      case 'provisions':
        return -(income.excess_provisions || 0);
      case 'other_expenses':
        return -((income.other_operating_expenses || 0) * 0.25);
      case 'added_value': {
        const prodValue = (income.net_turnover || 0) + (income.inventory_variation || 0) + (income.capitalized_work || 0);
        return prodValue - (income.supplies || 0) + (income.other_operating_income || 0) - (income.other_operating_expenses || 0);
      }
      case 'personnel_expenses':
        return -(income.personnel_expenses || 0);
      case 'gross_operating_result': {
        const addedValue = calculateFieldValue(income, 'added_value');
        return addedValue - (income.personnel_expenses || 0);
      }
      case 'depreciation':
        return -(income.depreciation || 0);
      case 'net_operating_result': {
        const grossOp = calculateFieldValue(income, 'gross_operating_result');
        return grossOp - (income.depreciation || 0);
      }
      case 'financial_income':
        return income.financial_income || 0;
      case 'financial_expenses':
        return -(income.financial_expenses || 0);
      case 'other_financial':
        return (income.other_financial_results || 0) + (income.exchange_differences || 0);
      case 'ordinary_result': {
        const netOp = calculateFieldValue(income, 'net_operating_result');
        return netOp + (income.financial_income || 0) - (income.financial_expenses || 0) + (income.other_financial_results || 0);
      }
      case 'fair_value_changes':
        return 0;
      case 'impairment_financial':
        return -(income.impairment_financial_instruments || 0);
      case 'exchange_differences':
        return income.exchange_differences || 0;
      case 'result_before_tax': {
        const ordinaryRes = calculateFieldValue(income, 'ordinary_result');
        return ordinaryRes - (income.impairment_financial_instruments || 0) + (income.exchange_differences || 0);
      }
      case 'corporate_tax':
        return -(income.corporate_tax || 0);
      case 'net_result': {
        const beforeTax = calculateFieldValue(income, 'result_before_tax');
        return beforeTax - (income.corporate_tax || 0);
      }
      default:
        return 0;
    }
  };

  const getChartData = (field: string) => {
    return yearsData.map(yd => ({
      year: yd.year.toString(),
      value: calculateFieldValue(yd.income, field) / (showThousands ? 1000 : 1),
    })).reverse();
  };

  const getPercentageChartData = (field: string) => {
    const baseField = 'net_turnover';
    return yearsData.map(yd => {
      const baseValue = calculateFieldValue(yd.income, baseField);
      const fieldValue = calculateFieldValue(yd.income, field);
      const percentage = baseValue !== 0 ? (fieldValue / baseValue) * 100 : 0;
      return {
        year: yd.year.toString(),
        value: percentage,
      };
    }).reverse();
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

  const chartOptions = ANALYTICAL_PL_STRUCTURE.filter(item => item.isTotal || item.highlight).map(item => ({
    value: item.field,
    label: item.label.replace(/[=+-]/g, '').trim()
  }));

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
      <div className="w-64 border-r border-border bg-card overflow-y-auto">
        {/* Data View Options */}
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">Visión de datos</h4>
          <RadioGroup value={dataView} onValueChange={(v: any) => setDataView(v)} className="space-y-1">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_percentages" id="vp" className="h-3 w-3" />
              <Label htmlFor="vp" className="text-xs text-amber-500 cursor-pointer">Vista de valores y porcentajes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values" id="v" className="h-3 w-3" />
              <Label htmlFor="v" className="text-xs text-amber-500 cursor-pointer">Vista de valores</Label>
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
          
          {/* Financial System */}
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

          {/* Balances */}
          <Collapsible open={openSections.balances} onOpenChange={() => toggleSection('balances')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Calculator className="h-3 w-3 text-green-500" />
                <span className="font-medium">Balanços</span>
              </div>
              {openSections.balances ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Balanç de Situació</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5">Compte de Resultats</div>
            </CollapsibleContent>
          </Collapsible>

          {/* Financiera */}
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
              <div className="text-xs text-amber-500 hover:text-foreground cursor-pointer py-0.5 pl-2 font-medium">Cuadro Analítico P.y G.</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Cuadro Analítico (Resumen y Porc.)</div>
              <div className="text-xs text-muted-foreground hover:text-foreground cursor-pointer py-0.5 pl-2">Neces.Operat.de Fondos</div>
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

          {/* Ratios */}
          <Collapsible open={openSections.ratios} onOpenChange={() => toggleSection('ratios')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <PieChart className="h-3 w-3 text-orange-500" />
                <span className="font-medium">Ràtios</span>
              </div>
              {openSections.ratios ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Rentabilidad */}
          <Collapsible open={openSections.rentabilidad} onOpenChange={() => toggleSection('rentabilidad')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="font-medium">Rendibilitat</span>
              </div>
              {openSections.rentabilidad ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Auditoria */}
          <Collapsible open={openSections.auditoria} onOpenChange={() => toggleSection('auditoria')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-red-500" />
                <span className="font-medium">Auditoria</span>
              </div>
              {openSections.auditoria ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Valoraciones */}
          <Collapsible open={openSections.valoraciones} onOpenChange={() => toggleSection('valoraciones')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3 text-cyan-500" />
                <span className="font-medium">Valoracions</span>
              </div>
              {openSections.valoraciones ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Cuentas Anuales */}
          <Collapsible open={openSections.cuentas} onOpenChange={() => toggleSection('cuentas')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <FileSpreadsheet className="h-3 w-3 text-indigo-500" />
                <span className="font-medium">Comptes Anuals</span>
              </div>
              {openSections.cuentas ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Valor Accionarial */}
          <Collapsible open={openSections.accionarial} onOpenChange={() => toggleSection('accionarial')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <LineChartIcon className="h-3 w-3 text-pink-500" />
                <span className="font-medium">Valor Accionarial</span>
              </div>
              {openSections.accionarial ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </CollapsibleTrigger>
          </Collapsible>

          {/* Información */}
          <Collapsible open={openSections.informacion} onOpenChange={() => toggleSection('informacion')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-1 text-xs hover:bg-muted/50 rounded px-1">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3 text-gray-500" />
                <span className="font-medium">Informació</span>
              </div>
              {openSections.informacion ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
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
          <h2 className="text-lg font-bold tracking-wide">CUADRO ANALÍTICO DE PÉRDIDAS Y GANANCIAS</h2>
        </div>

        <div className="flex">
          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-amber-800 text-white">
                  <th className="border border-amber-700 px-2 py-1.5 text-left w-24">Grupos Contables</th>
                  <th className="border border-amber-700 px-2 py-1.5 text-left">DESCRIPCIÓN</th>
                  {yearsData.slice(0, 5).map((yd) => (
                    <th key={yd.year} className="border border-amber-700 px-2 py-1.5 text-right w-24">
                      Diciembre-{yd.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ANALYTICAL_PL_STRUCTURE.map((item, idx) => {
                  const isHighlighted = item.highlight;
                  const isTotal = item.isTotal;
                  const isFinal = item.isFinal;
                  
                  let rowClass = 'hover:bg-muted/50';
                  if (isFinal) {
                    rowClass = 'bg-amber-900 text-white font-bold';
                  } else if (isHighlighted) {
                    rowClass = 'bg-amber-700 text-white font-semibold';
                  } else if (isTotal) {
                    rowClass = 'bg-amber-600/80 text-white font-medium';
                  } else if (item.level === 2) {
                    rowClass = 'bg-muted/30';
                  }
                  
                  return (
                    <tr key={idx} className={rowClass}>
                      <td className="border border-border px-2 py-1 text-center font-mono text-[10px]">
                        {item.code}
                      </td>
                      <td className={`border border-border px-2 py-1 ${item.level === 2 ? 'pl-6' : item.level === 1 ? 'pl-4' : ''}`}>
                        {item.label}
                      </td>
                      {yearsData.slice(0, 5).map((yd) => {
                        const value = calculateFieldValue(yd.income, item.field);
                        const isNegative = value < 0;
                        
                        return (
                          <td 
                            key={yd.year} 
                            className={`border border-border px-2 py-1 text-right font-mono ${isNegative && !isFinal && !isHighlighted ? 'text-red-500' : ''}`}
                          >
                            {formatCurrency(value)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Charts Panel */}
          <div className="w-80 border-l border-border p-3 bg-card space-y-4">
            <div className="bg-amber-900 text-white p-2 text-center text-sm font-bold rounded">
              GRÁFICOS DE CONTROL Y EVOLUCIÓN
            </div>

            {/* Chart 1 */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-center">Valor de la Producción</h4>
              <div className="h-32">
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
              <h4 className="text-xs font-medium text-center">Resultado Neto de Explotación</h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  {renderChart(getPercentageChartData(chartGroup2), chartType2, '#f59e0b')}
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
                    % Porcentajes desviación
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
            <span><strong>Anàlisi:</strong> Cuadro Analítico P. y G.</span>
          </div>
          <div className="flex items-center gap-4">
            <span><strong>Període:</strong> {yearsData[0]?.year || new Date().getFullYear()}</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Dades validades
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticalPLChart;
