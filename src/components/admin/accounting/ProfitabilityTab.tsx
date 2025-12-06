import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Target, Percent, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface ProfitabilityTabProps {
  companyId: string;
  companyName: string;
}

interface FinancialMetrics {
  year: number;
  netTurnover: number;
  variableCosts: number;
  fixedCosts: number;
  ebit: number;
  netIncome: number;
  totalAssets: number;
  equity: number;
  totalDebt: number;
  financialExpenses: number;
  inventory: number;
  tradeReceivables: number;
  tradePayables: number;
  supplies: number;
}

export function ProfitabilityTab({ companyId, companyName }: ProfitabilityTabProps) {
  const [data, setData] = useState<FinancialMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: statements } = await supabase
        .from("company_financial_statements")
        .select("id, fiscal_year")
        .eq("company_id", companyId)
        .eq("is_archived", false)
        .order("fiscal_year", { ascending: true });

      if (!statements?.length) {
        setData([]);
        setLoading(false);
        return;
      }

      const metrics: FinancialMetrics[] = [];

      for (const stmt of statements) {
        const [{ data: balance }, { data: income }] = await Promise.all([
          supabase.from("balance_sheets").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("income_statements").select("*").eq("statement_id", stmt.id).single()
        ]);

        if (balance && income) {
          const netTurnover = income.net_turnover || 0;
          const supplies = Math.abs(income.supplies || 0);
          const personnelExpenses = Math.abs(income.personnel_expenses || 0);
          const depreciation = Math.abs(income.depreciation || 0);
          const otherExpenses = Math.abs(income.other_operating_expenses || 0);
          const financialExpenses = Math.abs(income.financial_expenses || 0);
          const financialIncome = income.financial_income || 0;
          const corporateTax = Math.abs(income.corporate_tax || 0);

          const ebitda = netTurnover - supplies - personnelExpenses - otherExpenses;
          const ebit = ebitda - depreciation;
          const netIncome = ebit - financialExpenses + financialIncome - corporateTax;

          const totalAssets = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) + 
                            (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                            (balance.cash_equivalents || 0) + (balance.long_term_financial_investments || 0);

          const equity = (balance.share_capital || 0) + (balance.share_premium || 0) + 
                        (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) + 
                        (balance.retained_earnings || 0) + (balance.current_year_result || 0);

          const totalDebt = (balance.long_term_debts || 0) + (balance.short_term_debts || 0);

          metrics.push({
            year: stmt.fiscal_year,
            netTurnover,
            variableCosts: supplies,
            fixedCosts: personnelExpenses + depreciation + otherExpenses,
            ebit,
            netIncome,
            totalAssets,
            equity,
            totalDebt,
            financialExpenses,
            inventory: balance.inventory || 0,
            tradeReceivables: balance.trade_receivables || 0,
            tradePayables: balance.trade_payables || 0,
            supplies
          });
        }
      }

      setData(metrics);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ca-AD", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => {
    if (!isFinite(value)) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDays = (value: number) => {
    if (!isFinite(value)) return "N/A";
    return `${value.toFixed(0)} dies`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hi ha dades financeres disponibles.
        </CardContent>
      </Card>
    );
  }

  const latest = data[data.length - 1];

  // ROA, ROE calculations
  const calculateROA = (d: FinancialMetrics) => d.totalAssets > 0 ? d.ebit / d.totalAssets : 0;
  const calculateROE = (d: FinancialMetrics) => d.equity > 0 ? d.netIncome / d.equity : 0;
  
  // Break-even calculation
  const contributionMargin = latest.netTurnover - latest.variableCosts;
  const contributionMarginRatio = latest.netTurnover > 0 ? contributionMargin / latest.netTurnover : 0;
  const breakEvenSales = contributionMarginRatio > 0 ? latest.fixedCosts / contributionMarginRatio : 0;
  const safetyMargin = latest.netTurnover - breakEvenSales;
  const safetyMarginPercent = latest.netTurnover > 0 ? safetyMargin / latest.netTurnover : 0;

  // Leverage
  const financialLeverage = latest.equity > 0 ? latest.totalAssets / latest.equity : 0;
  const debtRatio = latest.totalAssets > 0 ? latest.totalDebt / latest.totalAssets : 0;
  const interestCoverage = latest.financialExpenses > 0 ? latest.ebit / latest.financialExpenses : Infinity;

  // Maturity periods (using 365 days)
  const inventoryDays = latest.supplies > 0 ? (latest.inventory / latest.supplies) * 365 : 0;
  const receivablesDays = latest.netTurnover > 0 ? (latest.tradeReceivables / latest.netTurnover) * 365 : 0;
  const payablesDays = latest.supplies > 0 ? (latest.tradePayables / latest.supplies) * 365 : 0;
  const cashCycle = inventoryDays + receivablesDays - payablesDays;

  // Auto-financing capacity
  const autoFinancingCapacity = latest.netIncome + (latest.fixedCosts * 0.3); // Approximation with depreciation

  // ROA/ROE chart data
  const roaRoeData = data.map(d => ({
    year: d.year,
    ROA: calculateROA(d),
    ROE: calculateROE(d)
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Rendibilitat - {companyName}</h2>

      <Tabs defaultValue="roa-roe" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="roa-roe" className="text-xs">ROA/ROE</TabsTrigger>
          <TabsTrigger value="break-even" className="text-xs">Punt Mort</TabsTrigger>
          <TabsTrigger value="leverage" className="text-xs">Palanquejament</TabsTrigger>
          <TabsTrigger value="maturity" className="text-xs">Períodes Maduració</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs">Resum</TabsTrigger>
        </TabsList>

        <TabsContent value="roa-roe" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  ROA (Rendibilitat Econòmica)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatPercent(calculateROA(latest))}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  EBIT / Actiu Total
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Mesura l'eficiència en l'ús dels actius per generar beneficis operatius
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Percent className="h-4 w-4 text-primary" />
                  ROE (Rendibilitat Financera)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatPercent(calculateROE(latest))}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Benefici Net / Fons Propis
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Rendibilitat per als accionistes sobre la seva inversió
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució ROA vs ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={roaRoeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => formatPercent(v)} />
                    <Line type="monotone" dataKey="ROA" stroke="hsl(var(--primary))" strokeWidth={2} name="ROA" />
                    <Line type="monotone" dataKey="ROE" stroke="hsl(var(--secondary))" strokeWidth={2} name="ROE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Descomposició DuPont del ROE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm font-medium">ROE</p>
                  <p className="text-2xl font-bold">{formatPercent(calculateROE(latest))}</p>
                </div>
                <div className="text-2xl">=</div>
                <div className="grid grid-cols-3 gap-4 w-full">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Marge Net</p>
                    <p className="text-lg font-bold">{formatPercent(latest.netTurnover > 0 ? latest.netIncome / latest.netTurnover : 0)}</p>
                    <p className="text-xs">BN / Vendes</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Rotació Actius</p>
                    <p className="text-lg font-bold">{(latest.totalAssets > 0 ? latest.netTurnover / latest.totalAssets : 0).toFixed(2)}x</p>
                    <p className="text-xs">Vendes / Actius</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Palanquejament</p>
                    <p className="text-lg font-bold">{financialLeverage.toFixed(2)}x</p>
                    <p className="text-xs">Actius / FP</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="break-even" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Punt Mort (Break-Even)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(breakEvenSales)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vendes mínimes per cobrir costos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Marge de Seguretat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${safetyMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(safetyMarginPercent)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(safetyMargin)} sobre punt mort
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anàlisi Cost-Volum-Benefici</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Vendes Actuals</p>
                    <p className="text-lg font-bold">{formatCurrency(latest.netTurnover)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Costos Variables</p>
                    <p className="text-lg font-bold">{formatCurrency(latest.variableCosts)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Marge de Contribució</p>
                    <p className="text-lg font-bold">{formatCurrency(contributionMargin)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm text-muted-foreground">Costos Fixos</p>
                    <p className="text-lg font-bold">{formatCurrency(latest.fixedCosts)}</p>
                  </div>
                </div>
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Ràtio Marge Contribució</p>
                  <p className="text-2xl font-bold">{formatPercent(contributionMarginRatio)}</p>
                  <p className="text-xs text-muted-foreground">Per cada € de venda, {formatCurrency(contributionMarginRatio)} contribueix a cobrir costos fixos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leverage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Palanquejament Financer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{financialLeverage.toFixed(2)}x</p>
                <p className="text-sm text-muted-foreground">Actiu / Fons Propis</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ràtio d'Endeutament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${debtRatio <= 0.6 ? 'text-green-600' : debtRatio <= 0.8 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {formatPercent(debtRatio)}
                </p>
                <p className="text-sm text-muted-foreground">Deute / Actiu Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cobertura d'Interessos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${interestCoverage >= 3 ? 'text-green-600' : interestCoverage >= 1.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {isFinite(interestCoverage) ? `${interestCoverage.toFixed(1)}x` : '∞'}
                </p>
                <p className="text-sm text-muted-foreground">EBIT / Despeses Financeres</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Efecte Palanquejament</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  L'efecte palanquejament mesura com el deute amplifica (o redueix) la rendibilitat pels accionistes.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${calculateROE(latest) > calculateROA(latest) ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <p className="text-sm font-medium">Efecte</p>
                    <p className="text-lg font-bold">
                      {calculateROE(latest) > calculateROA(latest) ? 'POSITIU' : 'NEGATIU'}
                    </p>
                    <p className="text-xs mt-1">
                      {calculateROE(latest) > calculateROA(latest) 
                        ? 'El deute amplifica la rendibilitat' 
                        : 'El cost del deute supera la rendibilitat dels actius'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Diferencial</p>
                    <p className="text-lg font-bold">{formatPercent(calculateROE(latest) - calculateROA(latest))}</p>
                    <p className="text-xs mt-1">ROE - ROA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maturity" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rotació Existències</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDays(inventoryDays)}</p>
                <p className="text-xs text-muted-foreground">Dies d'estoc mig</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Termini Cobrament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDays(receivablesDays)}</p>
                <p className="text-xs text-muted-foreground">Dies mig cobrament</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Termini Pagament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatDays(payablesDays)}</p>
                <p className="text-xs text-muted-foreground">Dies mig pagament</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cicle de Caixa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${cashCycle <= 0 ? 'text-green-600' : 'text-amber-600'}`}>
                  {formatDays(cashCycle)}
                </p>
                <p className="text-xs text-muted-foreground">Dies finançament necessari</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cicle d'Explotació i Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center space-x-2 py-4">
                <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded">
                  <p className="text-sm font-medium">Existències</p>
                  <p className="text-lg font-bold">{inventoryDays.toFixed(0)}d</p>
                </div>
                <span className="text-2xl">+</span>
                <div className="text-center p-3 bg-green-100 dark:bg-green-900/30 rounded">
                  <p className="text-sm font-medium">Cobrament</p>
                  <p className="text-lg font-bold">{receivablesDays.toFixed(0)}d</p>
                </div>
                <span className="text-2xl">-</span>
                <div className="text-center p-3 bg-amber-100 dark:bg-amber-900/30 rounded">
                  <p className="text-sm font-medium">Pagament</p>
                  <p className="text-lg font-bold">{payablesDays.toFixed(0)}d</p>
                </div>
                <span className="text-2xl">=</span>
                <div className={`text-center p-3 rounded ${cashCycle <= 0 ? 'bg-green-200 dark:bg-green-800/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <p className="text-sm font-medium">Cicle Caixa</p>
                  <p className="text-lg font-bold">{cashCycle.toFixed(0)}d</p>
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4">
                {cashCycle <= 0 
                  ? "L'empresa es finança amb els proveïdors - excel·lent gestió del capital circulant" 
                  : `L'empresa necessita finançar ${cashCycle.toFixed(0)} dies del seu cicle operatiu`}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resum Executiu de Rendibilitat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">ROE</p>
                  <p className="text-2xl font-bold">{formatPercent(calculateROE(latest))}</p>
                  <p className={`text-xs ${calculateROE(latest) >= 0.15 ? 'text-green-600' : calculateROE(latest) >= 0.08 ? 'text-amber-600' : 'text-red-600'}`}>
                    {calculateROE(latest) >= 0.15 ? 'Excel·lent' : calculateROE(latest) >= 0.08 ? 'Acceptable' : 'Millorable'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">ROA</p>
                  <p className="text-2xl font-bold">{formatPercent(calculateROA(latest))}</p>
                  <p className={`text-xs ${calculateROA(latest) >= 0.10 ? 'text-green-600' : calculateROA(latest) >= 0.05 ? 'text-amber-600' : 'text-red-600'}`}>
                    {calculateROA(latest) >= 0.10 ? 'Excel·lent' : calculateROA(latest) >= 0.05 ? 'Acceptable' : 'Millorable'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Marge Seguretat</p>
                  <p className="text-2xl font-bold">{formatPercent(safetyMarginPercent)}</p>
                  <p className={`text-xs ${safetyMarginPercent >= 0.20 ? 'text-green-600' : safetyMarginPercent >= 0.10 ? 'text-amber-600' : 'text-red-600'}`}>
                    {safetyMarginPercent >= 0.20 ? 'Segur' : safetyMarginPercent >= 0.10 ? 'Moderat' : 'Risc'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Endeutament</p>
                  <p className="text-2xl font-bold">{formatPercent(debtRatio)}</p>
                  <p className={`text-xs ${debtRatio <= 0.5 ? 'text-green-600' : debtRatio <= 0.7 ? 'text-amber-600' : 'text-red-600'}`}>
                    {debtRatio <= 0.5 ? 'Conservador' : debtRatio <= 0.7 ? 'Moderat' : 'Alt'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Cicle Caixa</p>
                  <p className="text-2xl font-bold">{cashCycle.toFixed(0)}d</p>
                  <p className={`text-xs ${cashCycle <= 30 ? 'text-green-600' : cashCycle <= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {cashCycle <= 30 ? 'Òptim' : cashCycle <= 60 ? 'Normal' : 'A millorar'}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Autofinançament</p>
                  <p className="text-2xl font-bold">{formatCurrency(autoFinancingCapacity)}</p>
                  <p className="text-xs text-muted-foreground">Capacitat anual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
