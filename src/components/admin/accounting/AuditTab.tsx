import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown, 
  Shield, FileWarning, Scale, Landmark, Building2, Percent, Calculator,
  BarChart3, Info, AlertCircle, FileCheck, BookOpen
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, ReferenceLine, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Legend, AreaChart, Area
} from "recharts";
import { cn } from "@/lib/utils";

interface AuditTabProps {
  companyId: string;
  companyName: string;
}

interface FinancialMetrics {
  year: number;
  // Balance data
  totalAssets: number;
  currentAssets: number;
  nonCurrentAssets: number;
  inventory: number;
  tradeReceivables: number;
  cash: number;
  currentLiabilities: number;
  nonCurrentLiabilities: number;
  totalLiabilities: number;
  equity: number;
  shareCapital: number;
  retainedEarnings: number;
  tradePayables: number;
  // Income data
  netTurnover: number;
  grossMargin: number;
  ebitda: number;
  ebit: number;
  financialExpenses: number;
  netProfit: number;
  supplies: number;
  personnelExpenses: number;
  depreciation: number;
  // Calculated ratios
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  debtRatio: number;
  equityRatio: number;
  financialLeverage: number;
  interestCoverage: number;
  debtToEquity: number;
  // Efficiency
  inventoryDays: number;
  receivablesDays: number;
  payablesDays: number;
  cashConversionCycle: number;
  assetTurnover: number;
  // Profitability
  grossMarginPct: number;
  ebitdaMargin: number;
  ebitMargin: number;
  netMarginPct: number;
  roa: number;
  roe: number;
  roic: number;
  // Basel III / EBA Metrics
  tier1Ratio: number;
  totalCapitalRatio: number;
  lcr: number;
  nsfr: number;
  // Risk Indicators
  zScore: number;
  probabilityOfDefault: number;
  lossGivenDefault: number;
  expectedLoss: number;
  // IFRS 9 Staging
  ifrs9Stage: 1 | 2 | 3;
  ecl12Month: number;
  eclLifetime: number;
}

interface RegulatoryAlert {
  category: string;
  metric: string;
  value: number;
  threshold: number;
  status: 'compliant' | 'warning' | 'breach';
  regulation: string;
  message: string;
  recommendation: string;
}

