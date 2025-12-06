import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Building2, CheckCircle, XCircle, Filter, Download, Eye, FileText, Calendar, Hash, AlertTriangle, BarChart3 } from 'lucide-react';
import { getCnaeDescription } from '@/lib/cnaeDescriptions';
import * as XLSX from 'xlsx';

interface CompanyWithAccounting {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
  cnae: string | null;
  legal_form: string | null;
  created_at: string | null;
  fiscal_years: number[];
  statement_types: string[];
  has_balance: boolean;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  is_balanced: boolean;
}

interface AccountingCompanyIndexProps {
  onSelectCompany: (companyId: string) => void;
}

const AccountingCompanyIndex = ({ onSelectCompany }: AccountingCompanyIndexProps) => {
  const [companies, setCompanies] = useState<CompanyWithAccounting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBalanced, setFilterBalanced] = useState<'all' | 'balanced' | 'unbalanced'>('all');
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  useEffect(() => {
    fetchCompaniesWithAccounting();
  }, []);

  const fetchCompaniesWithAccounting = async () => {
    setLoading(true);
    try {
      // Fetch all companies with financial statements
      const { data: statements, error: stmtError } = await supabase
        .from('company_financial_statements')
        .select(`
          id,
          company_id,
          fiscal_year,
          statement_type,
          companies!inner (
            id,
            name,
            bp,
            tax_id,
            cnae,
            legal_form,
            created_at
          )
        `)
        .eq('is_archived', false);

      if (stmtError) throw stmtError;

      // Group by company
      const companyMap = new Map<string, CompanyWithAccounting>();

      for (const stmt of statements || []) {
        const company = stmt.companies as any;
        if (!company) continue;

        if (!companyMap.has(company.id)) {
          companyMap.set(company.id, {
            id: company.id,
            name: company.name,
            bp: company.bp,
            tax_id: company.tax_id,
            cnae: company.cnae,
            legal_form: company.legal_form,
            created_at: company.created_at,
            fiscal_years: [],
            statement_types: [],
            has_balance: false,
            total_assets: 0,
            total_liabilities: 0,
            total_equity: 0,
            is_balanced: true
          });
        }

        const existing = companyMap.get(company.id)!;
        if (!existing.fiscal_years.includes(stmt.fiscal_year)) {
          existing.fiscal_years.push(stmt.fiscal_year);
        }
        if (!existing.statement_types.includes(stmt.statement_type)) {
          existing.statement_types.push(stmt.statement_type);
        }
      }

      // Fetch balance data for validation
      const companyIds = Array.from(companyMap.keys());
      if (companyIds.length > 0) {
        const { data: balances } = await supabase
          .from('balance_sheets')
          .select(`
            statement_id,
            tangible_assets,
            intangible_assets,
            goodwill,
            real_estate_investments,
            long_term_group_investments,
            long_term_financial_investments,
            deferred_tax_assets,
            inventory,
            trade_receivables,
            short_term_financial_investments,
            cash_equivalents,
            share_capital,
            share_premium,
            legal_reserve,
            voluntary_reserves,
            retained_earnings,
            current_year_result,
            long_term_debts,
            short_term_debts,
            trade_payables,
            other_creditors,
            company_financial_statements!inner (
              company_id,
              fiscal_year,
              is_archived
            )
          `)
          .in('company_financial_statements.company_id', companyIds)
          .eq('company_financial_statements.is_archived', false);

        for (const balance of balances || []) {
          const stmt = balance.company_financial_statements as any;
          if (!stmt) continue;

          const company = companyMap.get(stmt.company_id);
          if (!company) continue;

          // Calculate totals (simplified)
          const assets = (balance.tangible_assets || 0) + (balance.intangible_assets || 0) +
            (balance.goodwill || 0) + (balance.real_estate_investments || 0) +
            (balance.long_term_financial_investments || 0) + (balance.deferred_tax_assets || 0) +
            (balance.inventory || 0) + (balance.trade_receivables || 0) +
            (balance.short_term_financial_investments || 0) + (balance.cash_equivalents || 0);

          const equity = (balance.share_capital || 0) + (balance.share_premium || 0) +
            (balance.legal_reserve || 0) + (balance.voluntary_reserves || 0) +
            (balance.retained_earnings || 0) + (balance.current_year_result || 0);

          const liabilities = (balance.long_term_debts || 0) + (balance.short_term_debts || 0) +
            (balance.trade_payables || 0) + (balance.other_creditors || 0);

          company.total_assets = assets;
          company.total_equity = equity;
          company.total_liabilities = liabilities;
          company.has_balance = true;
          
          // Check if balanced (Assets = Equity + Liabilities) with tolerance
          const difference = Math.abs(assets - (equity + liabilities));
          company.is_balanced = difference < 1; // 1€ tolerance
        }
      }

      setCompanies(Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = company.name.toLowerCase().includes(search);
      const matchesBp = company.bp?.toLowerCase().includes(search);
      const matchesTax = company.tax_id?.toLowerCase().includes(search);
      const matchesCnae = company.cnae?.toLowerCase().includes(search);
      if (!matchesName && !matchesBp && !matchesTax && !matchesCnae) return false;
    }

    // Balance filter
    if (filterBalanced === 'balanced' && !company.is_balanced) return false;
    if (filterBalanced === 'unbalanced' && company.is_balanced) return false;

    // Model filter
    if (filterModel !== 'all' && !company.statement_types.includes(filterModel)) return false;

    // Year filter
    if (filterYear !== 'all' && !company.fiscal_years.includes(parseInt(filterYear))) return false;

    return true;
  });

  const availableYears = [...new Set(companies.flatMap(c => c.fiscal_years))].sort((a, b) => b - a);

  const stats = {
    total: companies.length,
    balanced: companies.filter(c => c.is_balanced).length,
    unbalanced: companies.filter(c => !c.is_balanced && c.has_balance).length,
    noBalance: companies.filter(c => !c.has_balance).length
  };

  const exportToExcel = () => {
    const data = filteredCompanies.map(c => ({
      'Nom': c.name,
      'BP': c.bp || '',
      'NRT': c.tax_id || '',
      'CNAE': c.cnae || '',
      'Sector': getCnaeDescription(c.cnae),
      'Forma Jurídica': c.legal_form || '',
      'Anys Fiscals': c.fiscal_years.sort((a, b) => b - a).join(', '),
      'Model': c.statement_types.join(', '),
      'Cuadre': c.is_balanced ? 'OK' : 'ERROR',
      'Total Actiu': c.total_assets,
      'Total Passiu': c.total_liabilities,
      'Patrimoni Net': c.total_equity
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empreses');
    XLSX.writeFile(wb, `empreses_comptabilitat_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getModelBadge = (types: string[]) => {
    const colors: Record<string, string> = {
      normal: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      abreujat: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
      simplificat: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
    };
    
    return types.map(type => (
      <Badge key={type} variant="outline" className={`${colors[type] || ''} text-xs`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    ));
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Empreses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.balanced}</p>
                <p className="text-xs text-muted-foreground">Quadrats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.unbalanced}</p>
                <p className="text-xs text-muted-foreground">Descuadrats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats.noBalance}</p>
                <p className="text-xs text-muted-foreground">Sense balanç</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Índex d'Empreses amb Comptabilitat
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cercar per nom, BP, NRT o CNAE..."
                className="pl-10"
              />
            </div>
            
            <Select value={filterBalanced} onValueChange={(v: 'all' | 'balanced' | 'unbalanced') => setFilterBalanced(v)}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Estat cuadre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cuadre: Tots</SelectItem>
                <SelectItem value="balanced">Quadrats</SelectItem>
                <SelectItem value="unbalanced">Descuadrats</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-[160px]">
                <FileText className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Model comptable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Model: Tots</SelectItem>
                <SelectItem value="normal">Normal (PGC)</SelectItem>
                <SelectItem value="abreujat">Abreujat</SelectItem>
                <SelectItem value="simplificat">Simplificat</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Any fiscal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any: Tots</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Carregant empreses...</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">
                      <Hash className="w-4 h-4" />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>BP / NRT</TableHead>
                    <TableHead>CNAE / Sector</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Anys</TableHead>
                    <TableHead className="text-center">Cuadre</TableHead>
                    <TableHead className="text-right">Accions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No s'han trobat empreses
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company, index) => (
                      <TableRow key={company.id} className="hover:bg-muted/30">
                        <TableCell className="text-muted-foreground text-sm">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{company.name}</div>
                          {company.legal_form && (
                            <div className="text-xs text-muted-foreground">{company.legal_form}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.bp && (
                              <div className="text-xs flex items-center gap-1">
                                <span className="text-muted-foreground">BP:</span> {company.bp}
                              </div>
                            )}
                            {company.tax_id && (
                              <div className="text-xs flex items-center gap-1">
                                <span className="text-muted-foreground">NRT:</span> {company.tax_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  {company.cnae && (
                                    <Badge variant="outline" className="text-xs">
                                      {company.cnae}
                                    </Badge>
                                  )}
                                  {getCnaeDescription(company.cnae) && (
                                    <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                                      {getCnaeDescription(company.cnae)}
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              {getCnaeDescription(company.cnae) && (
                                <TooltipContent>
                                  <p className="max-w-[300px]">{getCnaeDescription(company.cnae)}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {getModelBadge(company.statement_types)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {company.fiscal_years.sort((a, b) => b - a).slice(0, 3).map(year => (
                              <Badge key={year} variant="secondary" className="text-xs">
                                {year}
                              </Badge>
                            ))}
                            {company.fiscal_years.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{company.fiscal_years.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {!company.has_balance ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/30">
                                    -
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Sense dades de balanç</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : company.is_balanced ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                    <CheckCircle className="w-3 h-3 mr-1" /> OK
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p>Actiu: {company.total_assets.toLocaleString('ca-AD')} €</p>
                                    <p>Passiu + PN: {(company.total_liabilities + company.total_equity).toLocaleString('ca-AD')} €</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                                    <XCircle className="w-3 h-3 mr-1" /> ERROR
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p>Actiu: {company.total_assets.toLocaleString('ca-AD')} €</p>
                                    <p>Passiu + PN: {(company.total_liabilities + company.total_equity).toLocaleString('ca-AD')} €</p>
                                    <p className="text-red-400 mt-1">
                                      Diferència: {Math.abs(company.total_assets - company.total_liabilities - company.total_equity).toLocaleString('ca-AD')} €
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectCompany(company.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Veure
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="mt-3 text-sm text-muted-foreground text-right">
            Mostrant {filteredCompanies.length} de {companies.length} empreses
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingCompanyIndex;
