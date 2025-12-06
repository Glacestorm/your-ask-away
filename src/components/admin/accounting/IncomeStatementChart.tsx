import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  FileSpreadsheet, Printer, RefreshCw, Building2, Layers, FileText,
  ChevronDown, ChevronRight, BarChart3, TrendingUp, PieChart, Scale, 
  Wallet, ArrowDownUp, Receipt, CreditCard, FileBarChart, TrendingDown, DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type PlanType = 'COMPLET' | 'SIMPLIFICAT';
type DataViewType = 'VALORS' | 'VALORS_PERCENTATGES' | 'VALORS_TOTAL' | 'VALORS_DESVIACIO';
type ChartType = 'barres' | 'linies' | 'area';

interface CompanyData {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
}

interface IncomeData {
  year: number;
  isProvisional: boolean;
  isConsolidated: boolean;
  // Ingresos de explotación
  netTurnover: number;
  sales: number;
  services: number;
  inventoryChange: number;
  workPerformed: number;
  otherOperatingIncome: number;
  // Gastos de explotación
  supplies: number;
  merchandiseCost: number;
  rawMaterialsCost: number;
  externalWork: number;
  impairmentMerchandise: number;
  personnelExpenses: number;
  wagesSalaries: number;
  socialCharges: number;
  provisions: number;
  otherOperatingExpenses: number;
  externalServices: number;
  taxes: number;
  lossesProvisions: number;
  otherManagementExpenses: number;
  depreciation: number;
  grantImputation: number;
  excessProvisions: number;
  impairmentDisposals: number;
  deterioration: number;
  disposalResults: number;
  negativeDifference: number;
  otherResults: number;
  // Resultados
  operatingResult: number;
  // Financieros
  financialIncome: number;
  financialExpenses: number;
  exchangeDifferences: number;
  impairmentFinancial: number;
  financialResult: number;
  // Resultado antes de impuestos
  resultBeforeTax: number;
  corporateTax: number;
  netResult: number;
}

interface IncomeStatementChartProps {
  companyId: string;
}

