import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, Building2, X, Plus, Layers, Calculator, 
  FileText, Download, Printer, AlertTriangle, CheckCircle,
  ChevronRight, Trash2, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import * as XLSX from 'xlsx';

interface CompanyForConsolidation {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
  fiscal_year: number;
  statement_id: string;
  participation_percentage: number;
  consolidation_method: 'global' | 'proporcional' | 'equivalencia';
  is_parent: boolean;
}

interface BalanceData {
  company_id: string;
  company_name: string;
  // Assets
  intangible_assets: number;
  goodwill: number;
  tangible_assets: number;
  real_estate_investments: number;
  long_term_group_investments: number;
  long_term_financial_investments: number;
  deferred_tax_assets: number;
  inventory: number;
  trade_receivables: number;
  short_term_financial_investments: number;
  cash_equivalents: number;
  // Equity
  share_capital: number;
  share_premium: number;
  legal_reserve: number;
  voluntary_reserves: number;
  retained_earnings: number;
  current_year_result: number;
  // Liabilities
  long_term_debts: number;
  short_term_debts: number;
  trade_payables: number;
  other_creditors: number;
}

interface ConsolidatedBalance {
  total_assets: number;
  total_equity: number;
  total_liabilities: number;
  non_current_assets: number;
  current_assets: number;
  equity_parent: number;
  minority_interests: number;
  non_current_liabilities: number;
  current_liabilities: number;
  consolidation_goodwill: number;
  details: {
    [key: string]: number;
  };
}

interface SearchResult {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
  has_statements: boolean;
  fiscal_years: number[];
}

const ConsolidatedStatementsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyForConsolidation[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [loading, setLoading] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedBalance | null>(null);
  const [balanceDetails, setBalanceDetails] = useState<BalanceData[]>([]);
  const [activeTab, setActiveTab] = useState('selection');
  const [searchBy, setSearchBy] = useState<'name' | 'bp' | 'nrt'>('name');

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  // Search companies
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      try {
        let query = supabase
          .from('companies')
          .select('id, name, bp, tax_id');

        if (searchBy === 'name') {
          query = query.ilike('name', `%${searchTerm}%`);
        } else if (searchBy === 'bp') {
          query = query.ilike('bp', `%${searchTerm}%`);
        } else {
          query = query.ilike('tax_id', `%${searchTerm}%`);
        }

        const { data: companies } = await query.limit(20);

        if (companies) {
          // Check which have financial statements
          const companyIds = companies.map(c => c.id);
          const { data: statements } = await supabase
            .from('company_financial_statements')
            .select('company_id, fiscal_year')
            .in('company_id', companyIds)
            .eq('is_archived', false);

          const results: SearchResult[] = companies.map(c => {
            const companyStatements = statements?.filter(s => s.company_id === c.id) || [];
            return {
              ...c,
              has_statements: companyStatements.length > 0,
              fiscal_years: [...new Set(companyStatements.map(s => s.fiscal_year))].sort((a, b) => b - a)
            };
          });

          setSearchResults(results);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchTerm, searchBy]);

  const addCompany = async (company: SearchResult) => {
    if (selectedCompanies.length >= 15) {
      toast.error('Màxim 15 empreses permeses per consolidació');
      return;
    }

    if (selectedCompanies.some(c => c.id === company.id)) {
      toast.error('Aquesta empresa ja està seleccionada');
      return;
    }

    if (!company.fiscal_years.includes(selectedYear)) {
      toast.error(`Aquesta empresa no té estats financers per l'any ${selectedYear}`);
      return;
    }

    // Get statement ID
    const { data: statement } = await supabase
      .from('company_financial_statements')
      .select('id')
      .eq('company_id', company.id)
      .eq('fiscal_year', selectedYear)
      .eq('is_archived', false)
      .single();

    if (!statement) {
      toast.error('No s\'ha trobat l\'estat financer');
      return;
    }

    const isFirst = selectedCompanies.length === 0;

    setSelectedCompanies([...selectedCompanies, {
      id: company.id,
      name: company.name,
      bp: company.bp,
      tax_id: company.tax_id,
      fiscal_year: selectedYear,
      statement_id: statement.id,
      participation_percentage: isFirst ? 100 : 100,
      consolidation_method: 'global',
      is_parent: isFirst
    }]);

    setSearchTerm('');
    setSearchResults([]);
  };

  const removeCompany = (companyId: string) => {
    const remaining = selectedCompanies.filter(c => c.id !== companyId);
    // If removing parent, make first remaining company the parent
    if (selectedCompanies.find(c => c.id === companyId)?.is_parent && remaining.length > 0) {
      remaining[0].is_parent = true;
    }
    setSelectedCompanies(remaining);
    setConsolidatedData(null);
  };

  const updateCompanySettings = (companyId: string, field: string, value: any) => {
    setSelectedCompanies(companies => 
      companies.map(c => c.id === companyId ? { ...c, [field]: value } : c)
    );
  };

  const setAsParent = (companyId: string) => {
    setSelectedCompanies(companies => 
      companies.map(c => ({ ...c, is_parent: c.id === companyId }))
    );
  };

  const consolidateBalances = async () => {
    if (selectedCompanies.length < 2) {
      toast.error('Es necessiten almenys 2 empreses per consolidar');
      return;
    }

    setLoading(true);
    try {
      // Fetch all balance sheets
      const balances: BalanceData[] = [];
      
      for (const company of selectedCompanies) {
        const { data } = await supabase
          .from('balance_sheets')
          .select('*')
          .eq('statement_id', company.statement_id)
          .single();

        if (data) {
          balances.push({
            company_id: company.id,
            company_name: company.name,
            intangible_assets: data.intangible_assets || 0,
            goodwill: data.goodwill || 0,
            tangible_assets: data.tangible_assets || 0,
            real_estate_investments: data.real_estate_investments || 0,
            long_term_group_investments: data.long_term_group_investments || 0,
            long_term_financial_investments: data.long_term_financial_investments || 0,
            deferred_tax_assets: data.deferred_tax_assets || 0,
            inventory: data.inventory || 0,
            trade_receivables: data.trade_receivables || 0,
            short_term_financial_investments: data.short_term_financial_investments || 0,
            cash_equivalents: data.cash_equivalents || 0,
            share_capital: data.share_capital || 0,
            share_premium: data.share_premium || 0,
            legal_reserve: data.legal_reserve || 0,
            voluntary_reserves: data.voluntary_reserves || 0,
            retained_earnings: data.retained_earnings || 0,
            current_year_result: data.current_year_result || 0,
            long_term_debts: data.long_term_debts || 0,
            short_term_debts: data.short_term_debts || 0,
            trade_payables: data.trade_payables || 0,
            other_creditors: data.other_creditors || 0
          });
        }
      }

      setBalanceDetails(balances);

      // Perform consolidation according to Andorran regulations
      const consolidated = performConsolidation(balances, selectedCompanies);
      setConsolidatedData(consolidated);
      setActiveTab('result');
      toast.success('Consolidació completada');
    } catch (error) {
      console.error('Consolidation error:', error);
      toast.error('Error en la consolidació');
    } finally {
      setLoading(false);
    }
  };

  const performConsolidation = (
    balances: BalanceData[], 
    companies: CompanyForConsolidation[]
  ): ConsolidatedBalance => {
    // Initialize consolidated values
    const details: { [key: string]: number } = {};
    
    // Find parent company
    const parentCompany = companies.find(c => c.is_parent);
    const subsidiaries = companies.filter(c => !c.is_parent);

    // Step 1: Aggregate all balances (Article 14 - Agregació)
    const aggregateField = (field: keyof BalanceData) => {
      return balances.reduce((sum, b) => {
        const company = companies.find(c => c.id === b.company_id);
        if (!company) return sum;
        
        const value = typeof b[field] === 'number' ? b[field] : 0;
        
        // Apply consolidation method (Article 9 & 34)
        if (company.consolidation_method === 'global') {
          return sum + value; // Full integration
        } else if (company.consolidation_method === 'proporcional') {
          return sum + (value * (company.participation_percentage / 100));
        } else {
          // Equity method - only equity value
          return sum;
        }
        return sum + value;
      }, 0);
    };

    // Assets
    details.intangible_assets = aggregateField('intangible_assets');
    details.goodwill = aggregateField('goodwill');
    details.tangible_assets = aggregateField('tangible_assets');
    details.real_estate_investments = aggregateField('real_estate_investments');
    details.long_term_financial_investments = aggregateField('long_term_financial_investments');
    details.deferred_tax_assets = aggregateField('deferred_tax_assets');
    details.inventory = aggregateField('inventory');
    details.trade_receivables = aggregateField('trade_receivables');
    details.short_term_financial_investments = aggregateField('short_term_financial_investments');
    details.cash_equivalents = aggregateField('cash_equivalents');

    // Equity (before eliminations)
    details.share_capital = aggregateField('share_capital');
    details.share_premium = aggregateField('share_premium');
    details.legal_reserve = aggregateField('legal_reserve');
    details.voluntary_reserves = aggregateField('voluntary_reserves');
    details.retained_earnings = aggregateField('retained_earnings');
    details.current_year_result = aggregateField('current_year_result');

    // Liabilities
    details.long_term_debts = aggregateField('long_term_debts');
    details.short_term_debts = aggregateField('short_term_debts');
    details.trade_payables = aggregateField('trade_payables');
    details.other_creditors = aggregateField('other_creditors');

    // Step 2: Eliminate inter-group investments (Article 15 - Eliminació inversió-patrimoni net)
    // Calculate investment eliminations
    let investmentElimination = 0;
    let consolidationGoodwill = 0;
    let minorityInterests = 0;

    // For each subsidiary, eliminate parent's investment
    subsidiaries.forEach(sub => {
      const subBalance = balances.find(b => b.company_id === sub.id);
      if (!subBalance) return;

      // Subsidiary's equity
      const subEquity = subBalance.share_capital + subBalance.share_premium + 
        subBalance.legal_reserve + subBalance.voluntary_reserves + 
        subBalance.retained_earnings + subBalance.current_year_result;

      // Parent's share of subsidiary equity
      const parentShare = subEquity * (sub.participation_percentage / 100);
      
      // Minority (external shareholders) share (Article 21 - Socis externs)
      const minorityShare = subEquity * ((100 - sub.participation_percentage) / 100);
      minorityInterests += minorityShare;

      // Eliminate inter-group investments from parent
      // The difference between investment cost and equity share becomes goodwill or negative difference
      // For simplicity, we assume investment equals equity share (no goodwill)
      investmentElimination += parentShare;
    });

    // Step 3: Eliminate parent's long-term group investments (intercompany investments)
    details.long_term_group_investments = 0; // Eliminated in consolidation

    // Calculate totals
    const non_current_assets = details.intangible_assets + details.goodwill + 
      details.tangible_assets + details.real_estate_investments +
      details.long_term_financial_investments + details.deferred_tax_assets;

    const current_assets = details.inventory + details.trade_receivables + 
      details.short_term_financial_investments + details.cash_equivalents;

    const total_assets = non_current_assets + current_assets + consolidationGoodwill;

    // Consolidated equity = Parent equity + parent's share of subsidiaries' post-acquisition results
    const parentBalance = parentCompany ? balances.find(b => b.company_id === parentCompany.id) : null;
    const parentEquity = parentBalance ? (
      parentBalance.share_capital + parentBalance.share_premium + 
      parentBalance.legal_reserve + parentBalance.voluntary_reserves + 
      parentBalance.retained_earnings + parentBalance.current_year_result
    ) : 0;

    // Adjust for consolidation
    const equity_parent = parentEquity + subsidiaries.reduce((sum, sub) => {
      const subBalance = balances.find(b => b.company_id === sub.id);
      if (!subBalance) return sum;
      // Add parent's share of subsidiary results
      return sum + (subBalance.current_year_result * (sub.participation_percentage / 100));
    }, 0);

    const non_current_liabilities = details.long_term_debts;
    const current_liabilities = details.short_term_debts + details.trade_payables + details.other_creditors;
    const total_liabilities = non_current_liabilities + current_liabilities;
    const total_equity = equity_parent + minorityInterests;

    return {
      total_assets,
      total_equity,
      total_liabilities,
      non_current_assets,
      current_assets,
      equity_parent,
      minority_interests: minorityInterests,
      non_current_liabilities,
      current_liabilities,
      consolidation_goodwill: consolidationGoodwill,
      details
    };
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  const exportToExcel = () => {
    if (!consolidatedData) return;

    const data = [
      { Concepte: 'ACTIU NO CORRENT', Import: consolidatedData.non_current_assets },
      { Concepte: 'Immobilitzat intangible', Import: consolidatedData.details.intangible_assets },
      { Concepte: 'Fons de comerç', Import: consolidatedData.details.goodwill },
      { Concepte: 'Immobilitzat material', Import: consolidatedData.details.tangible_assets },
      { Concepte: 'ACTIU CORRENT', Import: consolidatedData.current_assets },
      { Concepte: 'Existències', Import: consolidatedData.details.inventory },
      { Concepte: 'Deutors comercials', Import: consolidatedData.details.trade_receivables },
      { Concepte: 'Efectiu', Import: consolidatedData.details.cash_equivalents },
      { Concepte: 'TOTAL ACTIU', Import: consolidatedData.total_assets },
      { Concepte: '', Import: '' },
      { Concepte: 'PATRIMONI NET', Import: consolidatedData.total_equity },
      { Concepte: 'Patrimoni atribuïble a la matriu', Import: consolidatedData.equity_parent },
      { Concepte: 'Socis externs', Import: consolidatedData.minority_interests },
      { Concepte: 'PASSIU NO CORRENT', Import: consolidatedData.non_current_liabilities },
      { Concepte: 'PASSIU CORRENT', Import: consolidatedData.current_liabilities },
      { Concepte: 'TOTAL PATRIMONI NET I PASSIU', Import: consolidatedData.total_equity + consolidatedData.total_liabilities }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balanç Consolidat');

    // Add detail sheet
    const detailData = balanceDetails.map(b => ({
      Empresa: b.company_name,
      'Immobilitzat intangible': b.intangible_assets,
      'Immobilitzat material': b.tangible_assets,
      'Existències': b.inventory,
      'Deutors': b.trade_receivables,
      'Efectiu': b.cash_equivalents,
      'Capital': b.share_capital,
      'Reserves': b.legal_reserve + b.voluntary_reserves,
      'Resultat': b.current_year_result,
      'Deutes LP': b.long_term_debts,
      'Deutes CP': b.short_term_debts,
      'Creditors': b.trade_payables
    }));
    const ws2 = XLSX.utils.json_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Detall Empreses');

    XLSX.writeFile(wb, `balanc_consolidat_${selectedYear}.xlsx`);
  };

  const printConsolidated = () => {
    if (!consolidatedData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const parentCompany = selectedCompanies.find(c => c.is_parent);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Balanç Consolidat ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
          h1 { font-size: 16px; text-align: center; }
          h2 { font-size: 13px; border-bottom: 2px solid #333; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .amount { text-align: right; }
          .total { font-weight: bold; background: #f0f0f0; }
          .subtotal { font-weight: bold; }
          .group-header { background: #e8e8e8; }
          .perimeter { margin-top: 20px; font-size: 10px; }
          @media print { body { print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>COMPTES ANUALS CONSOLIDATS</h1>
        <p style="text-align:center">
          Grup ${parentCompany?.name || 'Consolidat'} - Exercici ${selectedYear}
        </p>
        
        <h2>BALANÇ DE SITUACIÓ CONSOLIDAT</h2>
        <table>
          <tr class="group-header"><td colspan="2"><strong>ACTIU</strong></td></tr>
          <tr class="subtotal"><td>A) ACTIU NO CORRENT</td><td class="amount">${formatCurrency(consolidatedData.non_current_assets)}</td></tr>
          <tr><td style="padding-left:15px">I. Immobilitzat intangible</td><td class="amount">${formatCurrency(consolidatedData.details.intangible_assets)}</td></tr>
          <tr><td style="padding-left:15px">II. Fons de comerç de consolidació</td><td class="amount">${formatCurrency(consolidatedData.consolidation_goodwill)}</td></tr>
          <tr><td style="padding-left:15px">III. Immobilitzat material</td><td class="amount">${formatCurrency(consolidatedData.details.tangible_assets)}</td></tr>
          <tr><td style="padding-left:15px">IV. Inversions immobiliàries</td><td class="amount">${formatCurrency(consolidatedData.details.real_estate_investments)}</td></tr>
          <tr><td style="padding-left:15px">V. Inversions financeres a llarg termini</td><td class="amount">${formatCurrency(consolidatedData.details.long_term_financial_investments)}</td></tr>
          <tr class="subtotal"><td>B) ACTIU CORRENT</td><td class="amount">${formatCurrency(consolidatedData.current_assets)}</td></tr>
          <tr><td style="padding-left:15px">I. Existències</td><td class="amount">${formatCurrency(consolidatedData.details.inventory)}</td></tr>
          <tr><td style="padding-left:15px">II. Deutors comercials</td><td class="amount">${formatCurrency(consolidatedData.details.trade_receivables)}</td></tr>
          <tr><td style="padding-left:15px">III. Inversions financeres a curt termini</td><td class="amount">${formatCurrency(consolidatedData.details.short_term_financial_investments)}</td></tr>
          <tr><td style="padding-left:15px">IV. Efectiu i equivalents</td><td class="amount">${formatCurrency(consolidatedData.details.cash_equivalents)}</td></tr>
          <tr class="total"><td>TOTAL ACTIU (A+B)</td><td class="amount">${formatCurrency(consolidatedData.total_assets)}</td></tr>
          
          <tr class="group-header"><td colspan="2"><strong>PATRIMONI NET I PASSIU</strong></td></tr>
          <tr class="subtotal"><td>A) PATRIMONI NET</td><td class="amount">${formatCurrency(consolidatedData.total_equity)}</td></tr>
          <tr><td style="padding-left:15px">A-1) Fons propis atribuïbles a la societat matriu</td><td class="amount">${formatCurrency(consolidatedData.equity_parent)}</td></tr>
          <tr><td style="padding-left:15px">A-2) Socis externs</td><td class="amount">${formatCurrency(consolidatedData.minority_interests)}</td></tr>
          <tr class="subtotal"><td>B) PASSIU NO CORRENT</td><td class="amount">${formatCurrency(consolidatedData.non_current_liabilities)}</td></tr>
          <tr class="subtotal"><td>C) PASSIU CORRENT</td><td class="amount">${formatCurrency(consolidatedData.current_liabilities)}</td></tr>
          <tr class="total"><td>TOTAL PATRIMONI NET I PASSIU (A+B+C)</td><td class="amount">${formatCurrency(consolidatedData.total_equity + consolidatedData.total_liabilities)}</td></tr>
        </table>
        
        <div class="perimeter">
          <h3>Perímetre de consolidació:</h3>
          <table>
            <tr><th>Empresa</th><th>BP</th><th>NRT</th><th>% Participació</th><th>Mètode</th></tr>
            ${selectedCompanies.map(c => `
              <tr>
                <td>${c.name} ${c.is_parent ? '(Matriu)' : ''}</td>
                <td>${c.bp || '-'}</td>
                <td>${c.tax_id || '-'}</td>
                <td class="amount">${c.participation_percentage}%</td>
                <td>${c.consolidation_method === 'global' ? 'Integració global' : c.consolidation_method === 'proporcional' ? 'Integració proporcional' : 'Posada en equivalència'}</td>
              </tr>
            `).join('')}
          </table>
          <p style="margin-top:10px; font-style:italic">
            Consolidació realitzada segons el Reglament de formulació dels comptes anuals consolidats d'Andorra 
            (Decret del 15-02-2012)
          </p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Selecció Empreses
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2" disabled={selectedCompanies.length < 2}>
            <Layers className="w-4 h-4" />
            Configuració
          </TabsTrigger>
          <TabsTrigger value="result" className="flex items-center gap-2" disabled={!consolidatedData}>
            <Calculator className="w-4 h-4" />
            Resultat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="selection" className="space-y-4">
          {/* Year Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Consolidació d'Estats Financers
              </CardTitle>
              <CardDescription>
                Selecciona fins a 15 empreses per consolidar segons el Reglament Andorrà
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <Label>Any Fiscal</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cercar per</Label>
                  <Select value={searchBy} onValueChange={(v: 'name' | 'bp' | 'nrt') => setSearchBy(v)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Nom Empresa</SelectItem>
                      <SelectItem value="bp">BP</SelectItem>
                      <SelectItem value="nrt">NRT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 min-w-[250px] space-y-2">
                  <Label>
                    {searchBy === 'name' ? 'Cercar empresa' : searchBy === 'bp' ? 'Cercar per BP' : 'Cercar per NRT'}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={searchBy === 'name' ? "Escriu el nom de l'empresa..." : searchBy === 'bp' ? "Escriu el BP..." : "Escriu el NRT..."}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Badge variant="outline" className="h-10 px-4">
                  {selectedCompanies.length}/15 empreses
                </Badge>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card className="mt-4">
                  <ScrollArea className="h-[200px]">
                    <div className="p-2 space-y-1">
                      {searchResults.map(company => (
                        <div 
                          key={company.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => addCompany(company)}
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{company.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {company.bp && `BP: ${company.bp}`}
                                {company.bp && company.tax_id && ' | '}
                                {company.tax_id && `NRT: ${company.tax_id}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {company.has_statements ? (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {company.fiscal_years.slice(0, 3).join(', ')}
                                  {company.fiscal_years.length > 3 && '...'}
                                </Badge>
                                {company.fiscal_years.includes(selectedYear) ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        No té dades per {selectedYear}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            ) : (
                              <Badge variant="destructive" className="text-xs">Sense EEFF</Badge>
                            )}
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Selected Companies */}
          {selectedCompanies.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Empreses Seleccionades</CardTitle>
                  <Button 
                    onClick={() => setActiveTab('config')}
                    disabled={selectedCompanies.length < 2}
                  >
                    Configurar Consolidació
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>BP</TableHead>
                      <TableHead>NRT</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCompanies.map(company => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{company.bp || '-'}</TableCell>
                        <TableCell>{company.tax_id || '-'}</TableCell>
                        <TableCell>
                          {company.is_parent ? (
                            <Badge className="bg-primary">Matriu</Badge>
                          ) : (
                            <Badge variant="outline">Filial</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompany(company.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Configuració de la Consolidació
              </CardTitle>
              <CardDescription>
                Defineix el mètode de consolidació i percentatge de participació per cada empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>% Participació</TableHead>
                      <TableHead>Mètode de Consolidació</TableHead>
                      <TableHead className="w-[80px]">Accions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCompanies.map(company => (
                      <TableRow key={company.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {company.bp && `BP: ${company.bp}`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.is_parent ? (
                            <Badge className="bg-primary">Societat Matriu</Badge>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setAsParent(company.id)}
                            >
                              Definir com a Matriu
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={company.participation_percentage}
                            onChange={(e) => updateCompanySettings(company.id, 'participation_percentage', parseFloat(e.target.value) || 0)}
                            className="w-[80px]"
                            disabled={company.is_parent}
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={company.consolidation_method}
                            onValueChange={(v) => updateCompanySettings(company.id, 'consolidation_method', v)}
                            disabled={company.is_parent}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="global">
                                <div className="flex items-center gap-2">
                                  <span>Integració Global</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-3 h-3" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[250px]">
                                        Art. 9: Incorporació total d'actius, passius, ingressos i despeses
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </SelectItem>
                              <SelectItem value="proporcional">
                                <div className="flex items-center gap-2">
                                  <span>Integració Proporcional</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-3 h-3" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[250px]">
                                        Art. 34: Incorporació proporcional al % de participació
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </SelectItem>
                              <SelectItem value="equivalencia">
                                <div className="flex items-center gap-2">
                                  <span>Posada en Equivalència</span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="w-3 h-3" />
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-[250px]">
                                        Art. 36: Mètode de participació per associades (20-50%)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompany(company.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={consolidateBalances} 
                  disabled={loading || selectedCompanies.length < 2}
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Consolidant...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Executar Consolidació
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Mètodes de consolidació segons el Reglament Andorrà:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Integració Global (Art. 9):</strong> Per filials amb control (&gt;50%). S'incorporen tots els actius, passius, ingressos i despeses.</li>
                    <li><strong>Integració Proporcional (Art. 34):</strong> Per empreses gestionades conjuntament. S'incorpora la proporció del % de participació.</li>
                    <li><strong>Posada en Equivalència (Art. 36):</strong> Per associades (20-50%). La inversió es valora pel % del patrimoni net.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          {consolidatedData && (
            <>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={exportToExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>
                <Button variant="outline" onClick={printConsolidated}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Balanç de Situació Consolidat - Exercici {selectedYear}
                  </CardTitle>
                  <CardDescription>
                    Grup {selectedCompanies.find(c => c.is_parent)?.name} | {selectedCompanies.length} empreses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Assets */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">ACTIU</h3>
                      
                      <div>
                        <h4 className="font-semibold text-primary">A) Actiu No Corrent</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="pl-4">I. Immobilitzat intangible</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.intangible_assets)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">II. Fons de comerç de consolidació</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.consolidation_goodwill)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">III. Immobilitzat material</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.tangible_assets)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">IV. Inversions immobiliàries</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.real_estate_investments)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">V. Inversions financeres LP</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.long_term_financial_investments)}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold bg-muted/30">
                              <TableCell>Total Actiu No Corrent</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.non_current_assets)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">B) Actiu Corrent</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="pl-4">I. Existències</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.inventory)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">II. Deutors comercials</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.trade_receivables)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">III. Inversions financeres CP</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.short_term_financial_investments)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">IV. Efectiu i equivalents</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.cash_equivalents)}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold bg-muted/30">
                              <TableCell>Total Actiu Corrent</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.current_assets)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>TOTAL ACTIU</span>
                          <span>{formatCurrency(consolidatedData.total_assets)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity & Liabilities */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg border-b pb-2">PATRIMONI NET I PASSIU</h3>
                      
                      <div>
                        <h4 className="font-semibold text-primary">A) Patrimoni Net</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="pl-4">A-1) Fons propis atribuïbles a la matriu</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.equity_parent)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">A-2) Socis externs</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.minority_interests)}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold bg-muted/30">
                              <TableCell>Total Patrimoni Net</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.total_equity)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">B) Passiu No Corrent</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="pl-4">Deutes a llarg termini</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.long_term_debts)}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold bg-muted/30">
                              <TableCell>Total Passiu No Corrent</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.non_current_liabilities)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div>
                        <h4 className="font-semibold text-primary">C) Passiu Corrent</h4>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell className="pl-4">Deutes a curt termini</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.short_term_debts)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">Creditors comercials</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.trade_payables)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell className="pl-4">Altres creditors</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.details.other_creditors)}</TableCell>
                            </TableRow>
                            <TableRow className="font-semibold bg-muted/30">
                              <TableCell>Total Passiu Corrent</TableCell>
                              <TableCell className="text-right">{formatCurrency(consolidatedData.current_liabilities)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>

                      <div className="bg-primary/10 rounded-lg p-3">
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span>TOTAL PN + PASSIU</span>
                          <span>{formatCurrency(consolidatedData.total_equity + consolidatedData.total_liabilities)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Check */}
                  <div className="mt-6 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {Math.abs(consolidatedData.total_assets - (consolidatedData.total_equity + consolidatedData.total_liabilities)) < 1 ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <div>
                            <p className="font-semibold text-green-700">Balanç Quadrat</p>
                            <p className="text-sm text-muted-foreground">Actiu = Patrimoni Net + Passiu</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-6 h-6 text-amber-500" />
                          <div>
                            <p className="font-semibold text-amber-700">Diferència detectada</p>
                            <p className="text-sm text-muted-foreground">
                              Diferència: {formatCurrency(consolidatedData.total_assets - (consolidatedData.total_equity + consolidatedData.total_liabilities))}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Detall per Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead className="text-right">Actiu</TableHead>
                          <TableHead className="text-right">PN</TableHead>
                          <TableHead className="text-right">Passiu</TableHead>
                          <TableHead className="text-right">Resultat</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {balanceDetails.map(b => {
                          const company = selectedCompanies.find(c => c.id === b.company_id);
                          const totalAssets = b.intangible_assets + b.tangible_assets + b.inventory + 
                            b.trade_receivables + b.cash_equivalents + b.long_term_financial_investments +
                            b.short_term_financial_investments;
                          const totalEquity = b.share_capital + b.share_premium + b.legal_reserve + 
                            b.voluntary_reserves + b.retained_earnings + b.current_year_result;
                          const totalLiabilities = b.long_term_debts + b.short_term_debts + 
                            b.trade_payables + b.other_creditors;
                          
                          return (
                            <TableRow key={b.company_id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {company?.is_parent && <Badge className="text-xs">Matriu</Badge>}
                                  {b.company_name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(totalAssets)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(totalEquity)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(totalLiabilities)}</TableCell>
                              <TableCell className="text-right font-medium">
                                <span className={b.current_year_result >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatCurrency(b.current_year_result)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConsolidatedStatementsManager;