export function AuditTab({ companyId, companyName }: AuditTabProps) {
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

        if (balance) {
          // Raw balance data
          const inventory = balance.inventory || 0;
          const tradeReceivables = balance.trade_receivables || 0;
          const cash = balance.cash_equivalents || 0;
          const shortTermInvestments = balance.short_term_financial_investments || 0;
          const shortTermGroupReceivables = balance.short_term_group_receivables || 0;
          
          const tangibleAssets = balance.tangible_assets || 0;
          const intangibleAssets = balance.intangible_assets || 0;
          const goodwill = balance.goodwill || 0;
          const realEstateInvestments = balance.real_estate_investments || 0;
          const longTermInvestments = balance.long_term_financial_investments || 0;
          const deferredTaxAssets = balance.deferred_tax_assets || 0;

          const currentAssets = inventory + tradeReceivables + cash + shortTermInvestments + shortTermGroupReceivables;
          const nonCurrentAssets = tangibleAssets + intangibleAssets + goodwill + realEstateInvestments + longTermInvestments + deferredTaxAssets;
          const totalAssets = currentAssets + nonCurrentAssets;

          const shareCapital = balance.share_capital || 0;
          const sharePremium = balance.share_premium || 0;
          const legalReserve = balance.legal_reserve || 0;
          const voluntaryReserves = balance.voluntary_reserves || 0;
          const retainedEarnings = balance.retained_earnings || 0;
          const currentYearResult = balance.current_year_result || 0;
          const treasuryShares = balance.treasury_shares || 0;
          const capitalGrants = balance.capital_grants || 0;

          const equity = shareCapital + sharePremium + legalReserve + voluntaryReserves + 
                        retainedEarnings + currentYearResult - treasuryShares + capitalGrants;

          const shortTermDebts = balance.short_term_debts || 0;
          const tradePayables = balance.trade_payables || 0;
          const otherCreditors = balance.other_creditors || 0;
          const shortTermGroupDebts = balance.short_term_group_debts || 0;
          const shortTermProvisions = balance.short_term_provisions || 0;

          const longTermDebts = balance.long_term_debts || 0;
          const longTermProvisions = balance.long_term_provisions || 0;
          const longTermGroupDebts = balance.long_term_group_debts || 0;
          const deferredTaxLiabilities = balance.deferred_tax_liabilities || 0;

          const currentLiabilities = shortTermDebts + tradePayables + otherCreditors + shortTermGroupDebts + shortTermProvisions;
          const nonCurrentLiabilities = longTermDebts + longTermProvisions + longTermGroupDebts + deferredTaxLiabilities;
          const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

          // Income data
          const netTurnover = income?.net_turnover || 0;
          const supplies = Math.abs(income?.supplies || 0);
          const personnelExpenses = Math.abs(income?.personnel_expenses || 0);
          const otherExpenses = Math.abs(income?.other_operating_expenses || 0);
          const depreciation = Math.abs(income?.depreciation || 0);
          const financialExpenses = Math.abs(income?.financial_expenses || 0);
          const financialIncome = income?.financial_income || 0;
          const corporateTax = Math.abs(income?.corporate_tax || 0);

          const grossMargin = netTurnover - supplies;
          const ebitda = grossMargin - personnelExpenses - otherExpenses;
          const ebit = ebitda - depreciation;
          const netProfit = ebit - financialExpenses + financialIncome - corporateTax;

          // Liquidity Ratios
          const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
          const quickRatio = currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;
          const cashRatio = currentLiabilities > 0 ? cash / currentLiabilities : 0;
          const workingCapital = currentAssets - currentLiabilities;

          // Leverage Ratios
          const debtRatio = totalAssets > 0 ? totalLiabilities / totalAssets : 0;
          const equityRatio = totalAssets > 0 ? equity / totalAssets : 0;
          const financialLeverage = equity > 0 ? totalAssets / equity : 0;
          const interestCoverage = financialExpenses > 0 ? ebit / financialExpenses : Infinity;
          const debtToEquity = equity > 0 ? totalLiabilities / equity : 0;

          // Efficiency Ratios
          const inventoryDays = supplies > 0 ? (inventory / supplies) * 365 : 0;
          const receivablesDays = netTurnover > 0 ? (tradeReceivables / netTurnover) * 365 : 0;
          const payablesDays = supplies > 0 ? (tradePayables / supplies) * 365 : 0;
          const cashConversionCycle = inventoryDays + receivablesDays - payablesDays;
          const assetTurnover = totalAssets > 0 ? netTurnover / totalAssets : 0;

          // Profitability Ratios
          const grossMarginPct = netTurnover > 0 ? (grossMargin / netTurnover) * 100 : 0;
          const ebitdaMargin = netTurnover > 0 ? (ebitda / netTurnover) * 100 : 0;
          const ebitMargin = netTurnover > 0 ? (ebit / netTurnover) * 100 : 0;
          const netMarginPct = netTurnover > 0 ? (netProfit / netTurnover) * 100 : 0;
          const roa = totalAssets > 0 ? (netProfit / totalAssets) * 100 : 0;
          const roe = equity > 0 ? (netProfit / equity) * 100 : 0;
          const investedCapital = equity + longTermDebts;
          const roic = investedCapital > 0 ? (ebit * (1 - 0.25) / investedCapital) * 100 : 0;

          // Basel III / EBA Approximations (simplified for non-financial companies)
          const tier1Ratio = equity > 0 ? (equity / (totalAssets * 0.08)) * 100 : 0; // Simplified
          const totalCapitalRatio = equity > 0 ? ((equity + longTermDebts * 0.5) / (totalAssets * 0.08)) * 100 : 0;
          const lcr = currentLiabilities > 0 ? ((cash + shortTermInvestments) / (currentLiabilities * 0.3)) * 100 : 0; // Liquidity Coverage Ratio proxy
          const nsfr = (nonCurrentLiabilities + equity) > 0 ? ((equity + longTermDebts) / (nonCurrentAssets * 1.1)) * 100 : 0; // Net Stable Funding Ratio proxy

          // Z-Score (Altman)
          const x1 = totalAssets > 0 ? workingCapital / totalAssets : 0;
          const x2 = totalAssets > 0 ? retainedEarnings / totalAssets : 0;
          const x3 = totalAssets > 0 ? ebit / totalAssets : 0;
          const x4 = totalLiabilities > 0 ? equity / totalLiabilities : 0;
          const x5 = totalAssets > 0 ? netTurnover / totalAssets : 0;
          const zScore = 1.2 * x1 + 1.4 * x2 + 3.3 * x3 + 0.6 * x4 + 1.0 * x5;

          // Probability of Default (simplified logistic model)
          const pd = 1 / (1 + Math.exp(0.5 * zScore - 1.5));
          const lgd = 0.45; // Standard EBA assumption
          const expectedLoss = pd * lgd * totalLiabilities;

          // IFRS 9 Staging
          let ifrs9Stage: 1 | 2 | 3 = 1;
          if (zScore < 1.8) ifrs9Stage = 3;
          else if (zScore < 2.99) ifrs9Stage = 2;

          const ecl12Month = pd * lgd * totalLiabilities * 0.1; // 12-month expected credit loss
          const eclLifetime = pd * lgd * totalLiabilities; // Lifetime ECL

          metrics.push({
            year: stmt.fiscal_year,
            totalAssets,
            currentAssets,
            nonCurrentAssets,
            inventory,
            tradeReceivables,
            cash,
            currentLiabilities,
            nonCurrentLiabilities,
            totalLiabilities,
            equity,
            shareCapital,
            retainedEarnings,
            tradePayables,
            netTurnover,
            grossMargin,
            ebitda,
            ebit,
            financialExpenses,
            netProfit,
            supplies,
            personnelExpenses,
            depreciation,
            currentRatio,
            quickRatio,
            cashRatio,
            workingCapital,
            debtRatio,
            equityRatio,
            financialLeverage,
            interestCoverage,
            debtToEquity,
            inventoryDays,
            receivablesDays,
            payablesDays,
            cashConversionCycle,
            assetTurnover,
            grossMarginPct,
            ebitdaMargin,
            ebitMargin,
            netMarginPct,
            roa,
            roe,
            roic,
            tier1Ratio,
            totalCapitalRatio,
            lcr,
            nsfr,
            zScore,
            probabilityOfDefault: pd * 100,
            lossGivenDefault: lgd * 100,
            expectedLoss,
            ifrs9Stage,
            ecl12Month,
            eclLifetime
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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("ca-AD", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => {
    if (!isFinite(value)) return "N/A";
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    if (!isFinite(value)) return "∞";
    return value.toFixed(2);
  };

  const getStatus = (value: number, goodMin: number, goodMax: number, warningMin: number, warningMax: number): 'compliant' | 'warning' | 'breach' => {
    if (value >= goodMin && value <= goodMax) return 'compliant';
    if (value >= warningMin && value <= warningMax) return 'warning';
    return 'breach';
  };

  const getStatusBadge = (status: 'compliant' | 'warning' | 'breach') => {
    switch (status) {
      case 'compliant':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Compleix</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Atenció</Badge>;
      case 'breach':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Incompliment</Badge>;
    }
  };

  const getIFRS9StageBadge = (stage: 1 | 2 | 3) => {
    switch (stage) {
      case 1:
        return <Badge className="bg-green-500">Stage 1 - Performing</Badge>;
      case 2:
        return <Badge className="bg-yellow-500">Stage 2 - Underperforming</Badge>;
      case 3:
        return <Badge className="bg-red-500">Stage 3 - Non-performing</Badge>;
    }
  };

  const latest = useMemo(() => data.length > 0 ? data[data.length - 1] : null, [data]);
  const previous = useMemo(() => data.length > 1 ? data[data.length - 2] : null, [data]);

  const regulatoryAlerts = useMemo((): RegulatoryAlert[] => {
    if (!latest) return [];

    return [
      // Banco de España / EBA Guidelines
      {
        category: "Liquiditat",
        metric: "Ràtio de Liquiditat Corrent",
        value: latest.currentRatio,
        threshold: 1.0,
        status: getStatus(latest.currentRatio, 1.5, 3, 1, 1.5),
        regulation: "Circular BE 4/2017 - Norma Gestió de Liquiditat",
        message: latest.currentRatio < 1 ? "Risc de liquiditat crític" : latest.currentRatio < 1.5 ? "Liquiditat ajustada" : "Liquiditat adequada",
        recommendation: latest.currentRatio < 1.5 ? "Incrementar actius corrents o renegociar deutes a curt termini" : "Mantenir nivells actuals"
      },
      {
        category: "Liquiditat",
        metric: "Acid Test (Quick Ratio)",
        value: latest.quickRatio,
        threshold: 1.0,
        status: getStatus(latest.quickRatio, 1, 2, 0.7, 1),
        regulation: "EBA GL/2018/02 - Gestió del risc de liquiditat",
        message: latest.quickRatio < 0.7 ? "Alta dependència d'existències" : latest.quickRatio < 1 ? "Liquiditat immediata limitada" : "Bona capacitat de pagament immediat",
        recommendation: latest.quickRatio < 1 ? "Reduir inventari o augmentar efectiu" : "Mantenir gestió actual"
      },
      {
        category: "Liquiditat",
        metric: "LCR Proxy (Cobertura Liquiditat)",
        value: latest.lcr,
        threshold: 100,
        status: getStatus(latest.lcr, 100, Infinity, 80, 100),
        regulation: "CRR Art. 412 / Basilea III LCR",
        message: latest.lcr < 100 ? "Per sota del mínim regulatori" : "Compleix requisit mínim LCR",
        recommendation: latest.lcr < 100 ? "Incrementar actius líquids d'alta qualitat (HQLA)" : "Mantenir buffer de liquiditat"
      },
      // Solvency
      {
        category: "Solvència",
        metric: "Ràtio d'Endeutament",
        value: latest.debtRatio * 100,
        threshold: 60,
        status: getStatus(latest.debtRatio, 0, 0.5, 0.5, 0.7),
        regulation: "Llei Concursal 22/2003 - Indicadors d'insolvència",
        message: latest.debtRatio > 0.7 ? "Endeutament excessiu - risc d'insolvència" : latest.debtRatio > 0.5 ? "Endeutament moderat" : "Estructura financera sòlida",
        recommendation: latest.debtRatio > 0.6 ? "Reduir deute o incrementar fons propis" : "Optimitzar estructura de capital"
      },
      {
        category: "Solvència",
        metric: "Cobertura d'Interessos (ICR)",
        value: isFinite(latest.interestCoverage) ? latest.interestCoverage : 99,
        threshold: 1.5,
        status: isFinite(latest.interestCoverage) ? getStatus(latest.interestCoverage, 3, Infinity, 1.5, 3) : 'compliant',
        regulation: "EBA GL/2020/06 - Moratòries COVID / Criteris reestructuració",
        message: !isFinite(latest.interestCoverage) ? "Sense deute financer amb cost" : latest.interestCoverage < 1.5 ? "Risc de servei del deute" : latest.interestCoverage < 3 ? "Cobertura ajustada" : "Bona cobertura d'interessos",
        recommendation: latest.interestCoverage < 2 ? "Renegociar tipus d'interès o reduir principal" : "Mantenir capacitat de servei"
      },
      {
        category: "Solvència",
        metric: "Autonomia Financera",
        value: latest.equityRatio * 100,
        threshold: 30,
        status: getStatus(latest.equityRatio, 0.4, 1, 0.3, 0.4),
        regulation: "Directiva 2013/34/UE - Estats financers",
        message: latest.equityRatio < 0.3 ? "Baixa autonomia - dependència de tercers" : latest.equityRatio < 0.4 ? "Autonomia moderada" : "Alta autonomia financera",
        recommendation: latest.equityRatio < 0.35 ? "Recapitalitzar o retenir beneficis" : "Mantenir estructura patrimonial"
      },
      // Risk Management (IFRS 9 / Basilea)
      {
        category: "Risc de Crèdit",
        metric: "Z-Score d'Altman",
        value: latest.zScore,
        threshold: 1.8,
        status: latest.zScore > 2.99 ? 'compliant' : latest.zScore > 1.8 ? 'warning' : 'breach',
        regulation: "IFRS 9 - Deteriorament d'actius financers",
        message: latest.zScore > 2.99 ? "Zona segura - baix risc d'impagament" : latest.zScore > 1.8 ? "Zona grisa - vigilància requerida" : "Zona de perill - alt risc d'impagament",
        recommendation: latest.zScore < 2.5 ? "Implementar pla de millora financera urgent" : "Monitorització contínua"
      },
      {
        category: "Risc de Crèdit",
        metric: "Probabilitat d'Impagament (PD)",
        value: latest.probabilityOfDefault,
        threshold: 5,
        status: latest.probabilityOfDefault < 2 ? 'compliant' : latest.probabilityOfDefault < 10 ? 'warning' : 'breach',
        regulation: "CRR Art. 178 / EBA GL/2017/16 - Definició de default",
        message: latest.probabilityOfDefault < 2 ? "PD baixa - qualitat creditícia bona" : latest.probabilityOfDefault < 10 ? "PD moderada - seguiment recomanat" : "PD alta - risc significatiu",
        recommendation: latest.probabilityOfDefault > 5 ? "Requerir garanties addicionals" : "Mantenir condicions actuals"
      },
      {
        category: "Risc de Crèdit",
        metric: "Stage IFRS 9",
        value: latest.ifrs9Stage,
        threshold: 1,
        status: latest.ifrs9Stage === 1 ? 'compliant' : latest.ifrs9Stage === 2 ? 'warning' : 'breach',
        regulation: "IFRS 9 - Model ECL de 3 etapes",
        message: `Classificat com Stage ${latest.ifrs9Stage}`,
        recommendation: latest.ifrs9Stage > 1 ? `Provisió ECL ${latest.ifrs9Stage === 2 ? 'Lifetime' : 'Lifetime + Write-off assessment'}` : "Provisió ECL 12 mesos"
      },
      // Efficiency
      {
        category: "Eficiència",
        metric: "Cicle de Conversió d'Efectiu",
        value: latest.cashConversionCycle,
        threshold: 60,
        status: getStatus(latest.cashConversionCycle, 0, 45, 45, 90),
        regulation: "Llei 15/2010 - Morositat operacions comercials",
        message: latest.cashConversionCycle > 90 ? "Cicle molt llarg - tensió de tresoreria" : latest.cashConversionCycle > 45 ? "Cicle moderat" : "Cicle eficient",
        recommendation: latest.cashConversionCycle > 60 ? "Optimitzar gestió de cobraments i pagaments" : "Mantenir eficiència operativa"
      },
      {
        category: "Eficiència",
        metric: "Termini Mitjà de Cobrament",
        value: latest.receivablesDays,
        threshold: 60,
        status: getStatus(latest.receivablesDays, 0, 45, 45, 75),
        regulation: "Llei 3/2004 modificada - Terminis pagament",
        message: latest.receivablesDays > 75 ? "Incompliment límits legals de pagament" : latest.receivablesDays > 45 ? "Termini llarg però legal" : "Cobrament eficient",
        recommendation: latest.receivablesDays > 60 ? "Revisar política de crèdit a clients" : "Mantenir gestió de cobraments"
      }
    ];
  }, [latest]);

  const breachAlerts = useMemo(() => regulatoryAlerts.filter(a => a.status === 'breach'), [regulatoryAlerts]);
  const warningAlerts = useMemo(() => regulatoryAlerts.filter(a => a.status === 'warning'), [regulatoryAlerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data.length || !latest) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No hi ha dades financeres disponibles per a l'auditoria.
        </CardContent>
      </Card>
    );
  }

  const radarData = [
    { metric: 'Liquiditat', value: Math.min(latest.currentRatio / 2 * 100, 100), benchmark: 75 },
    { metric: 'Solvència', value: Math.min(latest.equityRatio * 200, 100), benchmark: 80 },
    { metric: 'Rendibilitat', value: Math.min((latest.roe + 20) * 2.5, 100), benchmark: 70 },
    { metric: 'Eficiència', value: Math.min(latest.assetTurnover * 50, 100), benchmark: 65 },
    { metric: 'Cobertura', value: Math.min((isFinite(latest.interestCoverage) ? latest.interestCoverage : 10) * 10, 100), benchmark: 60 },
    { metric: 'Z-Score', value: Math.min((latest.zScore / 4) * 100, 100), benchmark: 75 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Auditoria Regulatòria - {companyName}
        </h2>
        <Badge variant="outline" className="text-sm">
          Exercici {latest.year}
        </Badge>
      </div>

      {/* Regulatory Compliance Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={cn("border-2", breachAlerts.length > 0 ? "border-red-500 bg-red-50 dark:bg-red-900/10" : "border-green-500 bg-green-50 dark:bg-green-900/10")}>
          <CardContent className="p-4 text-center">
            <XCircle className={cn("h-8 w-8 mx-auto mb-2", breachAlerts.length > 0 ? "text-red-500" : "text-muted-foreground")} />
            <div className="text-2xl font-bold">{breachAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Incompliments</div>
          </CardContent>
        </Card>
        <Card className={cn("border-2", warningAlerts.length > 0 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "border-muted")}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={cn("h-8 w-8 mx-auto mb-2", warningAlerts.length > 0 ? "text-yellow-500" : "text-muted-foreground")} />
            <div className="text-2xl font-bold">{warningAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Alertes</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold">{regulatoryAlerts.length - breachAlerts.length - warningAlerts.length}</div>
            <div className="text-sm text-muted-foreground">Compliments</div>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/50">
          <CardContent className="p-4 text-center">
            {getIFRS9StageBadge(latest.ifrs9Stage)}
            <div className="text-xs mt-2 text-muted-foreground">Classificació IFRS 9</div>
            <div className="text-sm font-medium mt-1">ECL: {formatCurrency(latest.ifrs9Stage === 1 ? latest.ecl12Month : latest.eclLifetime)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Panel */}
      {(breachAlerts.length > 0 || warningAlerts.length > 0) && (
        <Card className={cn("border-2", breachAlerts.length > 0 ? "border-red-500" : "border-yellow-500")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className={cn("h-4 w-4", breachAlerts.length > 0 ? "text-red-500" : "text-yellow-500")} />
              Alertes Regulatòries Detectades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {breachAlerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-red-800 dark:text-red-200">{alert.metric}</span>
                      <Badge className="bg-red-500">INCOMPLIMENT</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{alert.regulation}</div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs mt-2 text-red-700 dark:text-red-300 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {alert.recommendation}
                    </div>
                  </div>
                ))}
                {warningAlerts.map((alert, i) => (
                  <div key={i} className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-yellow-800 dark:text-yellow-200">{alert.metric}</span>
                      <Badge className="bg-yellow-500">ATENCIÓ</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{alert.regulation}</div>
                    <div className="text-sm">{alert.message}</div>
                    <div className="text-xs mt-2 text-yellow-700 dark:text-yellow-300 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      {alert.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="regulatory" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="regulatory" className="text-xs"><Scale className="h-3 w-3 mr-1" />Normativa</TabsTrigger>
          <TabsTrigger value="liquidity" className="text-xs"><Percent className="h-3 w-3 mr-1" />Liquiditat</TabsTrigger>
          <TabsTrigger value="solvency" className="text-xs"><Building2 className="h-3 w-3 mr-1" />Solvència</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" />Risc</TabsTrigger>
          <TabsTrigger value="profitability" className="text-xs"><TrendingUp className="h-3 w-3 mr-1" />Rendibilitat</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs"><FileCheck className="h-3 w-3 mr-1" />Compliment</TabsTrigger>
        </TabsList>

        <TabsContent value="regulatory" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Perfil de Risc Consolidat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                      <Radar name="Empresa" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                      <Radar name="Referència" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.2} strokeDasharray="5 5" />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Marc Regulatori Aplicable
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-primary">Normativa Espanyola</h4>
                      <ul className="text-xs mt-1 space-y-1 text-muted-foreground">
                        <li>• Circular BE 4/2017 - Gestió de liquiditat</li>
                        <li>• Llei 22/2003 Concursal - Insolvència</li>
                        <li>• Llei 15/2010 - Morositat comercial</li>
                        <li>• RDL 4/2015 - Text refós LSC</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-blue-500">Normativa Europea</h4>
                      <ul className="text-xs mt-1 space-y-1 text-muted-foreground">
                        <li>• Reglament (UE) 575/2013 (CRR)</li>
                        <li>• Directiva 2013/36/UE (CRD IV)</li>
                        <li>• Directiva 2013/34/UE - Estats financers</li>
                        <li>• EBA GL/2017/16 - Definició de default</li>
                        <li>• EBA GL/2018/02 - Gestió risc liquiditat</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold text-amber-500">Estàndards Internacionals</h4>
                      <ul className="text-xs mt-1 space-y-1 text-muted-foreground">
                        <li>• Basilea III/IV - Capital i Liquiditat</li>
                        <li>• IFRS 9 - Instruments financers / ECL</li>
                        <li>• IFRS 7 - Revelacions instruments financers</li>
                        <li>• ISA 570 - Empresa en funcionament</li>
                      </ul>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Full Regulatory Check Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Taula de Verificació Regulatòria Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Mètrica</th>
                      <th className="text-right p-2">Valor</th>
                      <th className="text-right p-2">Llindar</th>
                      <th className="text-center p-2">Estat</th>
                      <th className="text-left p-2">Normativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regulatoryAlerts.map((alert, i) => (
                      <tr key={i} className="border-b hover:bg-muted/50">
                        <td className="p-2">{alert.category}</td>
                        <td className="p-2 font-medium">{alert.metric}</td>
                        <td className="p-2 text-right font-mono">{formatRatio(alert.value)}</td>
                        <td className="p-2 text-right font-mono text-muted-foreground">{formatRatio(alert.threshold)}</td>
                        <td className="p-2 text-center">{getStatusBadge(alert.status)}</td>
                        <td className="p-2 text-xs text-muted-foreground">{alert.regulation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Ràtio Corrent</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.currentRatio)}</p>
                {getStatusBadge(getStatus(latest.currentRatio, 1.5, 3, 1, 1.5))}
                <p className="text-xs mt-1 text-muted-foreground">Mínim recomanat: 1.5</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Acid Test</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.quickRatio)}</p>
                {getStatusBadge(getStatus(latest.quickRatio, 1, 2, 0.7, 1))}
                <p className="text-xs mt-1 text-muted-foreground">Mínim recomanat: 1.0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Ràtio Tresoreria</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.cashRatio)}</p>
                {getStatusBadge(getStatus(latest.cashRatio, 0.2, 0.5, 0.1, 0.2))}
                <p className="text-xs mt-1 text-muted-foreground">Referència: 0.2-0.5</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Fons de Maniobra</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(latest.workingCapital)}</p>
                {getStatusBadge(latest.workingCapital > 0 ? 'compliant' : 'breach')}
                <p className="text-xs mt-1 text-muted-foreground">Ha de ser positiu</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Evolució Ràtios de Liquiditat (5 anys)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={1.5} stroke="green" strokeDasharray="3 3" label="Òptim" />
                    <ReferenceLine y={1} stroke="red" strokeDasharray="3 3" label="Mínim" />
                    <Line type="monotone" dataKey="currentRatio" stroke="hsl(var(--primary))" strokeWidth={2} name="Ràtio Corrent" />
                    <Line type="monotone" dataKey="quickRatio" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Acid Test" />
                    <Line type="monotone" dataKey="cashRatio" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Tresoreria" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solvency" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Endeutament Total</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.debtRatio * 100)}</p>
                {getStatusBadge(getStatus(latest.debtRatio, 0, 0.5, 0.5, 0.7))}
                <p className="text-xs mt-1 text-muted-foreground">Màxim recomanat: 60%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Autonomia Financera</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.equityRatio * 100)}</p>
                {getStatusBadge(getStatus(latest.equityRatio, 0.4, 1, 0.3, 0.4))}
                <p className="text-xs mt-1 text-muted-foreground">Mínim recomanat: 40%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Palanquejament</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.financialLeverage)}x</p>
                {getStatusBadge(getStatus(latest.financialLeverage, 1, 2.5, 2.5, 4))}
                <p className="text-xs mt-1 text-muted-foreground">Referència: 1.5-2.5x</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Cobertura Interessos</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{isFinite(latest.interestCoverage) ? `${formatRatio(latest.interestCoverage)}x` : '∞'}</p>
                {getStatusBadge(isFinite(latest.interestCoverage) ? getStatus(latest.interestCoverage, 3, Infinity, 1.5, 3) : 'compliant')}
                <p className="text-xs mt-1 text-muted-foreground">Mínim: 1.5x (EBA)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Estructura de Finançament</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => formatPercent(v * 100)} />
                    <Legend />
                    <Bar dataKey="equityRatio" stackId="a" fill="hsl(var(--primary))" name="Fons Propis" />
                    <Bar dataKey="debtRatio" stackId="a" fill="hsl(var(--destructive))" name="Deute" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={cn("border-2", latest.zScore > 2.99 ? "border-green-500" : latest.zScore > 1.8 ? "border-yellow-500" : "border-red-500")}>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Z-Score Altman</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatRatio(latest.zScore)}</p>
                {latest.zScore > 2.99 
                  ? <Badge className="bg-green-500">Zona Segura</Badge>
                  : latest.zScore > 1.8 
                    ? <Badge className="bg-yellow-500">Zona Grisa</Badge>
                    : <Badge className="bg-red-500">Zona Perill</Badge>
                }
                <p className="text-xs mt-1 text-muted-foreground">{">"}2.99 segur, 1.8-2.99 incert, {"<"}1.8 perill</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Probabilitat Default (PD)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.probabilityOfDefault)}</p>
                {getStatusBadge(latest.probabilityOfDefault < 2 ? 'compliant' : latest.probabilityOfDefault < 10 ? 'warning' : 'breach')}
                <p className="text-xs mt-1 text-muted-foreground">Model logístic basat en Z</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">LGD Estàndard</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.lossGivenDefault)}</p>
                <Badge variant="outline">EBA Estàndard</Badge>
                <p className="text-xs mt-1 text-muted-foreground">45% per corporatius (EBA)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Pèrdua Esperada (EL)</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(latest.expectedLoss)}</p>
                <Badge variant="outline">PD × LGD × EAD</Badge>
                <p className="text-xs mt-1 text-muted-foreground">Model IFRS 9 / IRB</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">IFRS 9 - Provisió per Deteriorament (ECL)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <h4 className="font-semibold mb-2">Stage Actual</h4>
                  {getIFRS9StageBadge(latest.ifrs9Stage)}
                  <p className="text-xs mt-2 text-muted-foreground">
                    {latest.ifrs9Stage === 1 && "Actiu performing - ECL 12 mesos"}
                    {latest.ifrs9Stage === 2 && "Increment significatiu risc crèdit - ECL Lifetime"}
                    {latest.ifrs9Stage === 3 && "Credit-impaired - ECL Lifetime + Write-off"}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                  <h4 className="font-semibold mb-2">ECL 12 Mesos</h4>
                  <p className="text-xl font-bold">{formatCurrency(latest.ecl12Month)}</p>
                  <p className="text-xs mt-1 text-muted-foreground">Provisió Stage 1</p>
                </div>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-center">
                  <h4 className="font-semibold mb-2">ECL Lifetime</h4>
                  <p className="text-xl font-bold">{formatCurrency(latest.eclLifetime)}</p>
                  <p className="text-xs mt-1 text-muted-foreground">Provisió Stage 2/3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Evolució Z-Score i Probabilitat de Default</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine yAxisId="left" y={2.99} stroke="green" strokeDasharray="3 3" label="Z Segur" />
                    <ReferenceLine yAxisId="left" y={1.8} stroke="red" strokeDasharray="3 3" label="Z Perill" />
                    <Area yAxisId="left" type="monotone" dataKey="zScore" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Z-Score" />
                    <Line yAxisId="right" type="monotone" dataKey="probabilityOfDefault" stroke="hsl(var(--destructive))" strokeWidth={2} name="PD %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">ROE</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.roe)}</p>
                {getStatusBadge(getStatus(latest.roe, 8, 100, 3, 8))}
                <p className="text-xs mt-1 text-muted-foreground">Referència sector: 8-15%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">ROA</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.roa)}</p>
                {getStatusBadge(getStatus(latest.roa, 3, 100, 1, 3))}
                <p className="text-xs mt-1 text-muted-foreground">Referència: {">"}3%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">ROIC</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.roic)}</p>
                {getStatusBadge(getStatus(latest.roic, 8, 100, 5, 8))}
                <p className="text-xs mt-1 text-muted-foreground">Superar WACC ({">"}8%)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs">Marge EBITDA</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatPercent(latest.ebitdaMargin)}</p>
                {getStatusBadge(getStatus(latest.ebitdaMargin, 15, 100, 8, 15))}
                <p className="text-xs mt-1 text-muted-foreground">Referència sector: 10-20%</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Evolució Marges i Rendibilitat</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(2)}%`} />
                    <Legend />
                    <Line type="monotone" dataKey="grossMarginPct" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Marge Brut" />
                    <Line type="monotone" dataKey="ebitdaMargin" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Marge EBITDA" />
                    <Line type="monotone" dataKey="netMarginPct" stroke="hsl(var(--chart-3))" strokeWidth={2} name="Marge Net" />
                    <Line type="monotone" dataKey="roe" stroke="hsl(var(--primary))" strokeWidth={2} name="ROE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Resum de Compliment Normatiu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {['Liquiditat', 'Solvència', 'Risc de Crèdit', 'Eficiència'].map(category => {
                  const categoryAlerts = regulatoryAlerts.filter(a => a.category === category);
                  const breaches = categoryAlerts.filter(a => a.status === 'breach').length;
                  const warnings = categoryAlerts.filter(a => a.status === 'warning').length;
                  const compliant = categoryAlerts.length - breaches - warnings;

                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center justify-between">
                        {category}
                        {breaches > 0 
                          ? <Badge className="bg-red-500">{breaches} Incompliment(s)</Badge>
                          : warnings > 0 
                            ? <Badge className="bg-yellow-500">{warnings} Alerta(es)</Badge>
                            : <Badge className="bg-green-500">Tot Correcte</Badge>
                        }
                      </h4>
                      <div className="space-y-2">
                        {categoryAlerts.map((alert, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{alert.metric}</span>
                            {getStatusBadge(alert.status)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {previous && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Anàlisi de Desviacions Interanuals</CardTitle>
              </CardHeader>
              <CardContent>
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
                        { name: "Actiu Total", prev: previous.totalAssets, curr: latest.totalAssets, format: formatCurrency, positive: true },
                        { name: "Fons Propis", prev: previous.equity, curr: latest.equity, format: formatCurrency, positive: true },
                        { name: "Vendes", prev: previous.netTurnover, curr: latest.netTurnover, format: formatCurrency, positive: true },
                        { name: "Ràtio Corrent", prev: previous.currentRatio, curr: latest.currentRatio, format: formatRatio, positive: true },
                        { name: "Endeutament", prev: previous.debtRatio * 100, curr: latest.debtRatio * 100, format: formatPercent, positive: false },
                        { name: "Z-Score", prev: previous.zScore, curr: latest.zScore, format: formatRatio, positive: true },
                        { name: "ROE", prev: previous.roe, curr: latest.roe, format: formatPercent, positive: true },
                        { name: "Cicle Conversió", prev: previous.cashConversionCycle, curr: latest.cashConversionCycle, format: (v: number) => `${v.toFixed(0)}d`, positive: false }
                      ].map((row, i) => {
                        const variation = row.prev !== 0 ? ((row.curr - row.prev) / Math.abs(row.prev)) * 100 : 0;
                        const isPositiveChange = row.positive ? variation > 0 : variation < 0;
                        return (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-medium">{row.name}</td>
                            <td className="text-right p-2">{row.format(row.prev)}</td>
                            <td className="text-right p-2">{row.format(row.curr)}</td>
                            <td className={cn("text-right p-2", isPositiveChange ? "text-green-600" : "text-red-600")}>
                              {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                            </td>
                            <td className="text-center p-2">
                              {isPositiveChange ? (
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
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
