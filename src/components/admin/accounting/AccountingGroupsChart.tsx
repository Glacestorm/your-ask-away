import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileSpreadsheet, Printer, RefreshCw, Calculator, Building2, Layers, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AccountingGroup {
  code: string;
  description: string;
  type: 'ACTIU' | 'PASSIU' | 'PATRIMONI' | 'INGRESSOS' | 'DESPESES';
  values: { [year: number]: { value: number; isProvisional: boolean; isConsolidated: boolean } };
}

interface CompanyData {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
}

interface BalanceSheetSummary {
  year: number;
  totalAssets: number;
  totalLiabilities: number;
  difference: number;
  isProvisional: boolean;
  isConsolidated: boolean;
}

interface IncomeStatementSummary {
  year: number;
  debe: number;
  haber: number;
  result: number;
  difference: number;
  isProvisional: boolean;
  isConsolidated: boolean;
}

interface AccountingGroupsChartProps {
  companyId: string;
}

// PGC Andorra accounting codes structure
const PGC_CODES: AccountingGroup[] = [
  // ACTIU NO CORRENT
  { code: '20', description: 'Immobilitzacions intangibles', type: 'ACTIU', values: {} },
  { code: '200', description: 'Recerca', type: 'ACTIU', values: {} },
  { code: '201', description: 'Desenvolupament', type: 'ACTIU', values: {} },
  { code: '202', description: 'Concessions administratives', type: 'ACTIU', values: {} },
  { code: '203', description: 'Propietat industrial', type: 'ACTIU', values: {} },
  { code: '204', description: 'Fons de comerç', type: 'ACTIU', values: {} },
  { code: '206', description: 'Aplicacions informàtiques', type: 'ACTIU', values: {} },
  { code: '21', description: 'Immobilitzacions materials', type: 'ACTIU', values: {} },
  { code: '210', description: 'Terrenys i béns naturals', type: 'ACTIU', values: {} },
  { code: '211', description: 'Construccions', type: 'ACTIU', values: {} },
  { code: '212', description: 'Instal·lacions tècniques', type: 'ACTIU', values: {} },
  { code: '213', description: 'Maquinària', type: 'ACTIU', values: {} },
  { code: '214', description: 'Utillatge', type: 'ACTIU', values: {} },
  { code: '215', description: 'Altres instal·lacions', type: 'ACTIU', values: {} },
  { code: '216', description: 'Mobiliari', type: 'ACTIU', values: {} },
  { code: '217', description: 'Equips per a processos informàtics', type: 'ACTIU', values: {} },
  { code: '218', description: 'Elements de transport', type: 'ACTIU', values: {} },
  { code: '22', description: 'Inversions immobiliàries', type: 'ACTIU', values: {} },
  { code: '23', description: 'Immobilitzacions materials en curs', type: 'ACTIU', values: {} },
  { code: '24', description: 'Inversions financeres a llarg termini en parts vinculades', type: 'ACTIU', values: {} },
  { code: '25', description: 'Altres inversions financeres a llarg termini', type: 'ACTIU', values: {} },
  { code: '26', description: 'Fiances i dipòsits constituïts a llarg termini', type: 'ACTIU', values: {} },
  // ACTIU CORRENT
  { code: '30', description: 'Existències comercials', type: 'ACTIU', values: {} },
  { code: '31', description: 'Matèries primeres', type: 'ACTIU', values: {} },
  { code: '32', description: 'Altres aprovisionaments', type: 'ACTIU', values: {} },
  { code: '33', description: 'Productes en curs', type: 'ACTIU', values: {} },
  { code: '34', description: 'Productes semiacabats', type: 'ACTIU', values: {} },
  { code: '35', description: 'Productes acabats', type: 'ACTIU', values: {} },
  { code: '36', description: 'Subproductes, residus i materials recuperats', type: 'ACTIU', values: {} },
  { code: '40', description: 'Proveïdors', type: 'PASSIU', values: {} },
  { code: '41', description: 'Creditors diversos', type: 'PASSIU', values: {} },
  { code: '43', description: 'Clients', type: 'ACTIU', values: {} },
  { code: '430', description: 'Clients (euros)', type: 'ACTIU', values: {} },
  { code: '431', description: 'Clients, efectes comercials a cobrar', type: 'ACTIU', values: {} },
  { code: '432', description: 'Clients, operacions de "factoring"', type: 'ACTIU', values: {} },
  { code: '433', description: 'Clients, empreses del grup', type: 'ACTIU', values: {} },
  { code: '44', description: 'Deutors diversos', type: 'ACTIU', values: {} },
  { code: '46', description: 'Personal', type: 'ACTIU', values: {} },
  { code: '47', description: 'Administracions públiques', type: 'PASSIU', values: {} },
  { code: '48', description: 'Ajustaments per periodificació', type: 'ACTIU', values: {} },
  { code: '49', description: 'Deteriorament de valor de crèdits comercials', type: 'ACTIU', values: {} },
  { code: '57', description: 'Tresoreria', type: 'ACTIU', values: {} },
  { code: '570', description: 'Caixa, euros', type: 'ACTIU', values: {} },
  { code: '572', description: 'Bancs i institucions de crèdit c/c vista, euros', type: 'ACTIU', values: {} },
  // PATRIMONI NET
  { code: '10', description: 'Capital', type: 'PATRIMONI', values: {} },
  { code: '100', description: 'Capital social', type: 'PATRIMONI', values: {} },
  { code: '101', description: 'Fons social', type: 'PATRIMONI', values: {} },
  { code: '11', description: 'Reserves', type: 'PATRIMONI', values: {} },
  { code: '112', description: 'Reserva legal', type: 'PATRIMONI', values: {} },
  { code: '113', description: 'Reserves voluntàries', type: 'PATRIMONI', values: {} },
  { code: '118', description: 'Reserves estatutàries', type: 'PATRIMONI', values: {} },
  { code: '12', description: 'Resultats pendents d\'aplicació', type: 'PATRIMONI', values: {} },
  { code: '120', description: 'Romanent', type: 'PATRIMONI', values: {} },
  { code: '121', description: 'Resultats negatius d\'exercicis anteriors', type: 'PATRIMONI', values: {} },
  { code: '129', description: 'Resultat de l\'exercici', type: 'PATRIMONI', values: {} },
  { code: '13', description: 'Subvencions, donacions i llegats rebuts', type: 'PATRIMONI', values: {} },
  // PASSIU NO CORRENT
  { code: '14', description: 'Provisions', type: 'PASSIU', values: {} },
  { code: '15', description: 'Deutes a llarg termini amb característiques especials', type: 'PASSIU', values: {} },
  { code: '16', description: 'Deutes a llarg termini amb parts vinculades', type: 'PASSIU', values: {} },
  { code: '17', description: 'Deutes a llarg termini per préstecs rebuts i altres conceptes', type: 'PASSIU', values: {} },
  { code: '170', description: 'Deutes a llarg termini amb entitats de crèdit', type: 'PASSIU', values: {} },
  { code: '171', description: 'Deutes a llarg termini', type: 'PASSIU', values: {} },
  { code: '18', description: 'Passius per fiances i garanties a llarg termini', type: 'PASSIU', values: {} },
  // PASSIU CORRENT
  { code: '50', description: 'Deutes a curt termini amb parts vinculades', type: 'PASSIU', values: {} },
  { code: '51', description: 'Deutes a curt termini amb entitats de crèdit', type: 'PASSIU', values: {} },
  { code: '52', description: 'Deutes a curt termini per préstecs rebuts', type: 'PASSIU', values: {} },
  { code: '55', description: 'Altres passius financers a curt termini', type: 'PASSIU', values: {} },
  { code: '56', description: 'Fiances i dipòsits rebuts a curt termini', type: 'PASSIU', values: {} },
  // INGRESSOS
  { code: '70', description: 'Vendes de mercaderies, de producció pròpia', type: 'INGRESSOS', values: {} },
  { code: '71', description: 'Variació d\'existències', type: 'INGRESSOS', values: {} },
  { code: '73', description: 'Treballs realitzats per a l\'empresa', type: 'INGRESSOS', values: {} },
  { code: '74', description: 'Subvencions, donacions i llegats', type: 'INGRESSOS', values: {} },
  { code: '75', description: 'Altres ingressos de gestió', type: 'INGRESSOS', values: {} },
  { code: '76', description: 'Ingressos financers', type: 'INGRESSOS', values: {} },
  { code: '77', description: 'Beneficis procedents d\'actius no corrents', type: 'INGRESSOS', values: {} },
  { code: '79', description: 'Excessos i aplicacions de provisions', type: 'INGRESSOS', values: {} },
  // DESPESES
  { code: '60', description: 'Compres', type: 'DESPESES', values: {} },
  { code: '61', description: 'Variació d\'existències', type: 'DESPESES', values: {} },
  { code: '62', description: 'Serveis exteriors', type: 'DESPESES', values: {} },
  { code: '63', description: 'Tributs', type: 'DESPESES', values: {} },
  { code: '64', description: 'Despeses de personal', type: 'DESPESES', values: {} },
  { code: '65', description: 'Altres despeses de gestió', type: 'DESPESES', values: {} },
  { code: '66', description: 'Despeses financeres', type: 'DESPESES', values: {} },
  { code: '67', description: 'Pèrdues procedents d\'actius no corrents', type: 'DESPESES', values: {} },
  { code: '68', description: 'Dotacions per a amortitzacions', type: 'DESPESES', values: {} },
  { code: '69', description: 'Pèrdues per deteriorament i altres dotacions', type: 'DESPESES', values: {} },
];

