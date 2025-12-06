import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ZScoreAnalysisProps {
  companyId: string;
  companyName: string;
}

interface ZScoreData {
  year: number;
  workingCapital: number;
  totalAssets: number;
  retainedEarnings: number;
  ebit: number;
  marketValueEquity: number;
  totalLiabilities: number;
  sales: number;
  zScore: number;
  x1: number;
  x2: number;
  x3: number;
  x4: number;
  x5: number;
}

export function ZScoreAnalysis({ companyId, companyName }: ZScoreAnalysisProps) {
  const [data, setData] = useState<ZScoreData[]>([]);
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

      const zScoreData: ZScoreData[] = [];

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

          const workingCapital = currentAssets - currentLiabilities;
          const retainedEarnings = balance.retained_earnings || 0;

          // Altman Z-Score components (for private companies - Z'' model)
          // X1 = Working Capital / Total Assets
          // X2 = Retained Earnings / Total Assets
          // X3 = EBIT / Total Assets
          // X4 = Book Value of Equity / Total Liabilities
          // X5 = Sales / Total Assets

          const x1 = totalAssets > 0 ? workingCapital / totalAssets : 0;
          const x2 = totalAssets > 0 ? retainedEarnings / totalAssets : 0;
          const x3 = totalAssets > 0 ? ebit / totalAssets : 0;
          const x4 = totalLiabilities > 0 ? equity / totalLiabilities : 0;
          const x5 = totalAssets > 0 ? netTurnover / totalAssets : 0;

          // Z'' = 6.56(X1) + 3.26(X2) + 6.72(X3) + 1.05(X4) (for private companies)
          // Or use modified with sales: Z' = 0.717(X1) + 0.847(X2) + 3.107(X3) + 0.420(X4) + 0.998(X5)
          const zScore = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5;

          zScoreData.push({
            year: stmt.fiscal_year,
            workingCapital,
            totalAssets,
            retainedEarnings,
            ebit,
            marketValueEquity: equity,
            totalLiabilities,
            sales: netTurnover,
            zScore,
            x1, x2, x3, x4, x5
          });
        }
      }

      setData(zScoreData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getZScoreStatus = (zScore: number) => {
    if (zScore > 2.9) return { status: 'safe', label: 'Zona Segura', color: 'bg-green-500', icon: CheckCircle2 };
    if (zScore > 1.23) return { status: 'grey', label: 'Zona Grisa', color: 'bg-yellow-500', icon: AlertTriangle };
    return { status: 'distress', label: 'Zona de Perill', color: 'bg-red-500', icon: XCircle };
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

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
          No hi ha dades disponibles per a l'anàlisi Z-Score.
        </CardContent>
      </Card>
    );
  }

  const latest = data[data.length - 1];
  const status = getZScoreStatus(latest.zScore);
  const StatusIcon = status.icon;

  const chartData = data.map(d => ({
    year: d.year,
    "Z-Score": d.zScore
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Índex Z d'Altman - {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Z-Score Result */}
            <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Z-Score {latest.year}</p>
              <p className="text-5xl font-bold mb-4">{latest.zScore.toFixed(2)}</p>
              <Badge className={`${status.color} text-white flex items-center gap-1`}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {status.status === 'safe' && "Baixa probabilitat de fallida"}
                {status.status === 'grey' && "Situació d'incertesa, cal vigilar"}
                {status.status === 'distress' && "Alta probabilitat de dificultats financeres"}
              </p>
            </div>

            {/* Interpretation Scale */}
            <div className="space-y-4">
              <h4 className="font-medium">Interpretació del Z-Score</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-900/30 rounded">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Z {'>'} 2.9
                  </span>
                  <span className="text-sm">Zona Segura</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    1.23 {'<'} Z {'<'} 2.9
                  </span>
                  <span className="text-sm">Zona Grisa</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 rounded">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Z {'<'} 1.23
                  </span>
                  <span className="text-sm">Zona de Perill</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Evolució del Z-Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" className="text-xs" />
                <YAxis className="text-xs" domain={[0, 'auto']} />
                <Tooltip />
                <ReferenceLine y={2.9} stroke="green" strokeDasharray="3 3" label="Segur" />
                <ReferenceLine y={1.23} stroke="red" strokeDasharray="3 3" label="Perill" />
                <Line 
                  type="monotone" 
                  dataKey="Z-Score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Components Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Descomposició del Z-Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Component</th>
                  <th className="text-left p-2">Fórmula</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="text-right p-2">Pes</th>
                  <th className="text-right p-2">Contribució</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">X1 - Liquiditat</td>
                  <td className="p-2 text-muted-foreground">FM / Actiu Total</td>
                  <td className="text-right p-2">{formatPercent(latest.x1)}</td>
                  <td className="text-right p-2">0.717</td>
                  <td className="text-right p-2 font-medium">{(latest.x1 * 0.717).toFixed(3)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">X2 - Rendibilitat Acumulada</td>
                  <td className="p-2 text-muted-foreground">Reserves / Actiu Total</td>
                  <td className="text-right p-2">{formatPercent(latest.x2)}</td>
                  <td className="text-right p-2">0.847</td>
                  <td className="text-right p-2 font-medium">{(latest.x2 * 0.847).toFixed(3)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">X3 - Rendibilitat Actius</td>
                  <td className="p-2 text-muted-foreground">EBIT / Actiu Total</td>
                  <td className="text-right p-2">{formatPercent(latest.x3)}</td>
                  <td className="text-right p-2">3.107</td>
                  <td className="text-right p-2 font-medium">{(latest.x3 * 3.107).toFixed(3)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">X4 - Solvència</td>
                  <td className="p-2 text-muted-foreground">FP / Deute Total</td>
                  <td className="text-right p-2">{latest.x4.toFixed(2)}</td>
                  <td className="text-right p-2">0.420</td>
                  <td className="text-right p-2 font-medium">{(latest.x4 * 0.420).toFixed(3)}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">X5 - Rotació</td>
                  <td className="p-2 text-muted-foreground">Vendes / Actiu Total</td>
                  <td className="text-right p-2">{latest.x5.toFixed(2)}</td>
                  <td className="text-right p-2">0.998</td>
                  <td className="text-right p-2 font-medium">{(latest.x5 * 0.998).toFixed(3)}</td>
                </tr>
                <tr className="bg-primary/10">
                  <td className="p-2 font-bold" colSpan={4}>Z-Score Total</td>
                  <td className="text-right p-2 font-bold text-lg">{latest.zScore.toFixed(3)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recomanacions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latest.x1 < 0.1 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="font-medium">Millorar el Fons de Maniobra</p>
                <p className="text-sm text-muted-foreground">
                  X1 baix ({formatPercent(latest.x1)}): Considereu renegociar terminis de pagament o augmentar el finançament a llarg termini.
                </p>
              </div>
            )}
            {latest.x3 < 0.05 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="font-medium">Millorar la Rendibilitat Operativa</p>
                <p className="text-sm text-muted-foreground">
                  X3 baix ({formatPercent(latest.x3)}): Revisar l'estructura de costos i optimitzar l'eficiència operativa.
                </p>
              </div>
            )}
            {latest.x4 < 0.5 && (
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <p className="font-medium">Reduir l'Endeutament</p>
                <p className="text-sm text-muted-foreground">
                  X4 baix ({latest.x4.toFixed(2)}): El nivell de deute és elevat respecte als fons propis.
                </p>
              </div>
            )}
            {status.status === 'safe' && (
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <p className="font-medium">Situació Financera Sòlida</p>
                <p className="text-sm text-muted-foreground">
                  L'empresa mostra indicadors de solvència adequats. Manteniu la disciplina financera actual.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
