import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Download, Info, Calculator } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BalanceSheet {
  fiscal_year: number;
  inventory?: number;
  trade_receivables?: number;
  short_term_financial_investments?: number;
  cash_equivalents?: number;
  non_current_assets_held_for_sale?: number;
  accruals_assets?: number;
  short_term_group_receivables?: number;
  short_term_debts?: number;
  short_term_group_debts?: number;
  trade_payables?: number;
  other_creditors?: number;
  short_term_provisions?: number;
  short_term_accruals?: number;
}

interface WorkingCapitalAnalysisProps {
  companyId: string;
  companyName: string;
  balanceSheets: BalanceSheet[];
}

type DataView = 'values_percentages' | 'values' | 'values_total' | 'values_deviation';

const WorkingCapitalAnalysis: React.FC<WorkingCapitalAnalysisProps> = ({
  companyId,
  companyName,
  balanceSheets
}) => {
  const [dataView, setDataView] = useState<DataView>('values');
  const [showThousands, setShowThousands] = useState(true);
  const [chartType1, setChartType1] = useState('bar');
  const [chartGroup1, setChartGroup1] = useState('activo_circulante');
  const [chartType2, setChartType2] = useState('bar');
  const [chartGroup2, setChartGroup2] = useState('existencias');
  const [expandedSections, setExpandedSections] = useState({
    financial: true,
    balances: true,
    financiera: false,
    analitica: true,
    ratios: false,
    rentabilidad: false,
    auditoria: false,
    valoraciones: false
  });

  const sortedYears = useMemo(() => {
    return [...balanceSheets].sort((a, b) => b.fiscal_year - a.fiscal_year).slice(0, 5);
  }, [balanceSheets]);

  const formatValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '-';
    const displayValue = showThousands ? value / 1000 : value;
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(displayValue);
  };

  const formatRatio = (value: number | null | undefined): string => {
    if (value === null || value === undefined || !isFinite(value)) return '-';
    return value.toFixed(2);
  };

  // Calculate working capital components
  const calculateMetrics = (balance: BalanceSheet) => {
    // Current Assets (Activo Circulante)
    const nonCurrentAssetsHeldForSale = balance.non_current_assets_held_for_sale || 0;
    const inventory = balance.inventory || 0;
    const tradeReceivables = balance.trade_receivables || 0;
    const shortTermFinancialInvestments = balance.short_term_financial_investments || 0;
    const cashEquivalents = balance.cash_equivalents || 0;
    const accruals = balance.accruals_assets || 0;
    const groupReceivables = balance.short_term_group_receivables || 0;

    // Current Liabilities (Pasivo Circulante)
    const shortTermDebts = balance.short_term_debts || 0;
    const shortTermGroupDebts = balance.short_term_group_debts || 0;
    const tradePayables = balance.trade_payables || 0;
    const otherCreditors = balance.other_creditors || 0;
    const shortTermProvisions = balance.short_term_provisions || 0;
    const shortTermAccruals = balance.short_term_accruals || 0;

    const totalCurrentAssets = nonCurrentAssetsHeldForSale + inventory + tradeReceivables + 
      shortTermFinancialInvestments + cashEquivalents + accruals;
    
    const totalCurrentLiabilities = shortTermDebts + shortTermGroupDebts + tradePayables + 
      otherCreditors + shortTermProvisions + shortTermAccruals;

    // Operating Working Capital
    const operatingCurrentAssets = inventory + tradeReceivables;
    const operatingOtherAssets = groupReceivables;
    const totalOperatingAssets = operatingCurrentAssets + operatingOtherAssets;

    // Non-operating Working Capital
    const nonOperatingAssets = nonCurrentAssetsHeldForSale + shortTermFinancialInvestments + 
      cashEquivalents + accruals;

    // Ratios
    const solvencyRatio = totalCurrentLiabilities !== 0 ? totalCurrentAssets / totalCurrentLiabilities : 0;
    const acidTestRatio = totalCurrentLiabilities !== 0 ? 
      (cashEquivalents + shortTermFinancialInvestments + tradeReceivables) / totalCurrentLiabilities : 0;
    const liquidityRatio = totalCurrentLiabilities !== 0 ? 
      (cashEquivalents + shortTermFinancialInvestments) / totalCurrentLiabilities : 0;

    // Working Capital
    const workingCapital = totalCurrentAssets - totalCurrentLiabilities;
    const minimumWorkingCapital = inventory * 0.8; // Simplified calculation
    const netTreasury = cashEquivalents - shortTermDebts;
    const basicFinancingCoefficient = totalCurrentAssets !== 0 ? 
      (totalCurrentAssets - inventory) / totalCurrentAssets : 0;

    return {
      // Current Assets
      nonCurrentAssetsHeldForSale,
      inventory,
      tradeReceivables,
      shortTermFinancialInvestments,
      cashEquivalents,
      accruals,
      totalCurrentAssets,
      // Current Liabilities
      shortTermDebts,
      shortTermGroupDebts,
      tradePayables,
      otherCreditors,
      shortTermProvisions,
      shortTermAccruals,
      totalCurrentLiabilities,
      // Operating
      operatingCurrentAssets,
      totalOperatingAssets,
      nonOperatingAssets,
      // Ratios
      solvencyRatio,
      acidTestRatio,
      liquidityRatio,
      // Summary
      workingCapital,
      minimumWorkingCapital,
      netTreasury,
      basicFinancingCoefficient,
      groupReceivables
    };
  };

  const yearMetrics = useMemo(() => {
    return sortedYears.map(balance => ({
      year: balance.fiscal_year,
      ...calculateMetrics(balance)
    }));
  }, [sortedYears]);

  const chartData = yearMetrics.map(m => ({
    year: m.year.toString(),
    activoCirculante: showThousands ? m.totalCurrentAssets / 1000 : m.totalCurrentAssets,
    pasivoCirculante: showThousands ? m.totalCurrentLiabilities / 1000 : m.totalCurrentLiabilities
  })).reverse();

  const inventoryPercentageData = yearMetrics.map(m => ({
    year: m.year.toString(),
    percentage: m.totalCurrentAssets !== 0 ? (m.inventory / m.totalCurrentAssets) * 100 : 0
  })).reverse();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="flex h-full bg-[#1a1a2e] text-amber-100 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-56 bg-[#16213e] border-r border-amber-900/30 p-3 overflow-y-auto text-xs">
        {/* Data View Options */}
        <div className="mb-4 p-2 bg-[#1a1a2e] rounded border border-amber-900/30">
          <div className="text-amber-300 font-medium mb-2">Visió de dades</div>
          <RadioGroup value={dataView} onValueChange={(v) => setDataView(v as DataView)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_percentages" id="vp" className="border-amber-600" />
              <Label htmlFor="vp" className="text-amber-200 text-xs">Vista de valors i percentatges</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values" id="v" className="border-amber-600" />
              <Label htmlFor="v" className="text-amber-200 text-xs">Vista de valors</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_total" id="vt" className="border-amber-600" />
              <Label htmlFor="vt" className="text-amber-200 text-xs">Vista de valors i % sobre total</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="values_deviation" id="vd" className="border-amber-600" />
              <Label htmlFor="vd" className="text-amber-200 text-xs">Vista de valors i % de desviació</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Menu Sections */}
        <div className="space-y-1">
          <Collapsible open={expandedSections.financial}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('financial')}
              className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded"
            >
              <span className="font-medium">Financial System</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.financial ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-2 space-y-0.5 text-amber-200">
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer flex items-center gap-1">
                <span>🏠</span> Pantalla principal
              </div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer flex items-center gap-1">
                <span>🏢</span> Pantalla de empresas
              </div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer flex items-center gap-1">
                <span>📝</span> Introducció Dades
              </div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer flex items-center gap-1">
                <span>📊</span> Informes
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={expandedSections.analitica}>
            <CollapsibleTrigger 
              onClick={() => toggleSection('analitica')}
              className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded"
            >
              <span className="font-medium">Grup Analític</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.analitica ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="ml-2 space-y-0.5 text-amber-200">
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📊 Anàlisi Masses Patrimonials</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📈 Quadre Analític P.y G.</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📉 Neces.Operat.de Fondos</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📊 Tendències Anuals Mòbils</div>
              <div className="px-2 py-1 bg-amber-600 text-white rounded cursor-pointer font-medium">
                💰 Anàlisi del Capital Circulant
              </div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">🏦 Anàlisi Financer a llarg termini</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">💵 Flux de Caixa</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📊 Anàlisi EBIT i EBITDA</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">💎 Anàlisi del Valor Afegit</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">🏛️ Moviments de Tresoreria</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📋 Quadre de Finançament</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📱 Quadre de Comandament Financer</div>
              <div className="px-2 py-1 hover:bg-amber-900/20 rounded cursor-pointer">📈 Índex 'Z'</div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded">
              <span className="font-medium">Ràtios</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded">
              <span className="font-medium">Rendibilitat</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded">
              <span className="font-medium">Auditoria</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left text-amber-300 hover:bg-amber-900/20 rounded">
              <span className="font-medium">Valoracions</span>
              <ChevronDown className="h-3 w-3" />
            </CollapsibleTrigger>
          </Collapsible>
        </div>

        {/* Options */}
        <div className="mt-4 pt-4 border-t border-amber-900/30 space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="thousands" className="text-xs text-amber-200">Milers €</Label>
            <Switch
              id="thousands"
              checked={showThousands}
              onCheckedChange={setShowThousands}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] p-3 border-b border-amber-900/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-amber-300">ANÀLISI I DESGLOSSAMENT DEL CAPITAL CIRCULANT</h1>
              <p className="text-xs text-amber-200/70">{companyName}</p>
            </div>
            <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/30">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Left Column - Current Assets & Liabilities */}
            <div className="col-span-2 space-y-3">
              {/* Row 1: Current Assets & Operating Working Capital */}
              <div className="grid grid-cols-2 gap-3">
                {/* Current Assets */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-amber-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">ANÀLISI DEL CAPITAL CIRCULANT (ACTIU CIRCULANT)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">ACTIU CIRCULANT</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'Actius no corrents mantinguts per a la venda', key: 'nonCurrentAssetsHeldForSale' },
                          { label: 'Existències totals', key: 'inventory' },
                          { label: 'Deutors comercials i altres comptes a cobrar', key: 'tradeReceivables' },
                          { label: 'Inversions financeres temporals', key: 'shortTermFinancialInvestments' },
                          { label: 'Tresoreria i altres actius líquids equiv.', key: 'cashEquivalents' },
                          { label: 'Ajustos per periodificació i altre actiu circ.', key: 'accruals' },
                        ].map((row) => (
                          <TableRow key={row.key} className="border-amber-900/20 hover:bg-amber-900/10">
                            <TableCell className="text-amber-100 text-[10px] py-1">{row.label}</TableCell>
                            {yearMetrics.slice(0, 2).map(m => (
                              <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                                {formatValue(m[row.key as keyof typeof m] as number)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Operating Working Capital */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-green-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">CAPITAL CIRCULANT D'EXPLOTACIÓ</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">CAPITAL CIRCULANT</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Existències totals</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.inventory)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Clients per vendes i prestacions de serveis</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.tradeReceivables * 0.8)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Empreses del Grup, deutores</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.groupReceivables)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 bg-amber-900/20 font-bold">
                          <TableCell className="text-red-400 text-[10px] py-1 font-bold">TOTAL ACTIU CIRCULANT D'EXPLOTACIÓ</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-red-400 text-[10px] py-1 text-right font-mono font-bold">
                              {formatValue(m.totalOperatingAssets)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Deutes amb entitats del grup i assoc. a c/pzo.</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.shortTermGroupDebts)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Current Liabilities & Non-operating */}
              <div className="grid grid-cols-2 gap-3">
                {/* Current Liabilities */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-red-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">ANÀLISI DEL CAPITAL CIRCULANT (PASSIU CIRCULANT)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">PASSIU CIRCULANT</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'Emissió d\'obligacions i altres valors negociables', key: 'shortTermDebts', factor: 0.1 },
                          { label: 'Deutes amb entitats de crèdit a curt termini', key: 'shortTermDebts', factor: 0.4 },
                          { label: 'Deutes amb empreses del grup i associades a cto.pzo.', key: 'shortTermGroupDebts' },
                          { label: 'Creditors comercials', key: 'tradePayables' },
                          { label: 'Altres deutes no comercials', key: 'otherCreditors' },
                          { label: 'Provisions per operacions de tràfic', key: 'shortTermProvisions' },
                        ].map((row, idx) => (
                          <TableRow key={idx} className="border-amber-900/20 hover:bg-amber-900/10">
                            <TableCell className="text-amber-100 text-[10px] py-1">{row.label}</TableCell>
                            {yearMetrics.slice(0, 2).map(m => (
                              <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                                {formatValue((m[row.key as keyof typeof m] as number) * (row.factor || 1))}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Non-operating Working Capital */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-blue-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">CAPITAL CIRCULANT EXTERN A L'EXPLOTACIÓ</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">CAPITAL CIRCULANT EXTERN NO OPERATIU</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Actius no corrents mantinguts per a la venda</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.nonCurrentAssetsHeldForSale)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Deutors no comercials</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.tradeReceivables * 0.2)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Inversions financeres temporals</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.shortTermFinancialInvestments)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 hover:bg-amber-900/10">
                          <TableCell className="text-amber-100 text-[10px] py-1">Tresoreria i altres actius líquids equiv.</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                              {formatValue(m.cashEquivalents)}
                            </TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="border-amber-900/20 bg-amber-900/20 font-bold">
                          <TableCell className="text-red-400 text-[10px] py-1 font-bold">TOTAL ACTIU CIRCULANT EXTERN A L'EXPLOT.</TableCell>
                          {yearMetrics.slice(0, 2).map(m => (
                            <TableCell key={m.year} className="text-red-400 text-[10px] py-1 text-right font-mono font-bold">
                              {formatValue(m.nonOperatingAssets)}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Breakdown by Liquidity & Accumulated */}
              <div className="grid grid-cols-2 gap-3">
                {/* By Liquidity */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-purple-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">DESGLOSSAMENT DE L'ACTIU CIRCULANT (Ordenat per Liquiditat)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">ACTIU CIRCULANT</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { label: 'Tresoreria i altres actius líquids equiv.', key: 'cashEquivalents' },
                          { label: 'Inversions financeres temporals', key: 'shortTermFinancialInvestments' },
                          { label: 'Actius no corrents mantinguts per a la venda', key: 'nonCurrentAssetsHeldForSale' },
                          { label: 'Deutors comercials i altres comptes a cobrar', key: 'tradeReceivables' },
                          { label: 'Existències totals', key: 'inventory' },
                        ].map((row) => (
                          <TableRow key={row.key} className="border-amber-900/20 hover:bg-amber-900/10">
                            <TableCell className="text-amber-100 text-[10px] py-1">{row.label}</TableCell>
                            {yearMetrics.slice(0, 2).map(m => (
                              <TableCell key={m.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                                {formatValue(m[row.key as keyof typeof m] as number)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Accumulated % */}
                <Card className="bg-[#16213e] border-amber-900/30">
                  <CardHeader className="py-1.5 px-2 bg-gradient-to-r from-cyan-900/30 to-transparent">
                    <CardTitle className="text-xs text-amber-300">ACTIU CIRCULANT ACUMULAT (% sobre Passiu Circulant)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-900/30 hover:bg-transparent">
                          <TableHead className="text-amber-300 text-[10px] py-1">ACTIU CIRCULANT</TableHead>
                          {sortedYears.slice(0, 2).map(y => (
                            <TableHead key={y.fiscal_year} className="text-amber-300 text-[10px] py-1 text-right">
                              Des-{y.fiscal_year}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearMetrics.slice(0, 1).map(m => {
                          let accumulated = 0;
                          return [
                            { label: 'Tresoreria i altres actius líquids equiv.', value: m.cashEquivalents },
                            { label: 'Inversions financeres temporals', value: m.shortTermFinancialInvestments },
                            { label: 'Actius no corrents mantinguts per a la venda', value: m.nonCurrentAssetsHeldForSale },
                            { label: 'Deutors comercials i altres comptes a cobrar', value: m.tradeReceivables },
                            { label: 'Existències totals', value: m.inventory },
                          ].map((row, idx) => {
                            accumulated += row.value;
                            return (
                              <TableRow key={idx} className="border-amber-900/20 hover:bg-amber-900/10">
                                <TableCell className="text-amber-100 text-[10px] py-1">{row.label}</TableCell>
                                {yearMetrics.slice(0, 2).map((ym, yIdx) => {
                                  const yAccum = [ym.cashEquivalents, ym.shortTermFinancialInvestments, ym.nonCurrentAssetsHeldForSale, ym.tradeReceivables, ym.inventory]
                                    .slice(0, idx + 1).reduce((a, b) => a + b, 0);
                                  return (
                                    <TableCell key={ym.year} className="text-cyan-300 text-[10px] py-1 text-right font-mono">
                                      {formatValue(yAccum)}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          });
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Working Capital Summary */}
                <Card className="bg-[#16213e] border-amber-900/30 p-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-amber-900/30 pb-1">
                      <span className="text-xs text-amber-300">CAPITAL CIRCULANT REAL</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-green-400 font-bold">
                          {formatValue(m.workingCapital)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-900/30 pb-1">
                      <span className="text-xs text-amber-300">CAPITAL CIRCULANT MÍNIM</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-amber-200">
                          {formatValue(m.minimumWorkingCapital)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-900/30 pb-1">
                      <span className="text-xs text-amber-300">TRESORERIA NETA</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className={`text-xs font-mono font-bold ${m.netTreasury >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatValue(m.netTreasury)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-amber-300 flex items-center gap-1">
                        COEFICIENT BÀSIC DE FINANÇAMENT
                        <Info className="h-3 w-3 text-amber-500" />
                      </span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-cyan-300 font-bold">
                          {formatRatio(m.basicFinancingCoefficient)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Ratios */}
                <Card className="bg-[#16213e] border-amber-900/30 p-3">
                  <div className="text-xs text-amber-300 font-bold mb-2">RÀTIOS DEL CIRCULANT</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center border-b border-amber-900/30 pb-1">
                      <span className="text-[10px] text-amber-200">RÀTIO DE SOLVÈNCIA: (Actiu Circulant / Passiu Circulant)</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-cyan-300 font-bold">
                          {formatRatio(m.solvencyRatio)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center border-b border-amber-900/30 pb-1">
                      <span className="text-[10px] text-amber-200">ACID-TEST RATIO: Tresoreria + Invers.Financ.Temporals + Deutors / Passiu Circulant</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-cyan-300 font-bold">
                          {formatRatio(m.acidTestRatio)}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-200">RÀTIO DE TRESORERIA LÍQUIDA: Tresoreria + Invers.Financ.Temporals / Passiu Circulant</span>
                      {yearMetrics.slice(0, 2).map(m => (
                        <span key={m.year} className="text-xs font-mono text-cyan-300 font-bold">
                          {formatRatio(m.liquidityRatio)}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Right Column - Charts */}
            <div className="space-y-3">
              <Card className="bg-[#16213e] border-amber-900/30">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm text-amber-300">GRÀFICS DE CONTROL I EVOLUCIÓ</CardTitle>
                </CardHeader>
              </Card>

              {/* Working Capital Chart */}
              <Card className="bg-[#16213e] border-amber-900/30">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs text-amber-300">Actiu Circulant</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="year" tick={{ fill: '#fcd34d', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#fcd34d', fontSize: 10 }} width={50} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                          labelStyle={{ color: '#fcd34d' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="activoCirculante" name="Actiu Circ." fill="#4ade80" />
                        <Bar dataKey="pasivoCirculante" name="Passiu Circ." fill="#f87171" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Select value={chartGroup1} onValueChange={setChartGroup1}>
                      <SelectTrigger className="h-6 text-[10px] bg-transparent border-amber-900/30 text-amber-200 flex-1">
                        <SelectValue placeholder="Gràfic de Valors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo_circulante">Valors Anàlisi Cap Circulant</SelectItem>
                        <SelectItem value="ratios">Ràtios del Circulant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Chart */}
              <Card className="bg-[#16213e] border-amber-900/30">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-xs text-amber-300">Existències</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={inventoryPercentageData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="year" tick={{ fill: '#fcd34d', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#fcd34d', fontSize: 10 }} width={40} tickFormatter={(v) => `${v}%`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #92400e' }}
                          formatter={(value: number) => [`${value.toFixed(2)}%`, 'Percentatge']}
                        />
                        <Bar dataKey="percentage" name="% Existències" fill="#22d3ee" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <RadioGroup defaultValue="percentages" className="flex gap-2">
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="percentages" id="pct" className="border-amber-600 h-3 w-3" />
                        <Label htmlFor="pct" className="text-[10px] text-amber-200">Percentatges totals</Label>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RadioGroupItem value="deviation" id="dev" className="border-amber-600 h-3 w-3" />
                        <Label htmlFor="dev" className="text-[10px] text-amber-200">%/Totals i Desviacions</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#0f0f1a] border-t border-amber-900/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200/60">
          <div className="flex items-center gap-4">
            <span>📊 {companyName}</span>
            <span className="flex items-center gap-1"><Calculator className="h-3 w-3" /> Anàlisi del Capital Circulant</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Anàlisi de períodes: ANUALS</span>
            <span className="px-2 py-0.5 bg-green-900/30 rounded text-green-400">QUADRE DE BALANÇOS: 'OK'</span>
            <span className="px-2 py-0.5 bg-amber-900/30 rounded">Adaptació PGC Andorra</span>
            <span>{new Date().toLocaleDateString('ca-ES')} {new Date().toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingCapitalAnalysis;
