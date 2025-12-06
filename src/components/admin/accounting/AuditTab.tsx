import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

interface AuditTabProps {
  companyId: string;
  companyName: string;
}

interface AuditMetrics {
  year: number;
  // Balance metrics
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  // Leverage metrics
  debtRatio: number;
  equityRatio: number;
  financialLeverage: number;
  interestCoverage: number;
  // Efficiency metrics
  inventoryDays: number;
  receivablesDays: number;
  payablesDays: number;
  assetTurnover: number;
  // Raw data for calculations
  totalAssets: number;
  currentAssets: number;
  inventory: number;
  cash: number;
  currentLiabilities: number;
  totalLiabilities: number;
  equity: number;
  netTurnover: number;
  ebit: number;
  financialExpenses: number;
  tradeReceivables: number;
  tradePayables: number;
  supplies: number;
}

interface AlertItem {
  metric: string;
  value: number;
  benchmark: number;
  status: 'good' | 'warning' | 'danger';
  message: string;
}

export function AuditTab({ companyId, companyName }: AuditTabProps) {
  const [data, setData] = useState<AuditMetrics[]>([]);
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

      const metrics: AuditMetrics[] = [];

      for (const stmt of statements) {
        const [{ data: balance }, { data: income }] = await Promise.all([
          supabase.from("balance_sheets").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("income_statements").select("*").eq("statement_id", stmt.id).single()
        ]);

        if (balance && income) {
          const netTurnover = income.net_turnover || 0;
          const supplies = Math.abs(income.supplies || 0);
          const personnelExpenses = Math.abs(income.personnel_expenses || 0);
          const otherExpenses = Math.abs(income.other_operating_expenses || 0);
          const depreciation = Math.abs(income.depreciation || 0);
          const financialExpenses = Math.abs(income.financial_expenses || 0);

          const ebitda = netTurnover - supplies - personnelExpenses - otherExpenses;
          const ebit = ebitda - depreciation;

          const totalAssets = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) + 
                            (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                            (balance.cash_equivalents || 0) + (balance.long_term_financial_investments || 0);

          const currentAssets = (balance.inventory || 0) + (balance.trade_receivables || 0) + 
                               (balance.cash_equivalents || 0) + (balance.short_term_financial_investments || 0);

          const equity = (balance.share_capital || 0) + (balance.share_premium || 0) + 
                        (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) + 
                        (balance.retained_earnings || 0) + (balance.current_year_result || 0);

          const currentLiabilities = (balance.short_term_debts || 0) + (balance.trade_payables || 0) + 
                                    (balance.other_creditors || 0);

          const totalLiabilities = currentLiabilities + (balance.long_term_debts || 0) + 
                                  (balance.long_term_provisions || 0);

          const inventory = balance.inventory || 0;
          const cash = balance.cash_equivalents || 0;
          const tradeReceivables = balance.trade_receivables || 0;
          const tradePayables = balance.trade_payables || 0;

          // Calculate ratios
          const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
          const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
          const cashRatio = currentLiabilities > 0 ? cash / currentLiabilities : 0;
          const workingCapital = currentAssets - currentLiabilities;

          const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
          const equityRatio = totalAssets > 0 ? equity / totalAssets : 0;
          const financialLeverage = equity > 0 ? totalAssets / equity : 0;
          const interestCoverage = financialExpenses > 0 ? ebit / financialExpenses : Infinity;

          const inventoryDays = supplies > 0 ? (inventory / supplies) * 365 : 0;
          const receivablesDays = netTurnover > 0 ? (tradeReceivables / netTurnover) * 365 : 0;
          const payablesDays = supplies > 0 ? (tradePayables / supplies) * 365 : 0;
          const assetTurnover = totalAssets > 0 ? netTurnover / totalAssets : 0;

          metrics.push({
            year: stmt.fiscal_year,
            currentRatio,
            quickRatio,
            cashRatio,
            workingCapital,
            debtRatio,
            equityRatio,
            financialLeverage,
            interestCoverage,
            inventoryDays,
            receivablesDays,
            payablesDays,
            assetTurnover,
            totalAssets,
            currentAssets,
            inventory,
            cash,
            currentLiabilities,
            totalLiabilities,
            equity,
            netTurnover,
            ebit,
            financialExpenses,
            tradeReceivables,
            tradePayables,
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
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatRatio = (value: number) => {
    if (!isFinite(value)) return "∞";
    return value.toFixed(2);
  };

  const getStatus = (value: number, goodMin: number, goodMax: number, warningMin: number, warningMax: number): 'good' | 'warning' | 'danger' => {
    if (value >= goodMin && value <= goodMax) return 'good';
    if (value >= warningMin && value <= warningMax) return 'warning';
    return 'danger';
  };

  const getStatusBadge = (status: 'good' | 'warning' | 'danger') => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Correcte</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Atenció</Badge>;
      case 'danger':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Alerta</Badge>;
    }
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
  const previous = data.length > 1 ? data[data.length - 2] : null;

  // Generate alerts
  const alerts: AlertItem[] = [
    {
      metric: "Ràtio Corrent",
      value: latest.currentRatio,
      benchmark: 1.5,
      status: getStatus(latest.currentRatio, 1.5, 3, 1, 1.5),
      message: latest.currentRatio < 1 ? "Risc de liquiditat immediat" : latest.currentRatio < 1.5 ? "Liquiditat ajustada" : "Liquiditat adequada"
    },
    {
      metric: "Acid Test",
      value: latest.quickRatio,
      benchmark: 1,
      status: getStatus(latest.quickRatio, 1, 2, 0.7, 1),
      message: latest.quickRatio < 0.7 ? "Dependència d'existències" : latest.quickRatio < 1 ? "Liquiditat limitada" : "Bona capacitat de pagament"
    },
    {
      metric: "Endeutament",
      value: latest.debtRatio,
      benchmark: 0.6,
      status: getStatus(latest.debtRatio, 0, 0.5, 0.5, 0.7),
      message: latest.debtRatio > 0.7 ? "Endeutament excessiu" : latest.debtRatio > 0.5 ? "Endeutament moderat" : "Endeutament conservador"
    },
    {
      metric: "Cobertura Interessos",
      value: latest.interestCoverage,
      benchmark: 3,
      status: isFinite(latest.interestCoverage) ? getStatus(latest.interestCoverage, 3, Infinity, 1.5, 3) : 'good',
      message: !isFinite(latest.interestCoverage) ? "Sense deute financer" : latest.interestCoverage < 1.5 ? "Risc de cobertura" : latest.interestCoverage < 3 ? "Cobertura ajustada" : "Bona cobertura"
    },
    {
      metric: "Rotació Estocs",
      value: latest.inventoryDays,
      benchmark: 60,
      status: getStatus(latest.inventoryDays, 0, 60, 60, 90),
      message: latest.inventoryDays > 90 ? "Estocs excessius" : latest.inventoryDays > 60 ? "Estocs elevats" : "Gestió d'estocs eficient"
    },
    {
      metric: "Termini Cobrament",
      value: latest.receivablesDays,
      benchmark: 45,
      status: getStatus(latest.receivablesDays, 0, 45, 45, 75),
      message: latest.receivablesDays > 75 ? "Cobrament molt lent" : latest.receivablesDays > 45 ? "Cobrament lent" : "Cobrament eficient"
    }
  ];

  const dangerAlerts = alerts.filter(a => a.status === 'danger');
  const warningAlerts = alerts.filter(a => a.status === 'warning');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Auditoria Financera - {companyName}</h2>

      {/* Alert Summary */}
      {(dangerAlerts.length > 0 || warningAlerts.length > 0) && (
        <Card className={dangerAlerts.length > 0 ? "border-red-500" : "border-yellow-500"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${dangerAlerts.length > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
              Alertes Detectades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dangerAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <span className="font-medium">{alert.metric}</span>
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
              {warningAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <span className="font-medium">{alert.metric}</span>
                  <span className="text-sm">{alert.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="liquidity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="liquidity" className="text-xs">Liquiditat</TabsTrigger>
          <TabsTrigger value="leverage" className="text-xs">Endeutament</TabsTrigger>
          <TabsTrigger value="efficiency" className="text-xs">Eficiència</TabsTrigger>
          <TabsTrigger value="deviations" className="text-xs">Desviacions</TabsTrigger>
        </TabsList>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Ràtio Corrent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.currentRatio)}</p>
                {getStatusBadge(getStatus(latest.currentRatio, 1.5, 3, 1, 1.5))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Acid Test</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.quickRatio)}</p>
                {getStatusBadge(getStatus(latest.quickRatio, 1, 2, 0.7, 1))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Ràtio Tresoreria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.cashRatio)}</p>
                {getStatusBadge(getStatus(latest.cashRatio, 0.2, 0.5, 0.1, 0.2))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Fons Maniobra</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(latest.workingCapital)}</p>
                {getStatusBadge(latest.workingCapital > 0 ? 'good' : 'danger')}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució Ràtios de Liquiditat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <ReferenceLine y={1.5} stroke="green" strokeDasharray="3 3" label="Òptim" />
                    <ReferenceLine y={1} stroke="red" strokeDasharray="3 3" label="Mínim" />
                    <Line type="monotone" dataKey="currentRatio" stroke="hsl(var(--primary))" strokeWidth={2} name="Ràtio Corrent" />
                    <Line type="monotone" dataKey="quickRatio" stroke="hsl(var(--secondary))" strokeWidth={2} name="Acid Test" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leverage" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Ràtio Endeutament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.debtRatio)}</p>
                {getStatusBadge(getStatus(latest.debtRatio, 0, 0.5, 0.5, 0.7))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Autonomia Financera</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.equityRatio)}</p>
                {getStatusBadge(getStatus(latest.equityRatio, 0.4, 1, 0.3, 0.4))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Palanquejament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.financialLeverage)}x</p>
                {getStatusBadge(getStatus(latest.financialLeverage, 1, 2.5, 2.5, 4))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Cobertura Interessos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{isFinite(latest.interestCoverage) ? `${formatRatio(latest.interestCoverage)}x` : '∞'}</p>
                {getStatusBadge(isFinite(latest.interestCoverage) ? getStatus(latest.interestCoverage, 3, Infinity, 1.5, 3) : 'good')}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estructura Finançament</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => formatPercent(v)} />
                    <Bar dataKey="equityRatio" stackId="a" fill="hsl(var(--primary))" name="Fons Propis" />
                    <Bar dataKey="debtRatio" stackId="a" fill="hsl(var(--destructive))" name="Deute" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Dies Existències</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{latest.inventoryDays.toFixed(0)}d</p>
                {getStatusBadge(getStatus(latest.inventoryDays, 0, 60, 60, 90))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Dies Cobrament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{latest.receivablesDays.toFixed(0)}d</p>
                {getStatusBadge(getStatus(latest.receivablesDays, 0, 45, 45, 75))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Dies Pagament</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{latest.payablesDays.toFixed(0)}d</p>
                <Badge variant="outline">Referència: 45d</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Rotació Actius</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.assetTurnover)}x</p>
                {getStatusBadge(getStatus(latest.assetTurnover, 1, Infinity, 0.5, 1))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolució Períodes de Maduració</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => `${v.toFixed(0)} dies`} />
                    <Line type="monotone" dataKey="inventoryDays" stroke="hsl(var(--primary))" strokeWidth={2} name="Existències" />
                    <Line type="monotone" dataKey="receivablesDays" stroke="hsl(var(--secondary))" strokeWidth={2} name="Cobrament" />
                    <Line type="monotone" dataKey="payablesDays" stroke="hsl(var(--accent))" strokeWidth={2} name="Pagament" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deviations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Anàlisi de Desviacions Interanuals</CardTitle>
            </CardHeader>
            <CardContent>
              {previous ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Mètrica</th>
                        <th className="text-right p-2">{previous.year}</th>
                        <th className="text-right p-2">{latest.year}</th>
                        <th className="text-right p-2">Variació</th>
                        <th className="text-center p-2">Tendència</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Actiu Total", prev: previous.totalAssets, curr: latest.totalAssets, format: formatCurrency },
                        { name: "Fons Propis", prev: previous.equity, curr: latest.equity, format: formatCurrency },
                        { name: "Vendes", prev: previous.netTurnover, curr: latest.netTurnover, format: formatCurrency },
                        { name: "Ràtio Corrent", prev: previous.currentRatio, curr: latest.currentRatio, format: formatRatio },
                        { name: "Acid Test", prev: previous.quickRatio, curr: latest.quickRatio, format: formatRatio },
                        { name: "Endeutament", prev: previous.debtRatio, curr: latest.debtRatio, format: formatPercent },
                        { name: "Dies Existències", prev: previous.inventoryDays, curr: latest.inventoryDays, format: (v: number) => `${v.toFixed(0)}d` },
                        { name: "Dies Cobrament", prev: previous.receivablesDays, curr: latest.receivablesDays, format: (v: number) => `${v.toFixed(0)}d` }
                      ].map((row, i) => {
                        const variation = row.prev !== 0 ? ((row.curr - row.prev) / Math.abs(row.prev)) * 100 : 0;
                        return (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="text-right p-2">{row.format(row.prev)}</td>
                            <td className="text-right p-2">{row.format(row.curr)}</td>
                            <td className={`text-right p-2 ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                            </td>
                            <td className="text-center p-2">
                              {variation >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600 inline" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 inline" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">Es necessiten almenys 2 anys per calcular desviacions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
