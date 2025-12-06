import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Download, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import jsPDF from "jspdf";

interface ReportsTabProps {
  companyId: string;
  companyName: string;
  companyBP?: string;
}

interface FinancialSummary {
  year: number;
  netTurnover: number;
  ebitda: number;
  ebit: number;
  netIncome: number;
  totalAssets: number;
  equity: number;
  currentRatio: number;
  quickRatio: number;
  debtRatio: number;
  roe: number;
  roa: number;
  workingCapital: number;
}

export function ReportsTab({ companyId, companyName, companyBP }: ReportsTabProps) {
  const [data, setData] = useState<FinancialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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

      const summaries: FinancialSummary[] = [];

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
          const financialIncome = income.financial_income || 0;
          const corporateTax = Math.abs(income.corporate_tax || 0);

          const ebitda = netTurnover - supplies - personnelExpenses - otherExpenses;
          const ebit = ebitda - depreciation;
          const netIncome = ebit - financialExpenses + financialIncome - corporateTax;

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

          const totalLiabilities = currentLiabilities + (balance.long_term_debts || 0);
          const inventory = balance.inventory || 0;

          summaries.push({
            year: stmt.fiscal_year,
            netTurnover,
            ebitda,
            ebit,
            netIncome,
            totalAssets,
            equity,
            currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
            quickRatio: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0,
            debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
            roe: equity > 0 ? netIncome / equity : 0,
            roa: totalAssets > 0 ? ebit / totalAssets : 0,
            workingCapital: currentAssets - currentLiabilities
          });
        }
      }

      setData(summaries);
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

  const generateExecutiveReport = () => {
    if (!data.length) return;
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const latest = data[data.length - 1];
      const previous = data.length > 1 ? data[data.length - 2] : null;

      let y = 20;

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INFORME FINANCER EXECUTIU", 105, y, { align: "center" });
      y += 10;

      doc.setFontSize(14);
      doc.text(companyName, 105, y, { align: "center" });
      y += 7;

      if (companyBP) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`BP: ${companyBP}`, 105, y, { align: "center" });
        y += 7;
      }

      doc.setFontSize(10);
      doc.text(`Exercici: ${latest.year}`, 105, y, { align: "center" });
      y += 15;

      // Executive Summary
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RESUM EXECUTIU", 20, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const summaryData = [
        ["Vendes Netes", formatCurrency(latest.netTurnover)],
        ["EBITDA", formatCurrency(latest.ebitda)],
        ["EBIT", formatCurrency(latest.ebit)],
        ["Resultat Net", formatCurrency(latest.netIncome)],
        ["Actiu Total", formatCurrency(latest.totalAssets)],
        ["Fons Propis", formatCurrency(latest.equity)]
      ];

      summaryData.forEach(([label, value]) => {
        doc.text(label, 25, y);
        doc.text(value, 100, y);
        y += 6;
      });

      y += 10;

      // Key Ratios
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RÀTIOS CLAU", 20, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const ratiosData = [
        ["ROE (Rendibilitat Financera)", formatPercent(latest.roe)],
        ["ROA (Rendibilitat Econòmica)", formatPercent(latest.roa)],
        ["Ràtio Corrent", latest.currentRatio.toFixed(2)],
        ["Acid Test", latest.quickRatio.toFixed(2)],
        ["Ràtio d'Endeutament", formatPercent(latest.debtRatio)],
        ["Fons de Maniobra", formatCurrency(latest.workingCapital)]
      ];

      ratiosData.forEach(([label, value]) => {
        doc.text(label, 25, y);
        doc.text(value, 100, y);
        y += 6;
      });

      // Year-over-year comparison
      if (previous) {
        y += 10;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("EVOLUCIÓ INTERANUAL", 20, y);
        y += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const evolutionData = [
          ["Vendes", ((latest.netTurnover - previous.netTurnover) / Math.abs(previous.netTurnover || 1)) * 100],
          ["EBITDA", ((latest.ebitda - previous.ebitda) / Math.abs(previous.ebitda || 1)) * 100],
          ["Resultat Net", ((latest.netIncome - previous.netIncome) / Math.abs(previous.netIncome || 1)) * 100],
          ["Fons Propis", ((latest.equity - previous.equity) / Math.abs(previous.equity || 1)) * 100]
        ];

      evolutionData.forEach(([label, value]) => {
        const numValue = value as number;
        const sign = numValue >= 0 ? "+" : "";
        doc.text(label as string, 25, y);
        doc.text(`${sign}${numValue.toFixed(1)}%`, 100, y);
        y += 6;
      });
      }

      // Conclusions
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CONCLUSIONS", 20, y);
      y += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const conclusions: string[] = [];
      
      if (latest.currentRatio >= 1.5) {
        conclusions.push("• Liquiditat adequada per fer front a obligacions a curt termini");
      } else if (latest.currentRatio >= 1) {
        conclusions.push("• Liquiditat ajustada, recomanable millorar el fons de maniobra");
      } else {
        conclusions.push("• ALERTA: Problemes de liquiditat, risc de tensió financera");
      }

      if (latest.debtRatio <= 0.6) {
        conclusions.push("• Estructura financera equilibrada");
      } else {
        conclusions.push("• Endeutament elevat, considerar reducció de deute");
      }

      if (latest.roe >= 0.15) {
        conclusions.push("• Excel·lent rendibilitat pels accionistes");
      } else if (latest.roe >= 0.08) {
        conclusions.push("• Rendibilitat acceptable, marge de millora");
      } else if (latest.roe > 0) {
        conclusions.push("• Rendibilitat baixa, analitzar causes");
      } else {
        conclusions.push("• ALERTA: Rendibilitat negativa");
      }

      conclusions.forEach((conclusion) => {
        doc.text(conclusion, 25, y);
        y += 6;
      });

      // Footer
      doc.setFontSize(8);
      doc.text(`Generat el ${new Date().toLocaleDateString('ca-AD')}`, 105, 280, { align: "center" });

      doc.save(`Informe_Financer_${companyName.replace(/\s+/g, '_')}_${latest.year}.pdf`);
    } finally {
      setGenerating(false);
    }
  };

  const getHealthStatus = () => {
    if (!data.length) return null;
    const latest = data[data.length - 1];
    
    let score = 0;
    if (latest.currentRatio >= 1.5) score += 2;
    else if (latest.currentRatio >= 1) score += 1;
    
    if (latest.debtRatio <= 0.5) score += 2;
    else if (latest.debtRatio <= 0.7) score += 1;
    
    if (latest.roe >= 0.15) score += 2;
    else if (latest.roe >= 0.08) score += 1;
    
    if (latest.netIncome > 0) score += 2;
    
    if (score >= 7) return { status: 'excellent', label: 'Excel·lent', color: 'bg-green-500' };
    if (score >= 5) return { status: 'good', label: 'Bo', color: 'bg-blue-500' };
    if (score >= 3) return { status: 'acceptable', label: 'Acceptable', color: 'bg-yellow-500' };
    return { status: 'risk', label: 'Risc', color: 'bg-red-500' };
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
  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Informes - {companyName}</h2>
        <Button onClick={generateExecutiveReport} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Descarregar Informe PDF
        </Button>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Estat de Salut Financera</span>
              <Badge className={healthStatus.color}>{healthStatus.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Liquiditat</p>
                <p className="text-lg font-bold">{latest.currentRatio.toFixed(2)}</p>
                {latest.currentRatio >= 1.5 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-1" />
                ) : latest.currentRatio >= 1 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto mt-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Endeutament</p>
                <p className="text-lg font-bold">{formatPercent(latest.debtRatio)}</p>
                {latest.debtRatio <= 0.5 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-1" />
                ) : latest.debtRatio <= 0.7 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto mt-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">ROE</p>
                <p className="text-lg font-bold">{formatPercent(latest.roe)}</p>
                {latest.roe >= 0.15 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto mt-1" />
                ) : latest.roe >= 0.08 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto mt-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                )}
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">Resultat</p>
                <p className="text-lg font-bold">{formatCurrency(latest.netIncome)}</p>
                {latest.netIncome > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mx-auto mt-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mx-auto mt-1" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={generateExecutiveReport}>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Informe Executiu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Resum complet amb KPIs, ràtios i conclusions automàtiques
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Estudi Sectorial
              <Badge variant="outline" className="text-xs">Pròximament</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comparació amb empreses del mateix CNAE
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informe Bancari
              <Badge variant="outline" className="text-xs">Pròximament</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ràtios i indicadors per a anàlisi creditici
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resum Ràpid - Últims Exercicis</CardTitle>
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
                  <td className="p-2">Vendes</td>
                  {data.map(d => (
                    <td key={d.year} className="text-right p-2">{formatCurrency(d.netTurnover)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">EBITDA</td>
                  {data.map(d => (
                    <td key={d.year} className="text-right p-2">{formatCurrency(d.ebitda)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Resultat Net</td>
                  {data.map(d => (
                    <td key={d.year} className={`text-right p-2 ${d.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(d.netIncome)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">ROE</td>
                  {data.map(d => (
                    <td key={d.year} className="text-right p-2">{formatPercent(d.roe)}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-2">Ràtio Corrent</td>
                  {data.map(d => (
                    <td key={d.year} className="text-right p-2">{d.currentRatio.toFixed(2)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-2">Endeutament</td>
                  {data.map(d => (
                    <td key={d.year} className="text-right p-2">{formatPercent(d.debtRatio)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Management Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Comentaris de Gestió Automàtics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {latest.netIncome > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Resultat Positiu</p>
                  <p className="text-sm text-muted-foreground">
                    L'empresa ha generat beneficis de {formatCurrency(latest.netIncome)} durant l'exercici {latest.year}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Resultat Negatiu</p>
                  <p className="text-sm text-muted-foreground">
                    L'empresa ha registrat pèrdues de {formatCurrency(Math.abs(latest.netIncome))} durant l'exercici {latest.year}.
                  </p>
                </div>
              </div>
            )}

            {latest.currentRatio < 1 && (
              <div className="flex items-start gap-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium">Alerta de Liquiditat</p>
                  <p className="text-sm text-muted-foreground">
                    El ràtio corrent ({latest.currentRatio.toFixed(2)}) està per sota de 1, indicant possibles dificultats per atendre obligacions a curt termini.
                  </p>
                </div>
              </div>
            )}

            {latest.debtRatio > 0.7 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Endeutament Elevat</p>
                  <p className="text-sm text-muted-foreground">
                    El ràtio d'endeutament ({formatPercent(latest.debtRatio)}) supera el 70%, el que pot limitar la capacitat d'obtenir nou finançament.
                  </p>
                </div>
              </div>
            )}

            {previous && latest.netTurnover > previous.netTurnover && (
              <div className="flex items-start gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Creixement de Vendes</p>
                  <p className="text-sm text-muted-foreground">
                    Les vendes han crescut un {(((latest.netTurnover - previous.netTurnover) / previous.netTurnover) * 100).toFixed(1)}% respecte l'exercici anterior.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
