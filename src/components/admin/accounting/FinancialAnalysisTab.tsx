import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, PieChart, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { ZScoreAnalysis } from "./ZScoreAnalysis";
import EBITEBITDAAnalysis from "./EBITEBITDAAnalysis";
import AddedValueAnalysis from "./AddedValueAnalysis";
import TreasuryMovements from "./TreasuryMovements";
import FinancingStatement from "./FinancingStatement";
import EconomicFinancialDashboard from "./EconomicFinancialDashboard";

interface FinancialAnalysisTabProps {
  companyId: string;
  companyName: string;
}

interface FinancialData {
  year: number;
  netTurnover: number;
  supplies: number;
  personnelExpenses: number;
  depreciation: number;
  otherExpenses: number;
  financialExpenses: number;
  financialIncome: number;
  corporateTax: number;
  totalAssets: number;
  currentAssets: number;
  inventory: number;
  tradeReceivables: number;
  cash: number;
  equity: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  tradePayables: number;
}

export function FinancialAnalysisTab({ companyId, companyName }: FinancialAnalysisTabProps) {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, [companyId]);

  const fetchFinancialData = async () => {
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

      const financialData: FinancialData[] = [];

      for (const stmt of statements) {
        const [{ data: balance }, { data: income }] = await Promise.all([
          supabase.from("balance_sheets").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("income_statements").select("*").eq("statement_id", stmt.id).single()
        ]);

        if (balance && income) {
          financialData.push({
            year: stmt.fiscal_year,
            netTurnover: income.net_turnover || 0,
            supplies: Math.abs(income.supplies || 0),
            personnelExpenses: Math.abs(income.personnel_expenses || 0),
            depreciation: Math.abs(income.depreciation || 0),
            otherExpenses: Math.abs(income.other_operating_expenses || 0),
            financialExpenses: Math.abs(income.financial_expenses || 0),
            financialIncome: income.financial_income || 0,
            corporateTax: Math.abs(income.corporate_tax || 0),
            totalAssets: (balance.tangible_assets || 0) + (balance.intangible_assets || 0) + 
                        (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                        (balance.cash_equivalents || 0) + (balance.long_term_financial_investments || 0),
            currentAssets: (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                          (balance.cash_equivalents || 0) + (balance.short_term_financial_investments || 0),
            inventory: balance.inventory || 0,
            tradeReceivables: balance.trade_receivables || 0,
            cash: balance.cash_equivalents || 0,
            equity: (balance.share_capital || 0) + (balance.share_premium || 0) + 
                   (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) + 
                   (balance.retained_earnings || 0) + (balance.current_year_result || 0),
            currentLiabilities: (balance.short_term_debts || 0) + (balance.trade_payables || 0) + 
                               (balance.other_creditors || 0),
            nonCurrentLiabilities: (balance.long_term_debts || 0) + (balance.long_term_provisions || 0),
            tradePayables: balance.trade_payables || 0
          });
        }
      }

      setData(financialData);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEBITDA = (d: FinancialData) => {
    return d.netTurnover - d.supplies - d.personnelExpenses - d.otherExpenses;
  };

  const calculateEBIT = (d: FinancialData) => {
    return calculateEBITDA(d) - d.depreciation;
  };

  const calculateNetIncome = (d: FinancialData) => {
    return calculateEBIT(d) - d.financialExpenses + d.financialIncome - d.corporateTax;
  };

  const calculateValueAdded = (d: FinancialData) => {
    return d.netTurnover - d.supplies;
  };

  const calculateWorkingCapital = (d: FinancialData) => {
    return d.currentAssets - d.currentLiabilities;
  };

  const calculateNOF = (d: FinancialData) => {
    return d.inventory + d.tradeReceivables - d.tradePayables;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ca-AD", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
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
          No hi ha dades financeres disponibles per a aquesta empresa.
        </CardContent>
      </Card>
    );
  }

  const latestData = data[data.length - 1];
  const previousData = data.length > 1 ? data[data.length - 2] : null;

  const ebitdaData = data.map(d => ({
    year: d.year,
    EBITDA: calculateEBITDA(d),
    EBIT: calculateEBIT(d),
    "Resultat Net": calculateNetIncome(d)
  }));

  const marginData = data.map(d => ({
    year: d.year,
    "Marge Brut": d.netTurnover > 0 ? ((d.netTurnover - d.supplies) / d.netTurnover) : 0,
    "Marge EBITDA": d.netTurnover > 0 ? (calculateEBITDA(d) / d.netTurnover) : 0,
    "Marge Net": d.netTurnover > 0 ? (calculateNetIncome(d) / d.netTurnover) : 0
  }));

  const workingCapitalData = data.map(d => ({
    year: d.year,
    "Fons Maniobra": calculateWorkingCapital(d),
    "NOF": calculateNOF(d),
    "Tresoreria Neta": calculateWorkingCapital(d) - calculateNOF(d)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Anàlisi Financera - {companyName}</h2>
      </div>

      <Tabs defaultValue="ebitda" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="ebitda" className="text-xs">EBIT/EBITDA</TabsTrigger>
          <TabsTrigger value="ebit-ebitda-detail" className="text-xs">Anàlisi EBIT/EBITDA</TabsTrigger>
          <TabsTrigger value="margins" className="text-xs">Marges</TabsTrigger>
          <TabsTrigger value="working-capital" className="text-xs">Capital Circulant</TabsTrigger>
          <TabsTrigger value="value-added" className="text-xs">Valor Afegit</TabsTrigger>
          <TabsTrigger value="value-added-detail" className="text-xs">Anàlisi Valor Afegit</TabsTrigger>
          <TabsTrigger value="treasury" className="text-xs">Fluxos Tresoreria</TabsTrigger>
          <TabsTrigger value="financing" className="text-xs">Quadre Finançament</TabsTrigger>
          <TabsTrigger value="zscore" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Índex Z
          </TabsTrigger>
          <TabsTrigger value="economic-dashboard" className="text-xs">Quadre Mando</TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="ebitda" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  EBITDA {latestData.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateEBITDA(latestData))}</p>
                {previousData && (
                  <p className={`text-sm flex items-center gap-1 ${calculateEBITDA(latestData) >= calculateEBITDA(previousData) ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateEBITDA(latestData) >= calculateEBITDA(previousData) ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {formatPercent((calculateEBITDA(latestData) - calculateEBITDA(previousData)) / Math.abs(calculateEBITDA(previousData) || 1))} vs {previousData.year}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  EBIT {latestData.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateEBIT(latestData))}</p>
                <p className="text-sm text-muted-foreground">
                  Marge: {latestData.netTurnover > 0 ? formatPercent(calculateEBIT(latestData) / latestData.netTurnover) : 'N/A'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Resultat Net {latestData.year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateNetIncome(latestData))}</p>
                <p className="text-sm text-muted-foreground">
                  Marge: {latestData.netTurnover > 0 ? formatPercent(calculateNetIncome(latestData) / latestData.netTurnover) : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució EBITDA / EBIT / Resultat Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ebitdaData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="EBITDA" fill="hsl(var(--primary))" name="EBITDA" />
                    <Bar dataKey="EBIT" fill="hsl(var(--secondary))" name="EBIT" />
                    <Bar dataKey="Resultat Net" fill="hsl(var(--accent))" name="Resultat Net" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quadre Analític del Compte de Resultats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Concepte</th>
                      {data.map(d => (
                        <th key={d.year} className="text-right p-2">{d.year}</th>
                      ))}
                      {data.map(d => (
                        <th key={`${d.year}-pct`} className="text-right p-2">% {d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Vendes Netes</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.netTurnover)}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">100%</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Aprovisionaments</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.supplies)})</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent(d.supplies / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <td className="p-2 font-medium">= Marge Brut</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-medium">{formatCurrency(d.netTurnover - d.supplies)}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent((d.netTurnover - d.supplies) / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Despeses Personal</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.personnelExpenses)})</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent(d.personnelExpenses / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Altres Despeses</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.otherExpenses)})</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent(d.otherExpenses / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b bg-primary/10">
                      <td className="p-2 font-bold">= EBITDA</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-bold">{formatCurrency(calculateEBITDA(d))}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2 font-bold">{d.netTurnover > 0 ? formatPercent(calculateEBITDA(d) / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Amortitzacions</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.depreciation)})</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent(d.depreciation / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b bg-primary/10">
                      <td className="p-2 font-bold">= EBIT</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-bold">{formatCurrency(calculateEBIT(d))}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2 font-bold">{d.netTurnover > 0 ? formatPercent(calculateEBIT(d) / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(+/-) Resultat Financer</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.financialIncome - d.financialExpenses)}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent((d.financialIncome - d.financialExpenses) / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Impost Societats</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.corporateTax)})</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2">{d.netTurnover > 0 ? formatPercent(d.corporateTax / d.netTurnover) : '-'}</td>)}
                    </tr>
                    <tr className="bg-green-100 dark:bg-green-900/30">
                      <td className="p-2 font-bold">= RESULTAT NET</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-bold">{formatCurrency(calculateNetIncome(d))}</td>)}
                      {data.map(d => <td key={`${d.year}-pct`} className="text-right p-2 font-bold">{d.netTurnover > 0 ? formatPercent(calculateNetIncome(d) / d.netTurnover) : '-'}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució dels Marges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marginData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => formatPercent(v)} />
                    <Line type="monotone" dataKey="Marge Brut" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Marge EBITDA" stroke="hsl(var(--secondary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="Marge Net" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="working-capital" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Fons de Maniobra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateWorkingCapital(latestData))}</p>
                <p className={`text-sm ${calculateWorkingCapital(latestData) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculateWorkingCapital(latestData) >= 0 ? 'Positiu - Bona salut financera' : 'Negatiu - Risc de liquiditat'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">NOF (Necessitats Operatives)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateNOF(latestData))}</p>
                <p className="text-sm text-muted-foreground">
                  Existències + Clients - Proveïdors
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tresoreria Neta</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(calculateWorkingCapital(latestData) - calculateNOF(latestData))}</p>
                <p className="text-sm text-muted-foreground">
                  FM - NOF
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució Capital Circulant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workingCapitalData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Area type="monotone" dataKey="Fons Maniobra" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="NOF" stackId="2" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="Tresoreria Neta" stroke="hsl(var(--accent))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value-added" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anàlisi del Valor Afegit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Concepte</th>
                      {data.map(d => (
                        <th key={d.year} className="text-right p-2">{d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Vendes Netes</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.netTurnover)}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">(-) Consums</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 text-red-600">({formatCurrency(d.supplies)})</td>)}
                    </tr>
                    <tr className="border-b bg-primary/10">
                      <td className="p-2 font-bold">= Valor Afegit Brut</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-bold">{formatCurrency(calculateValueAdded(d))}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">• Personal ({data.map(d => d.netTurnover > 0 ? formatPercent(d.personnelExpenses / calculateValueAdded(d)) : '-').join(' / ')})</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.personnelExpenses)}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">• Amortitzacions</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.depreciation)}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">• Creditors Financers</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.financialExpenses)}</td>)}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 pl-4">• Hisenda</td>
                      {data.map(d => <td key={d.year} className="text-right p-2">{formatCurrency(d.corporateTax)}</td>)}
                    </tr>
                    <tr className="bg-green-100 dark:bg-green-900/30">
                      <td className="p-2 pl-4 font-bold">• Accionistes (Benefici Net)</td>
                      {data.map(d => <td key={d.year} className="text-right p-2 font-bold">{formatCurrency(calculateNetIncome(d))}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Vendes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(latestData.netTurnover)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(calculateEBITDA(latestData))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Fons Maniobra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(calculateWorkingCapital(latestData))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground">Tresoreria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{formatCurrency(latestData.cash)}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="zscore">
          <ZScoreAnalysis companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="ebit-ebitda-detail">
          <EBITEBITDAAnalysis companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="value-added-detail">
          <AddedValueAnalysis companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="treasury">
          <TreasuryMovements companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="financing">
          <FinancingStatement companyId={companyId} companyName={companyName} />
        </TabsContent>

        <TabsContent value="economic-dashboard">
          <EconomicFinancialDashboard companyId={companyId} companyName={companyName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