const AccountingGroupsChart = ({ companyId }: AccountingGroupsChartProps) => {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [accountingData, setAccountingData] = useState<AccountingGroup[]>(PGC_CODES);
  const [balanceSummaries, setBalanceSummaries] = useState<BalanceSheetSummary[]>([]);
  const [incomeSummaries, setIncomeSummaries] = useState<IncomeStatementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showThousands, setShowThousands] = useState(false);
  const [showProvisional, setShowProvisional] = useState(true);
  const [showConsolidated, setShowConsolidated] = useState(true);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load company data
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name, bp, tax_id')
        .eq('id', companyId)
        .single();

      if (companyData) {
        setCompany(companyData);
      }

      // Load financial statements for this company (all 5 years)
      const { data: statements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, status, statement_type')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false })
        .limit(5);

      // Also load provisional statements
      const { data: provisionalStatements } = await supabase
        .from('company_financial_statements')
        .select('id, fiscal_year, status, statement_type')
        .eq('company_id', companyId)
        .eq('status', 'draft')
        .order('fiscal_year', { ascending: false });

      // Also check for consolidated statements
      const { data: consolidatedStmts } = await supabase
        .from('consolidated_financial_statements')
        .select('id, fiscal_year, status')
        .order('fiscal_year', { ascending: false })
        .limit(5);

      const allStatements = [
        ...(statements || []).map(s => ({ ...s, isProvisional: s.status === 'draft', isConsolidated: false })),
        ...(provisionalStatements || [])
          .filter(ps => !(statements || []).find(s => s.id === ps.id))
          .map(s => ({ ...s, isProvisional: true, isConsolidated: false }))
      ];

      // Add consolidated statements
      const consolidatedYears = new Set((consolidatedStmts || []).map(c => c.fiscal_year));

      if (allStatements.length > 0) {
        const availableYears = [...new Set(allStatements.map(s => s.fiscal_year))].sort((a, b) => b - a).slice(0, 5);
        setYears(availableYears);

        // Load balance sheet data for each year
        const balanceData: BalanceSheetSummary[] = [];
        const incomeData: IncomeStatementSummary[] = [];

        for (const stmt of allStatements) {
          const { data: balance } = await supabase
            .from('balance_sheets')
            .select('*')
            .eq('statement_id', stmt.id)
            .single();

          const { data: income } = await supabase
            .from('income_statements')
            .select('*')
            .eq('statement_id', stmt.id)
            .single();

          if (balance) {
            const totalAssets = 
              (balance.intangible_assets || 0) +
              (balance.goodwill || 0) +
              (balance.tangible_assets || 0) +
              (balance.real_estate_investments || 0) +
              (balance.long_term_financial_investments || 0) +
              (balance.deferred_tax_assets || 0) +
              (balance.inventory || 0) +
              (balance.trade_receivables || 0) +
              (balance.short_term_financial_investments || 0) +
              (balance.cash_equivalents || 0);

            const totalEquity =
              (balance.share_capital || 0) +
              (balance.share_premium || 0) +
              (balance.legal_reserve || 0) +
              (balance.voluntary_reserves || 0) +
              (balance.retained_earnings || 0) +
              (balance.current_year_result || 0);

            const totalLiabilities =
              (balance.long_term_debts || 0) +
              (balance.short_term_debts || 0) +
              (balance.trade_payables || 0) +
              (balance.other_creditors || 0);

            balanceData.push({
              year: stmt.fiscal_year,
              totalAssets,
              totalLiabilities: totalEquity + totalLiabilities,
              difference: totalAssets - (totalEquity + totalLiabilities),
              isProvisional: stmt.isProvisional,
              isConsolidated: consolidatedYears.has(stmt.fiscal_year)
            });
          }

          if (income) {
            const debe = 
              Math.abs(income.supplies || 0) +
              Math.abs(income.personnel_expenses || 0) +
              Math.abs(income.depreciation || 0) +
              Math.abs(income.other_operating_expenses || 0) +
              Math.abs(income.financial_expenses || 0);

            const haber =
              (income.net_turnover || 0) +
              (income.other_operating_income || 0) +
              (income.financial_income || 0);

            incomeData.push({
              year: stmt.fiscal_year,
              debe,
              haber,
              result: haber - debe,
              difference: 0,
              isProvisional: stmt.isProvisional,
              isConsolidated: consolidatedYears.has(stmt.fiscal_year)
            });
          }
        }

        setBalanceSummaries(balanceData);
        setIncomeSummaries(incomeData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al carregar les dades');
    } finally {
      setLoading(false);
    }
  };

  const filteredBalanceSummaries = balanceSummaries.filter(s => {
    if (!showProvisional && s.isProvisional) return false;
    if (!showConsolidated && s.isConsolidated) return false;
    return true;
  });

  const filteredIncomeSummaries = incomeSummaries.filter(s => {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ACTIU':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'PASSIU':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'PATRIMONI':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'INGRESSOS':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'DESPESES':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const exportToExcel = () => {
    const data = accountingData.map(group => ({
      'Codi': group.code,
      'Descripció': group.description,
      'Tipus': group.type,
      ...years.reduce((acc, year) => ({
        ...acc,
        [`Desembre ${year}`]: group.values[year] || 0
      }), {})
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quadre Comptable');
    XLSX.writeFile(wb, `quadre_comptable_${company?.name || 'empresa'}.xlsx`);
    toast.success('Excel exportat correctament');
  };

  const printChart = () => {
    window.print();
    toast.success('Preparant impressió...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            QUADRE GENERAL DE GRUPS COMPTABLES
          </h2>
          {company && (
            <div className="flex items-center gap-4 mt-2">
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
              {company.tax_id && (
                <span className="text-sm">
                  <span className="text-emerald-400 font-medium">NRT:</span>{' '}
                  <code className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">{company.tax_id}</code>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Checkbox
              id="thousands"
              checked={showThousands}
              onCheckedChange={(checked) => setShowThousands(checked as boolean)}
            />
            <label htmlFor="thousands" className="text-muted-foreground">
              Milers d'€
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="provisional"
              checked={showProvisional}
              onCheckedChange={setShowProvisional}
            />
            <Label htmlFor="provisional" className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Provisionals
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Switch
              id="consolidated"
              checked={showConsolidated}
              onCheckedChange={setShowConsolidated}
            />
            <Label htmlFor="consolidated" className="text-sm text-muted-foreground flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              Consolidats
            </Label>
          </div>

          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={printChart}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-b-2 border-primary/30 hover:bg-transparent">
                  <TableHead className="w-20 font-bold text-primary">Codi</TableHead>
                  <TableHead className="min-w-[200px] font-bold text-primary">Descripció</TableHead>
                  <TableHead className="w-24 font-bold text-primary text-center">Tipus</TableHead>
                  {years.slice(0, 5).map(year => (
                    <TableHead key={year} className="w-28 font-bold text-primary text-right text-xs">
                      Des-{year}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {accountingData.map((group, idx) => (
                  <TableRow 
                    key={group.code}
                    className={`
                      ${idx % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'}
                      hover:bg-primary/10 transition-colors
                      ${group.code.length === 2 ? 'font-semibold bg-muted/40' : ''}
                    `}
                  >
                    <TableCell className="font-mono text-sm">{group.code}</TableCell>
                    <TableCell className={group.code.length === 2 ? 'font-semibold' : ''}>
                      {group.description}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`${getTypeColor(group.type)} text-[10px] px-1.5`}>
                        {group.type}
                      </Badge>
                    </TableCell>
                    {years.slice(0, 5).map(year => (
                      <TableCell key={year} className="text-right font-mono text-xs tabular-nums">
                        {formatCurrency(group.values[year]?.value || 0)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Balance and Income Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balance Sheet Summary */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              QUADRE DE BALANÇOS
            </CardTitle>
            <p className="text-sm text-muted-foreground">Balanç de Situació</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-amber-500/30 hover:bg-transparent">
                  <TableHead className="font-bold text-amber-400 bg-amber-500/10">EXERCICIS</TableHead>
                  <TableHead className="font-bold text-emerald-400 bg-emerald-500/10 text-right">ACTIU</TableHead>
                  <TableHead className="font-bold text-rose-400 bg-rose-500/10 text-right">PASSIU</TableHead>
                  <TableHead className="font-bold text-blue-400 bg-blue-500/10 text-right">DIFERÈNCIES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalanceSummaries.map((summary, idx) => (
                  <TableRow 
                    key={`${summary.year}-${summary.isProvisional}`}
                    className={idx % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'}
                  >
                    <TableCell className="font-semibold bg-amber-500/5">
                      <div className="flex items-center gap-1.5">
                        <span>Des-{summary.year}</span>
                        {summary.isProvisional && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">
                            PROV
                          </Badge>
                        )}
                        {summary.isConsolidated && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-500/20 text-blue-400 border-blue-500/50">
                            CONS
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums bg-emerald-500/5 text-emerald-400 text-sm">
                      {formatCurrency(summary.totalAssets)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums bg-rose-500/5 text-rose-400 text-sm">
                      {formatCurrency(summary.totalLiabilities)}
                    </TableCell>
                    <TableCell className={`text-right font-mono tabular-nums bg-blue-500/5 text-sm ${
                      summary.difference === 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatCurrency(summary.difference)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBalanceSummaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hi ha dades disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Income Statement Summary */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              COMPTE DE RESULTATS
            </CardTitle>
            <p className="text-sm text-muted-foreground">Estat de Pèrdues i Guanys</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-amber-500/30 hover:bg-transparent">
                  <TableHead className="font-bold text-amber-400 bg-amber-500/10">EXERCICIS</TableHead>
                  <TableHead className="font-bold text-rose-400 bg-rose-500/10 text-right">DEURE</TableHead>
                  <TableHead className="font-bold text-emerald-400 bg-emerald-500/10 text-right">HAVER</TableHead>
                  <TableHead className="font-bold text-blue-400 bg-blue-500/10 text-right">RESULTATS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncomeSummaries.map((summary, idx) => (
                  <TableRow 
                    key={`${summary.year}-${summary.isProvisional}`}
                    className={idx % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'}
                  >
                    <TableCell className="font-semibold bg-amber-500/5">
                      <div className="flex items-center gap-1.5">
                        <span>Des-{summary.year}</span>
                        {summary.isProvisional && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/50">
                            PROV
                          </Badge>
                        )}
                        {summary.isConsolidated && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-500/20 text-blue-400 border-blue-500/50">
                            CONS
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums bg-rose-500/5 text-rose-400 text-sm">
                      {formatCurrency(summary.debe)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums bg-emerald-500/5 text-emerald-400 text-sm">
                      {formatCurrency(summary.haber)}
                    </TableCell>
                    <TableCell className={`text-right font-mono tabular-nums bg-blue-500/5 text-sm ${
                      summary.result >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {formatCurrency(summary.result)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredIncomeSummaries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hi ha dades disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="border-border/50 bg-card/80 backdrop-blur print:hidden">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-muted-foreground font-medium">Llegenda:</span>
            <Badge variant="outline" className={getTypeColor('ACTIU')}>ACTIU</Badge>
            <Badge variant="outline" className={getTypeColor('PASSIU')}>PASSIU</Badge>
            <Badge variant="outline" className={getTypeColor('PATRIMONI')}>PATRIMONI NET</Badge>
            <Badge variant="outline" className={getTypeColor('INGRESSOS')}>INGRESSOS</Badge>
            <Badge variant="outline" className={getTypeColor('DESPESES')}>DESPESES</Badge>
            <span className="border-l border-border pl-4 ml-2"></span>
            <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/50">PROV = Provisional</Badge>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">CONS = Consolidat</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingGroupsChart;