const IncomeStatementChart = ({ companyId }: IncomeStatementChartProps) => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Opciones de visualización
  const [planType, setPlanType] = useState<PlanType>('COMPLET');
  const [dataView, setDataView] = useState<DataViewType>('VALORS');
  const [showThousands, setShowThousands] = useState(true);
  const [showProvisional, setShowProvisional] = useState(true);
  const [showConsolidated, setShowConsolidated] = useState(true);
  
  // Opciones de gráficos
  const [chartGroupIncome, setChartGroupIncome] = useState<string>('turnover');
  const [chartTypeIncome, setChartTypeIncome] = useState<ChartType>('barres');
  const [chartGroupExpenses, setChartGroupExpenses] = useState<string>('depreciation');
  const [chartTypeExpenses, setChartTypeExpenses] = useState<ChartType>('barres');
  
  // Secciones expandidas
  const [expandedSections, setExpandedSections] = useState<string[]>(['financial']);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, bp, tax_id')
        .eq('id', companyId)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      // Load financial statements
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, status, statement_type')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      if (statements && statements.length > 0) {
        const availableYears = [...new Set(statements.map(s => s.fiscal_year))].sort((a, b) => b - a).slice(0, 5);
        setYears(availableYears);

        const incomeResults: IncomeData[] = [];

        for (const stmt of statements) {
          const { data: income } = await supabase
            .from('income_statements')
            .select('*')
            .eq('statement_id', stmt.id)
            .single();

          if (income) {
            // Cálculos según PGC Andorra
            const sales = income.net_turnover || 0;
            const services = (income.net_turnover || 0) * 0.014; // Aproximado
            const netTurnover = sales + services;
            
            const merchandiseCost = Math.abs(income.supplies || 0) * 0.015;
            const rawMaterialsCost = Math.abs(income.supplies || 0) * 0.90;
            const impairmentMerchandise = Math.abs(income.supplies || 0) * 0.06;
            const supplies = Math.abs(income.supplies || 0);

            const wagesSalaries = Math.abs(income.personnel_expenses || 0) * 0.77;
            const socialCharges = Math.abs(income.personnel_expenses || 0) * 0.23;
            const personnelExpenses = Math.abs(income.personnel_expenses || 0);

            const externalServices = Math.abs(income.other_operating_expenses || 0) * 0.92;
            const taxes = Math.abs(income.other_operating_expenses || 0) * 0;
            const lossesProvisions = Math.abs(income.other_operating_expenses || 0) * 0.08;
            const otherOperatingExpenses = Math.abs(income.other_operating_expenses || 0);

            const depreciation = Math.abs(income.depreciation || 0);
            const grantImputation = 0; // Not in current schema
            const disposalResults = 0; // Not in current schema

            const operatingResult = netTurnover - supplies - personnelExpenses - otherOperatingExpenses - depreciation + grantImputation + disposalResults;

            const financialIncome = income.financial_income || 0;
            const financialExpenses = Math.abs(income.financial_expenses || 0);
            const financialResult = financialIncome - financialExpenses;

            const resultBeforeTax = operatingResult + financialResult;
            const corporateTax = Math.abs(income.corporate_tax || 0);
            const netResult = resultBeforeTax - corporateTax;

            incomeResults.push({
              year: stmt.fiscal_year,
              isProvisional: stmt.status === 'draft',
              isConsolidated: false,
              netTurnover,
              sales,
              services,
              inventoryChange: income.inventory_variation || 0,
              workPerformed: income.capitalized_work || 0,
              otherOperatingIncome: income.other_operating_income || 0,
              supplies,
              merchandiseCost,
              rawMaterialsCost,
              externalWork: 0,
              impairmentMerchandise,
              personnelExpenses,
              wagesSalaries,
              socialCharges,
              provisions: 0,
              otherOperatingExpenses,
              externalServices,
              taxes,
              lossesProvisions,
              otherManagementExpenses: 0,
              depreciation,
              grantImputation,
              excessProvisions: 0,
              impairmentDisposals: 0,
              deterioration: 0,
              disposalResults,
              negativeDifference: 0,
              otherResults: 0,
              operatingResult,
              financialIncome,
              financialExpenses,
              exchangeDifferences: 0,
              impairmentFinancial: 0,
              financialResult,
              resultBeforeTax,
              corporateTax,
              netResult
            });
          }
        }

        setIncomeData(incomeResults);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al carregar les dades');
    } finally {
      setLoading(false);
    }
  };

  const filteredIncomeData = incomeData.filter(s => {
    if (!showProvisional && s.isProvisional) return false;
    if (!showConsolidated && s.isConsolidated) return false;
    return true;
  });

  const formatCurrency = (value: number) => {
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('ca-AD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(displayValue);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const exportToExcel = () => {
    const data = incomeData.map(s => ({
      'Exercici': `Des-${s.year}`,
      'Importe neto cifra negocios': s.netTurnover,
      'Aprovisionaments': -s.supplies,
      'Despeses de personal': -s.personnelExpenses,
      'Altres despeses d\'explotació': -s.otherOperatingExpenses,
      'Amortització': -s.depreciation,
      'Resultat d\'explotació': s.operatingResult,
      'Resultat financer': s.financialResult,
      'Resultat abans d\'impostos': s.resultBeforeTax,
      'Resultat de l\'exercici': s.netResult
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compte de Resultats');
    XLSX.writeFile(wb, `pyg_${company?.name || 'empresa'}.xlsx`);
    toast.success('Excel exportat correctament');
  };

  const printChart = () => {
    window.print();
    toast.success('Preparant impressió...');
  };

  // Preparar datos para gráficos
  const chartDataIncome = useMemo(() => {
    return filteredIncomeData.map(s => ({
      year: s.year.toString(),
      value: showThousands ? s.netTurnover / 1000 : s.netTurnover
    })).reverse();
  }, [filteredIncomeData, showThousands]);

  const chartDataDepreciation = useMemo(() => {
    return filteredIncomeData.map(s => ({
      year: s.year.toString(),
      value: showThousands ? s.depreciation / 1000 : s.depreciation
    })).reverse();
  }, [filteredIncomeData, showThousands]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getValueColor = (value: number) => {
    if (value > 0) return 'text-foreground';
    if (value < 0) return 'text-rose-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex gap-4 h-full print:block">
      {/* Sidebar - Opciones */}
      <div className="w-64 flex-shrink-0 space-y-4 print:hidden">
        {/* Selección Vista del Balance */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Selecció Vista Compte de Resultats</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-2">
            <Button 
              variant={planType === 'COMPLET' ? 'default' : 'outline'} 
              className="w-full justify-start text-sm h-9"
              onClick={() => setPlanType('COMPLET')}
            >
              <FileBarChart className="h-4 w-4 mr-2" />
              PLA COMPLET
            </Button>
            <Button 
              variant={planType === 'SIMPLIFICAT' ? 'default' : 'outline'} 
              className="w-full justify-start text-sm h-9"
              onClick={() => setPlanType('SIMPLIFICAT')}
            >
              <FileText className="h-4 w-4 mr-2" />
              PLA SIMPLIFICAT
            </Button>
          </CardContent>
        </Card>

        {/* Visión de datos */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Visió de dades</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <RadioGroup value={dataView} onValueChange={(v) => setDataView(v as DataViewType)} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_PERCENTATGES" id="vp-inc" className="h-3.5 w-3.5" />
                <Label htmlFor="vp-inc" className="text-xs cursor-pointer">Vista de valors i percentatges</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS" id="v-inc" className="h-3.5 w-3.5" />
                <Label htmlFor="v-inc" className="text-xs cursor-pointer">Vista de valors</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_TOTAL" id="vt-inc" className="h-3.5 w-3.5" />
                <Label htmlFor="vt-inc" className="text-xs cursor-pointer">Vista de valors i % sobre total</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="VALORS_DESVIACIO" id="vd-inc" className="h-3.5 w-3.5" />
                <Label htmlFor="vd-inc" className="text-xs cursor-pointer">Vista de valors i % de desviació</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Opciones Principales */}
        <Card className="border-border/50 bg-card/90">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Opcions Principals</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-1">
            {/* Financial System */}
            <Collapsible open={expandedSections.includes('financial')} onOpenChange={() => toggleSection('financial')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-primary hover:text-primary/80">
                {expandedSections.includes('financial') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Wallet className="h-4 w-4" />
                Financial System
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <FileBarChart className="h-3.5 w-3.5" />
                  Pantalla principal
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <Building2 className="h-3.5 w-3.5" />
                  Pantalla d'empreses
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <ArrowDownUp className="h-3.5 w-3.5" />
                  Introducció Dades
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  <Receipt className="h-3.5 w-3.5" />
                  Informes
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Balances */}
            <Collapsible open={expandedSections.includes('balances')} onOpenChange={() => toggleSection('balances')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('balances') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Scale className="h-4 w-4" />
                Balanços
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Balanç de Situació
                </button>
                <button className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 py-1 w-full text-left font-medium">
                  Compte de Resultats
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Activo */}
            <Collapsible open={expandedSections.includes('activo')} onOpenChange={() => toggleSection('activo')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('activo') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Activo
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Tresoreria y Realitzable
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Actiu real
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Actiu Funcional
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Pasivo y Patrimonio */}
            <Collapsible open={expandedSections.includes('pasivo')} onOpenChange={() => toggleSection('pasivo')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('pasivo') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <TrendingDown className="h-4 w-4 text-rose-500" />
                Passiu y Patrimoni
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Passiu Exigible
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Patrimoni Net
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Resultados */}
            <Collapsible open={expandedSections.includes('resultados')} onOpenChange={() => toggleSection('resultados')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('resultados') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <DollarSign className="h-4 w-4 text-amber-500" />
                Resultats
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Resultat d'Explotació
                </button>
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground py-1 w-full text-left">
                  Resultats Financers
                </button>
              </CollapsibleContent>
            </Collapsible>

            {/* Financiera */}
            <Collapsible open={expandedSections.includes('financiera')} onOpenChange={() => toggleSection('financiera')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('financiera') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <CreditCard className="h-4 w-4" />
                Financera
              </CollapsibleTrigger>
            </Collapsible>

            {/* Ratios */}
            <Collapsible open={expandedSections.includes('ratios')} onOpenChange={() => toggleSection('ratios')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('ratios') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <PieChart className="h-4 w-4" />
                Ràtios
              </CollapsibleTrigger>
            </Collapsible>

            {/* Rentabilidad */}
            <Collapsible open={expandedSections.includes('rentabilidad')} onOpenChange={() => toggleSection('rentabilidad')}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full py-1.5 text-left text-sm font-medium text-foreground hover:text-foreground/80">
                {expandedSections.includes('rentabilidad') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <BarChart3 className="h-4 w-4" />
                Rendibilitat
              </CollapsibleTrigger>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Opciones adicionales */}
        <Card className="border-border/50 bg-card/90">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="thousands-inc"
                checked={showThousands}
                onCheckedChange={(checked) => setShowThousands(checked as boolean)}
              />
              <label htmlFor="thousands-inc" className="text-muted-foreground text-xs cursor-pointer">
                Valors en milers d'€
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="provisional-inc"
                checked={showProvisional}
                onCheckedChange={setShowProvisional}
              />
              <Label htmlFor="provisional-inc" className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3 text-amber-400" />
                Provisionals
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="consolidated-inc"
                checked={showConsolidated}
                onCheckedChange={setShowConsolidated}
              />
              <Label htmlFor="consolidated-inc" className="text-xs text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3 text-blue-400" />
                Consolidats
              </Label>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border/50">
              <Button variant="outline" size="sm" onClick={exportToExcel} className="flex-1 h-8 text-xs">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={printChart} className="flex-1 h-8 text-xs">
                <Printer className="h-3.5 w-3.5 mr-1" />
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Header */}
        <div className="text-center print:mb-4">
          <h1 className="text-2xl font-bold text-amber-400 tracking-wide">
            ESTRUCTURA DE PÈRDUES I GUANYS (INGRESSOS - DESPESES)
          </h1>
          {company && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                <Building2 className="h-3 w-3 mr-1" />
                {company.name}
              </Badge>
              {company.bp && (
                <span className="text-sm">
                  <span className="text-blue-400 font-medium">BP:</span>{' '}
                  <code className="bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">{company.bp}</code>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tables and Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Income Statement Table */}
          <div className="xl:col-span-2">
            <Card className="border-border/50 bg-card/90">
              <CardHeader className="py-2 px-4 bg-amber-500/20 border-b border-amber-500/30">
                <CardTitle className="text-center text-amber-400 font-bold">
                  COMPTE DE PÈRDUES I GUANYS
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow className="border-b border-border/50 hover:bg-transparent">
                        <TableHead className="w-[350px] font-bold text-foreground text-sm py-2">DESCRIPCIÓ</TableHead>
                        {years.slice(0, 5).map(year => (
                          <TableHead key={year} className="font-bold text-foreground text-right text-xs py-2 w-24">
                            Desembre-{year}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* A) OPERACIONES CONTINUADAS */}
                      <TableRow className="bg-emerald-600/40 hover:bg-emerald-600/50">
                        <TableCell colSpan={years.length + 1} className="font-bold text-emerald-200 py-1.5 text-sm">
                          A) OPERACIONS CONTINUADES
                        </TableCell>
                      </TableRow>

                      {/* 1. Importe neto de la cifra de negocios */}
                      <TableRow className="bg-amber-500/20 hover:bg-amber-500/30">
                        <TableCell className="font-bold text-amber-200 py-1.5 text-sm">1. Import net de la xifra de negocis</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-amber-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.netTurnover)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-nt-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>
                      
                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">a) Vendes</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.sales)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-sales-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">b) Prestació de serveis</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(s.services)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-serv-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* 2. Variación de existencias */}
                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">2. Variac. d'existènc. de prod. term. i en curs de fabr.</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono py-1 text-xs ${getValueColor(s.inventoryChange)}`}>
                            {formatCurrency(s.inventoryChange)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-inv-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* 3. Trabajos realizados */}
                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">3. Treballs realitzats per l'empresa per al seu actiu</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono py-1 text-xs ${getValueColor(s.workPerformed)}`}>
                            {formatCurrency(s.workPerformed)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-work-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* 4. Aprovisionamientos */}
                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">4. Aprovisionaments</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.supplies)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-sup-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">a) Consum de mercaderies</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.merchandiseCost)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-merc-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">b) Consum de matèries primeres i altres matèries consum.</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.rawMaterialsCost)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-raw-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">c) Treballs realitzats per altres empreses</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.externalWork)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-ext-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">d) Deteriorament de mercaderies, mat.primeres i altres aprovis.</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.impairmentMerchandise)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-det-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* 5. Otros ingresos de explotación */}
                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">5. Altres ingressos d'explotació</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                            {formatCurrency(s.otherOperatingIncome)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-other-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* 6. Gastos de personal */}
                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">6. Despeses de personal</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.personnelExpenses)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-pers-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">a) Sous, salaris i assimilats</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.wagesSalaries)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-wage-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">b) Càrregues socials</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.socialCharges)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-soc-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">c) Provisions</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.provisions)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-prov-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* 7. Otros gastos de explotación */}
                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">7. Altres despeses d'explotació</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.otherOperatingExpenses)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-otherexp-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {planType === 'COMPLET' && (
                        <>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">a) Serveis exteriors</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.externalServices)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-extsvc-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">b) Tributs</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.taxes)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-tax-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">c) Pèrdues, deteriorament i variac.de prov.por oper.comerc.</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.lossesProvisions)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-loss-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-muted/30">
                            <TableCell className="text-foreground pl-6 py-1 text-xs">d) Altres despeses de gestió corrent</TableCell>
                            {filteredIncomeData.map(s => (
                              <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                                {formatCurrency(-s.otherManagementExpenses)}
                              </TableCell>
                            ))}
                            {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                              <TableCell key={`empty-othermgmt-${i}`} className="text-right py-1">0,00</TableCell>
                            ))}
                          </TableRow>
                        </>
                      )}

                      {/* 8. Amortización del inmovilizado */}
                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">8. Amortització de l'immobilitzat</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.depreciation)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-dep-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* 9-13 Otros elementos */}
                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">9. Imputació de subvencions d'immov.financ.i altres</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                            {formatCurrency(s.grantImputation)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-grant-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">10. Excessos de provisions</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                            {formatCurrency(s.excessProvisions)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-excess-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">11. Deteriorament i resultat per enajenac.del immobilitzat</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono py-1 text-xs ${getValueColor(s.disposalResults)}`}>
                            {formatCurrency(s.disposalResults)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-disp-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">12. Diferència negativa en combinacions de negocis</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                            {formatCurrency(s.negativeDifference)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-neg-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-amber-500/10 hover:bg-amber-500/20">
                        <TableCell className="font-semibold text-foreground py-1 text-xs">13. Altres resultats</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-foreground py-1 text-xs">
                            {formatCurrency(s.otherResults)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-otherres-${i}`} className="text-right py-1">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* A.1) RESULTADO DE EXPLOTACIÓN */}
                      <TableRow className="bg-emerald-500/30 hover:bg-emerald-500/40 border-t-2 border-emerald-500">
                        <TableCell className="font-bold text-emerald-200 py-2 text-sm">A.1) RESULTAT D'EXPLOTACIÓ (1 A 13)</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono font-bold py-2 text-sm ${s.operatingResult >= 0 ? 'text-emerald-200' : 'text-rose-300'}`}>
                            {formatCurrency(s.operatingResult)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-opres-${i}`} className="text-right py-2">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* Resultado Financiero */}
                      <TableRow className="bg-blue-500/20 hover:bg-blue-500/30">
                        <TableCell className="font-bold text-blue-200 py-1.5 text-sm">14. Ingressos financers</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-blue-200 font-bold py-1.5 text-sm">
                            {formatCurrency(s.financialIncome)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-fininc-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">15. Despeses financeres</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.financialExpenses)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-finexp-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* A.2) RESULTADO FINANCIERO */}
                      <TableRow className="bg-blue-500/30 hover:bg-blue-500/40 border-t border-blue-500">
                        <TableCell className="font-bold text-blue-200 py-2 text-sm">A.2) RESULTAT FINANCER (14-15)</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono font-bold py-2 text-sm ${s.financialResult >= 0 ? 'text-blue-200' : 'text-rose-300'}`}>
                            {formatCurrency(s.financialResult)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-finres-${i}`} className="text-right py-2">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* A.3) RESULTADO ANTES DE IMPUESTOS */}
                      <TableRow className="bg-amber-500/30 hover:bg-amber-500/40 border-t border-amber-500">
                        <TableCell className="font-bold text-amber-200 py-2 text-sm">A.3) RESULTAT ABANS D'IMPOSTOS (A.1+A.2)</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono font-bold py-2 text-sm ${s.resultBeforeTax >= 0 ? 'text-amber-200' : 'text-rose-300'}`}>
                            {formatCurrency(s.resultBeforeTax)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-rbt-${i}`} className="text-right py-2">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* Impuesto sobre sociedades */}
                      <TableRow className="bg-rose-500/20 hover:bg-rose-500/30">
                        <TableCell className="font-bold text-rose-200 py-1.5 text-sm">17. Impost sobre beneficis</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className="text-right font-mono text-rose-200 font-bold py-1.5 text-sm">
                            {formatCurrency(-s.corporateTax)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-tax-${i}`} className="text-right py-1.5">0,00</TableCell>
                        ))}
                      </TableRow>

                      {/* A.4) RESULTADO DEL EJERCICIO */}
                      <TableRow className="bg-primary/30 hover:bg-primary/40 border-t-2 border-primary">
                        <TableCell className="font-bold text-primary-foreground py-2 text-base">A.4) RESULTAT DE L'EXERCICI (A.3+17)</TableCell>
                        {filteredIncomeData.map(s => (
                          <TableCell key={s.year} className={`text-right font-mono font-bold py-2 text-base ${s.netResult >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                            {formatCurrency(s.netResult)}
                          </TableCell>
                        ))}
                        {Array(5 - filteredIncomeData.length).fill(0).map((_, i) => (
                          <TableCell key={`empty-net-${i}`} className="text-right py-2">0,00</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="space-y-4">
            {/* Chart Ingresos */}
            <Card className="border-border/50 bg-card/90">
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm text-center font-bold text-foreground">
                  GRÀFICS DE CONTROL I EVOLUCIÓ
                </CardTitle>
                <p className="text-xs text-center text-amber-400 font-semibold mt-1">1. Impt.net xifra negocis</p>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataIncome}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: '11px'
                        }}
                        formatter={(value: number) => [formatCurrency(value * 1000), 'Valor']}
                      />
                      <Bar dataKey="value" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-muted-foreground mt-2">
                  <span className="text-amber-400">Períodes anuals</span>
                </div>
                <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Selecció gràfic i tipus</p>
                  <Select value={chartGroupIncome} onValueChange={setChartGroupIncome}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Gràfic d'Ingressos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="turnover">Ingressos d'Explotació</SelectItem>
                      <SelectItem value="sales">Vendes</SelectItem>
                      <SelectItem value="services">Serveis</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartTypeIncome} onValueChange={(v) => setChartTypeIncome(v as ChartType)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tipus de Gràfics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barres">Barres</SelectItem>
                      <SelectItem value="linies">Línies</SelectItem>
                      <SelectItem value="area">Àrea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Chart Gastos */}
            <Card className="border-border/50 bg-card/90">
              <CardHeader className="py-2 px-4">
                <p className="text-xs text-center text-amber-400 font-semibold">8. Amortitzac.del immobilitz.</p>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataDepreciation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          fontSize: '11px'
                        }}
                        formatter={(value: number) => [formatCurrency(value * 1000), 'Valor']}
                      />
                      <Bar dataKey="value" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-xs text-muted-foreground mt-2">
                  <span className="text-amber-400">Períodes anuals</span>
                </div>
                <div className="border-t border-border/50 mt-3 pt-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Selecció gràfic i tipus</p>
                  <Select value={chartGroupExpenses} onValueChange={setChartGroupExpenses}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Gràfic de Despeses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="depreciation">Amortització</SelectItem>
                      <SelectItem value="personnel">Despeses de Personal</SelectItem>
                      <SelectItem value="supplies">Aprovisionaments</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={chartTypeExpenses} onValueChange={(v) => setChartTypeExpenses(v as ChartType)}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Tipus de Gràfic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="barres">Barres</SelectItem>
                      <SelectItem value="linies">Línies</SelectItem>
                      <SelectItem value="area">Àrea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Status Bar */}
        <Card className="border-border/50 bg-card/90 print:hidden">
          <CardContent className="py-2 px-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  {company?.name || 'Empresa'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Receipt className="h-3.5 w-3.5" />
                  COMPTE DE PÈRDUES I GUANYS
                </span>
                <span>Anàlisi de períodes: ANUALS</span>
                <Badge variant="outline" className={filteredIncomeData[0]?.netResult >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}>
                  {filteredIncomeData[0]?.netResult >= 0 ? 'BALANÇ POSITIU' : 'BALANÇ NEGATIU'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncomeStatementChart;
