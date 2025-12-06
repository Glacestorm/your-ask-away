import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calculator, TrendingUp, Building2, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface ValuationTabProps {
  companyId: string;
  companyName: string;
}

interface FinancialData {
  year: number;
  totalAssets: number;
  intangibleAssets: number;
  goodwill: number;
  equity: number;
  netIncome: number;
  ebitda: number;
  netTurnover: number;
  operatingCashFlow: number;
}

export function ValuationTab({ companyId, companyName }: ValuationTabProps) {
  const [data, setData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // DCF Parameters
  const [wacc, setWacc] = useState(10);
  const [growthRate, setGrowthRate] = useState(2);
  const [projectionYears, setProjectionYears] = useState(5);
  
  // Multiples
  const [sectorEVEBITDA, setSectorEVEBITDA] = useState(8);
  const [sectorPER, setSectorPER] = useState(15);

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

      const financialData: FinancialData[] = [];

      for (const stmt of statements) {
        const [{ data: balance }, { data: income }, { data: cashFlow }] = await Promise.all([
          supabase.from("balance_sheets").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("income_statements").select("*").eq("statement_id", stmt.id).single(),
          supabase.from("cash_flow_statements").select("*").eq("statement_id", stmt.id).single()
        ]);

        if (balance && income) {
          const netTurnover = income.net_turnover || 0;
          const supplies = Math.abs(income.supplies || 0);
          const personnelExpenses = Math.abs(income.personnel_expenses || 0);
          const otherExpenses = Math.abs(income.other_operating_expenses || 0);
          const depreciation = Math.abs(income.depreciation || 0);
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

          financialData.push({
            year: stmt.fiscal_year,
            totalAssets,
            intangibleAssets: balance.intangible_assets || 0,
            goodwill: balance.goodwill || 0,
            equity,
            netIncome,
            ebitda,
            netTurnover,
            operatingCashFlow: cashFlow?.operating_result || ebitda * 0.8
          });
        }
      }

      setData(financialData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ca-AD", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
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

  // Net Asset Value (Actiu Net Real)
  const netAssetValue = latest.equity;
  const adjustedNetAssetValue = latest.equity - latest.intangibleAssets - latest.goodwill;

  // Substantial Value (Valor Substancial)
  const substantialValue = latest.totalAssets - latest.intangibleAssets;

  // Multiples Valuation
  const evEbitdaValue = latest.ebitda * sectorEVEBITDA;
  const perValue = latest.netIncome * sectorPER;

  // DCF Calculation
  const calculateDCF = () => {
    const baseFlow = latest.operatingCashFlow;
    let presentValue = 0;
    const projectedFlows: { year: number; flow: number; discounted: number }[] = [];

    for (let i = 1; i <= projectionYears; i++) {
      const projectedFlow = baseFlow * Math.pow(1 + growthRate / 100, i);
      const discountFactor = Math.pow(1 + wacc / 100, i);
      const discountedFlow = projectedFlow / discountFactor;
      presentValue += discountedFlow;
      projectedFlows.push({
        year: latest.year + i,
        flow: projectedFlow,
        discounted: discountedFlow
      });
    }

    // Terminal Value
    const terminalFlow = baseFlow * Math.pow(1 + growthRate / 100, projectionYears + 1);
    const terminalValue = terminalFlow / ((wacc - growthRate) / 100);
    const discountedTerminal = terminalValue / Math.pow(1 + wacc / 100, projectionYears);
    const totalValue = presentValue + discountedTerminal;

    return { presentValue, terminalValue, discountedTerminal, totalValue, projectedFlows };
  };

  const dcf = calculateDCF();

  // Average valuation
  const valuations = [
    { method: "Actiu Net Comptable", value: netAssetValue },
    { method: "Actiu Net Ajustat", value: adjustedNetAssetValue },
    { method: "Valor Substancial", value: substantialValue },
    { method: `EV/EBITDA (${sectorEVEBITDA}x)`, value: evEbitdaValue },
    { method: `PER (${sectorPER}x)`, value: perValue },
    { method: "DCF", value: dcf.totalValue }
  ];

  const averageValuation = valuations.reduce((sum, v) => sum + v.value, 0) / valuations.length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Valoracions - {companyName}</h2>

      <Tabs defaultValue="patrimony" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patrimony" className="text-xs">Patrimoni</TabsTrigger>
          <TabsTrigger value="multiples" className="text-xs">Múltiples</TabsTrigger>
          <TabsTrigger value="dcf" className="text-xs">DCF</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs">Resum</TabsTrigger>
        </TabsList>

        <TabsContent value="patrimony" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Actiu Net Comptable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(netAssetValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fons Propis segons balanç
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" />
                  Actiu Net Ajustat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(adjustedNetAssetValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sense intangibles ni fons de comerç
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Valor Substancial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(substantialValue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Actiu funcional tangible
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Desglossament del Patrimoni</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Actiu Total</span>
                  <span className="font-bold">{formatCurrency(latest.totalAssets)}</span>
                </div>
                <div className="flex justify-between p-2 pl-6">
                  <span className="text-muted-foreground">(-) Intangibles</span>
                  <span className="text-red-600">({formatCurrency(latest.intangibleAssets)})</span>
                </div>
                <div className="flex justify-between p-2 pl-6">
                  <span className="text-muted-foreground">(-) Fons de Comerç</span>
                  <span className="text-red-600">({formatCurrency(latest.goodwill)})</span>
                </div>
                <div className="flex justify-between p-2 bg-primary/10 rounded">
                  <span className="font-medium">= Valor Substancial</span>
                  <span className="font-bold">{formatCurrency(substantialValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multiples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paràmetres Sectorials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ev-ebitda">Múltiple EV/EBITDA sector</Label>
                  <Input
                    id="ev-ebitda"
                    type="number"
                    value={sectorEVEBITDA}
                    onChange={(e) => setSectorEVEBITDA(Number(e.target.value))}
                    step={0.5}
                    min={1}
                    max={30}
                  />
                </div>
                <div>
                  <Label htmlFor="per">Múltiple PER sector</Label>
                  <Input
                    id="per"
                    type="number"
                    value={sectorPER}
                    onChange={(e) => setSectorPER(Number(e.target.value))}
                    step={0.5}
                    min={1}
                    max={50}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valoració EV/EBITDA</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(evEbitdaValue)}</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>EBITDA: {formatCurrency(latest.ebitda)}</p>
                  <p>Múltiple: {sectorEVEBITDA}x</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valoració PER</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(perValue)}</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>Benefici Net: {formatCurrency(latest.netIncome)}</p>
                  <p>Múltiple: {sectorPER}x</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Comparació de Múltiples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { method: "EV/EBITDA", value: evEbitdaValue },
                    { method: "PER", value: perValue }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="method" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dcf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Paràmetres DCF</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="wacc">WACC (%)</Label>
                  <Input
                    id="wacc"
                    type="number"
                    value={wacc}
                    onChange={(e) => setWacc(Number(e.target.value))}
                    step={0.5}
                    min={1}
                    max={30}
                  />
                </div>
                <div>
                  <Label htmlFor="growth">Creixement perpetu (%)</Label>
                  <Input
                    id="growth"
                    type="number"
                    value={growthRate}
                    onChange={(e) => setGrowthRate(Number(e.target.value))}
                    step={0.5}
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="years">Anys projecció</Label>
                  <Input
                    id="years"
                    type="number"
                    value={projectionYears}
                    onChange={(e) => setProjectionYears(Number(e.target.value))}
                    min={3}
                    max={10}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor Present Fluxos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(dcf.presentValue)}</p>
                <p className="text-sm text-muted-foreground">Suma fluxos descomptats</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor Terminal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(dcf.discountedTerminal)}</p>
                <p className="text-sm text-muted-foreground">Valor residual descomptat</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Valor Total DCF</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(dcf.totalValue)}</p>
                <p className="text-sm text-muted-foreground">Valoració per fluxos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projecció de Fluxos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dcf.projectedFlows}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="flow" fill="hsl(var(--primary))" name="Flux Projectat" />
                    <Bar dataKey="discounted" fill="hsl(var(--secondary))" name="Flux Descomptat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resum de Valoracions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={valuations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="method" className="text-xs" width={120} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Valoració Mitjana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatCurrency(averageValuation)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Mitjana de tots els mètodes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Rang de Valoració</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mínim:</span>
                    <span className="font-bold">{formatCurrency(Math.min(...valuations.map(v => v.value)))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Màxim:</span>
                    <span className="font-bold">{formatCurrency(Math.max(...valuations.map(v => v.value)))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detall per Mètode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mètode</th>
                      <th className="text-right p-2">Valoració</th>
                      <th className="text-right p-2">vs Mitjana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuations.map((v, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">{v.method}</td>
                        <td className="text-right p-2 font-bold">{formatCurrency(v.value)}</td>
                        <td className={`text-right p-2 ${v.value >= averageValuation ? 'text-green-600' : 'text-red-600'}`}>
                          {((v.value - averageValuation) / averageValuation * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
