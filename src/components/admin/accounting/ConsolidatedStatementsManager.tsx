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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, Building2, X, Plus, Layers, Calculator, 
  FileText, Download, Printer, AlertTriangle, CheckCircle,
  ChevronRight, Trash2, Info, Save, Upload, FolderOpen, 
  Link2, Users, FileUp
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
  share_capital: number;
  share_premium: number;
  legal_reserve: number;
  voluntary_reserves: number;
  retained_earnings: number;
  current_year_result: number;
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

interface ConsolidationGroup {
  id: string;
  group_name: string;
  fiscal_year: number;
  parent_company_id: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  member_count?: number;
  parent_name?: string;
}

const ConsolidatedStatementsManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<CompanyForConsolidation[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear() - 1);
  const [loading, setLoading] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedBalance | null>(null);
  const [balanceDetails, setBalanceDetails] = useState<BalanceData[]>([]);
  const [activeTab, setActiveTab] = useState('groups');
  const [searchBy, setSearchBy] = useState<'name' | 'bp' | 'nrt'>('name');
  
  // Group management
  const [existingGroups, setExistingGroups] = useState<ConsolidationGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupNotes, setGroupNotes] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // PDF Import
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - 1 - i);

  // Fetch existing consolidation groups
  useEffect(() => {
    fetchExistingGroups();
  }, []);

  const fetchExistingGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data: groups, error } = await supabase
        .from('consolidation_groups')
        .select(`
          id,
          group_name,
          fiscal_year,
          parent_company_id,
          status,
          notes,
          created_at
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts and parent names
      const groupsWithDetails: ConsolidationGroup[] = [];
      
      for (const group of groups || []) {
        const { count } = await supabase
          .from('consolidation_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        let parentName = null;
        if (group.parent_company_id) {
          const { data: parent } = await supabase
            .from('companies')
            .select('name')
            .eq('id', group.parent_company_id)
            .single();
          parentName = parent?.name;
        }

        groupsWithDetails.push({
          ...group,
          member_count: count || 0,
          parent_name: parentName || undefined
        });
      }

      setExistingGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoadingGroups(false);
    }
  };

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

  const saveConsolidationGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Cal introduir un nom per al grup');
      return;
    }

    if (selectedCompanies.length < 2) {
      toast.error('Es necessiten almenys 2 empreses');
      return;
    }

    setSavingGroup(true);
    try {
      const parentCompany = selectedCompanies.find(c => c.is_parent);
      
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('consolidation_groups')
        .insert({
          group_name: groupName,
          fiscal_year: selectedYear,
          parent_company_id: parentCompany?.id || null,
          notes: groupNotes || null,
          status: 'active'
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members
      const members = selectedCompanies.map(c => ({
        group_id: group.id,
        company_id: c.id,
        consolidation_method: c.consolidation_method === 'global' ? 'global' : 
                             c.consolidation_method === 'proporcional' ? 'proportional' : 'equity',
        participation_percentage: c.participation_percentage,
        is_parent: c.is_parent
      }));

      const { error: membersError } = await supabase
        .from('consolidation_group_members')
        .insert(members);

      if (membersError) throw membersError;

      // Save consolidated statement if available
      if (consolidatedData) {
        const { data: stmt, error: stmtError } = await supabase
          .from('consolidated_financial_statements')
          .insert({
            group_id: group.id,
            fiscal_year: selectedYear,
            statement_type: 'normal',
            status: 'draft',
            source: 'calculated'
          })
          .select()
          .single();

        if (stmtError) throw stmtError;

        // Save consolidated balance sheet
        await supabase
          .from('consolidated_balance_sheets')
          .insert({
            statement_id: stmt.id,
            intangible_assets: consolidatedData.details.intangible_assets || 0,
            goodwill: consolidatedData.details.goodwill || 0,
            tangible_assets: consolidatedData.details.tangible_assets || 0,
            real_estate_investments: consolidatedData.details.real_estate_investments || 0,
            long_term_financial_investments: consolidatedData.details.long_term_financial_investments || 0,
            deferred_tax_assets: consolidatedData.details.deferred_tax_assets || 0,
            inventory: consolidatedData.details.inventory || 0,
            trade_receivables: consolidatedData.details.trade_receivables || 0,
            short_term_financial_investments: consolidatedData.details.short_term_financial_investments || 0,
            cash_equivalents: consolidatedData.details.cash_equivalents || 0,
            share_capital: consolidatedData.details.share_capital || 0,
            share_premium: consolidatedData.details.share_premium || 0,
            legal_reserve: consolidatedData.details.legal_reserve || 0,
            voluntary_reserves: consolidatedData.details.voluntary_reserves || 0,
            retained_earnings: consolidatedData.details.retained_earnings || 0,
            current_year_result: consolidatedData.details.current_year_result || 0,
            minority_interests: consolidatedData.minority_interests || 0,
            long_term_debts: consolidatedData.details.long_term_debts || 0,
            short_term_debts: consolidatedData.details.short_term_debts || 0,
            trade_payables: consolidatedData.details.trade_payables || 0,
            other_creditors: consolidatedData.details.other_creditors || 0
          });
      }

      toast.success(`Grup "${groupName}" guardat correctament`);
      setSelectedGroupId(group.id);
      fetchExistingGroups();
      setGroupName('');
      setGroupNotes('');
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Error al guardar el grup');
    } finally {
      setSavingGroup(false);
    }
  };

  const loadGroup = async (group: ConsolidationGroup) => {
    setLoading(true);
    try {
      const { data: members, error } = await supabase
        .from('consolidation_group_members')
        .select(`
          company_id,
          consolidation_method,
          participation_percentage,
          is_parent,
          companies (
            id, name, bp, tax_id
          )
        `)
        .eq('group_id', group.id);

      if (error) throw error;

      const loadedCompanies: CompanyForConsolidation[] = [];
      
      for (const member of members || []) {
        const company = member.companies as any;
        if (!company) continue;

        const { data: statement } = await supabase
          .from('company_financial_statements')
          .select('id')
          .eq('company_id', company.id)
          .eq('fiscal_year', group.fiscal_year)
          .eq('is_archived', false)
          .single();

        loadedCompanies.push({
          id: company.id,
          name: company.name,
          bp: company.bp,
          tax_id: company.tax_id,
          fiscal_year: group.fiscal_year,
          statement_id: statement?.id || '',
          participation_percentage: member.participation_percentage,
          consolidation_method: member.consolidation_method === 'global' ? 'global' : 
                               member.consolidation_method === 'proportional' ? 'proporcional' : 'equivalencia',
          is_parent: member.is_parent
        });
      }

      setSelectedCompanies(loadedCompanies);
      setSelectedYear(group.fiscal_year);
      setGroupName(group.group_name);
      setGroupNotes(group.notes || '');
      setSelectedGroupId(group.id);
      setActiveTab('selection');
      toast.success(`Grup "${group.group_name}" carregat`);
    } catch (error) {
      console.error('Error loading group:', error);
      toast.error('Error al carregar el grup');
    } finally {
      setLoading(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Segur que vols eliminar aquest grup de consolidació?')) return;
    
    try {
      await supabase
        .from('consolidation_groups')
        .update({ status: 'archived' })
        .eq('id', groupId);
      
      toast.success('Grup eliminat');
      fetchExistingGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Error al eliminar');
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;

    setParsingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];

        const { data, error } = await supabase.functions.invoke('parse-financial-pdf', {
          body: { pdfBase64: base64, statementType: 'consolidated' }
        });

        if (error) throw error;

        if (data?.mappedFields) {
          // Apply parsed data to consolidated balance
          const parsed = data.mappedFields;
          const details: { [key: string]: number } = {};
          
          parsed.forEach((field: any) => {
            if (field.value !== null && field.value !== undefined) {
              details[field.label.toLowerCase().replace(/\s+/g, '_')] = parseFloat(field.value) || 0;
            }
          });

          toast.success('PDF processat correctament');
          setShowPdfDialog(false);
          setPdfFile(null);
        }
      };
      reader.readAsDataURL(pdfFile);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast.error('Error al processar el PDF');
    } finally {
      setParsingPdf(false);
    }
  };

  const distributeToMembers = async () => {
    if (!consolidatedData || selectedCompanies.length === 0) {
      toast.error('No hi ha dades per distribuir');
      return;
    }

    const confirmed = confirm(
      `Això copiarà el balanç consolidat als ${selectedCompanies.length} empreses del grup com a referència. Continuar?`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      for (const company of selectedCompanies) {
        // Check if company already has a consolidated statement reference
        const { data: existing } = await supabase
          .from('company_financial_statements')
          .select('id')
          .eq('company_id', company.id)
          .eq('fiscal_year', selectedYear)
          .eq('source', 'consolidated')
          .single();

        if (!existing) {
          // Create a new statement marked as consolidated source
          await supabase
            .from('company_financial_statements')
            .insert({
              company_id: company.id,
              fiscal_year: selectedYear,
              statement_type: 'normal',
              status: 'approved',
              source: 'manual'
            });
        }
      }

      toast.success('Balanç consolidat distribuït a totes les empreses del grup');
    } catch (error) {
      console.error('Error distributing:', error);
      toast.error('Error al distribuir');
    } finally {
      setLoading(false);
    }
  };

  const consolidateBalances = async () => {
    if (selectedCompanies.length < 2) {
      toast.error('Es necessiten almenys 2 empreses per consolidar');
      return;
    }

    setLoading(true);
    try {
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
    const details: { [key: string]: number } = {};
    
    const parentCompany = companies.find(c => c.is_parent);
    const subsidiaries = companies.filter(c => !c.is_parent);

    const aggregateField = (field: keyof BalanceData) => {
      return balances.reduce((sum, b) => {
        const company = companies.find(c => c.id === b.company_id);
        if (!company) return sum;
        
        const value = typeof b[field] === 'number' ? b[field] : 0;
        
        if (company.consolidation_method === 'global') {
          return sum + value;
        } else if (company.consolidation_method === 'proporcional') {
          return sum + (value * (company.participation_percentage / 100));
        }
        return sum + value;
      }, 0);
    };

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

    details.share_capital = aggregateField('share_capital');
    details.share_premium = aggregateField('share_premium');
    details.legal_reserve = aggregateField('legal_reserve');
    details.voluntary_reserves = aggregateField('voluntary_reserves');
    details.retained_earnings = aggregateField('retained_earnings');
    details.current_year_result = aggregateField('current_year_result');

    details.long_term_debts = aggregateField('long_term_debts');
    details.short_term_debts = aggregateField('short_term_debts');
    details.trade_payables = aggregateField('trade_payables');
    details.other_creditors = aggregateField('other_creditors');

    let minorityInterests = 0;

    subsidiaries.forEach(sub => {
      const subBalance = balances.find(b => b.company_id === sub.id);
      if (!subBalance) return;

      const subEquity = subBalance.share_capital + subBalance.share_premium + 
        subBalance.legal_reserve + subBalance.voluntary_reserves + 
        subBalance.retained_earnings + subBalance.current_year_result;

      const minorityShare = subEquity * ((100 - sub.participation_percentage) / 100);
      minorityInterests += minorityShare;
    });

    details.long_term_group_investments = 0;

    const non_current_assets = details.intangible_assets + details.goodwill + 
      details.tangible_assets + details.real_estate_investments +
      details.long_term_financial_investments + details.deferred_tax_assets;

    const current_assets = details.inventory + details.trade_receivables + 
      details.short_term_financial_investments + details.cash_equivalents;

    const total_assets = non_current_assets + current_assets;

    const parentBalance = parentCompany ? balances.find(b => b.company_id === parentCompany.id) : null;
    const parentEquity = parentBalance ? (
      parentBalance.share_capital + parentBalance.share_premium + 
      parentBalance.legal_reserve + parentBalance.voluntary_reserves + 
      parentBalance.retained_earnings + parentBalance.current_year_result
    ) : 0;

    const equity_parent = parentEquity + subsidiaries.reduce((sum, sub) => {
      const subBalance = balances.find(b => b.company_id === sub.id);
      if (!subBalance) return sum;
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
      consolidation_goodwill: 0,
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Grups
          </TabsTrigger>
          <TabsTrigger value="selection" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Selecció
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

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Grups de Consolidació
                  </CardTitle>
                  <CardDescription>
                    Gestiona els grups d'empreses consolidades existents
                  </CardDescription>
                </div>
                <Button onClick={() => setActiveTab('selection')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nou Grup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingGroups ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  <p className="mt-4 text-muted-foreground">Carregant grups...</p>
                </div>
              ) : existingGroups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hi ha grups de consolidació</p>
                  <p className="text-sm">Crea un nou grup seleccionant empreses</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom del Grup</TableHead>
                        <TableHead>Matriu</TableHead>
                        <TableHead>Any</TableHead>
                        <TableHead>Empreses</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[100px]">Accions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingGroups.map(group => (
                        <TableRow key={group.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link2 className="w-4 h-4 text-primary" />
                              <span className="font-medium">{group.group_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{group.parent_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{group.fiscal_year}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{group.member_count} empreses</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(group.created_at).toLocaleDateString('ca-ES')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => loadGroup(group)}
                                    >
                                      <FolderOpen className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Carregar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => deleteGroup(group.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Eliminar</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowPdfDialog(true)}
                    >
                      <FileUp className="w-4 h-4 mr-2" />
                      Importar PDF Consolidat
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('config')}
                      disabled={selectedCompanies.length < 2}
                    >
                      Configurar Consolidació
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
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
                      <TableHead>Estat</TableHead>
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
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                            <Link2 className="w-3 h-3 mr-1" />
                            Consolidada
                          </Badge>
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
                            className="w-[100px]"
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
                              <SelectItem value="global">Integració Global</SelectItem>
                              <SelectItem value="proporcional">Integració Proporcional</SelectItem>
                              <SelectItem value="equivalencia">Posada en Equivalència</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCompany(company.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Save Group Form */}
              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar Grup de Consolidació
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom del Grup *</Label>
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Ex: Grup Empresarial ABC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={groupNotes}
                      onChange={(e) => setGroupNotes(e.target.value)}
                      placeholder="Notes opcionals sobre la consolidació..."
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setActiveTab('selection')}>
                  Enrere
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={saveConsolidationGroup}
                    disabled={savingGroup || !groupName.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {savingGroup ? 'Guardant...' : 'Guardar Grup'}
                  </Button>
                  <Button onClick={consolidateBalances} disabled={loading}>
                    {loading ? 'Consolidant...' : 'Consolidar'}
                    <Calculator className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="result" className="space-y-4">
          {consolidatedData && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Balanç Consolidat - Exercici {selectedYear}
                      </CardTitle>
                      <CardDescription>
                        {selectedCompanies.length} empreses | Societat Matriu: {selectedCompanies.find(c => c.is_parent)?.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={distributeToMembers}>
                        <Link2 className="w-4 h-4 mr-2" />
                        Distribuir a Empreses
                      </Button>
                      <Button variant="outline" onClick={exportToExcel}>
                        <Download className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button variant="outline" onClick={printConsolidated}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Card className="border-blue-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Actiu</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(consolidatedData.total_assets)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Patrimoni Net</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(consolidatedData.total_equity)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/30">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Passiu</p>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(consolidatedData.total_liabilities)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Assets */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4 pb-2 border-b">ACTIU</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between font-medium bg-muted/50 p-2 rounded">
                          <span>A) Actiu No Corrent</span>
                          <span>{formatCurrency(consolidatedData.non_current_assets)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Immobilitzat intangible</span>
                          <span>{formatCurrency(consolidatedData.details.intangible_assets)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Fons de comerç</span>
                          <span>{formatCurrency(consolidatedData.details.goodwill)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Immobilitzat material</span>
                          <span>{formatCurrency(consolidatedData.details.tangible_assets)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Inversions immobiliàries</span>
                          <span>{formatCurrency(consolidatedData.details.real_estate_investments)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Inversions financeres</span>
                          <span>{formatCurrency(consolidatedData.details.long_term_financial_investments)}</span>
                        </div>
                        
                        <div className="flex justify-between font-medium bg-muted/50 p-2 rounded mt-4">
                          <span>B) Actiu Corrent</span>
                          <span>{formatCurrency(consolidatedData.current_assets)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Existències</span>
                          <span>{formatCurrency(consolidatedData.details.inventory)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Deutors comercials</span>
                          <span>{formatCurrency(consolidatedData.details.trade_receivables)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Efectiu i equivalents</span>
                          <span>{formatCurrency(consolidatedData.details.cash_equivalents)}</span>
                        </div>
                        
                        <div className="flex justify-between font-bold bg-primary/10 p-2 rounded mt-4">
                          <span>TOTAL ACTIU</span>
                          <span>{formatCurrency(consolidatedData.total_assets)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Equity & Liabilities */}
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-4 pb-2 border-b">PATRIMONI NET I PASSIU</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between font-medium bg-muted/50 p-2 rounded">
                          <span>A) Patrimoni Net</span>
                          <span>{formatCurrency(consolidatedData.total_equity)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Fons propis matriu</span>
                          <span>{formatCurrency(consolidatedData.equity_parent)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Socis externs</span>
                          <span>{formatCurrency(consolidatedData.minority_interests)}</span>
                        </div>
                        
                        <div className="flex justify-between font-medium bg-muted/50 p-2 rounded mt-4">
                          <span>B) Passiu No Corrent</span>
                          <span>{formatCurrency(consolidatedData.non_current_liabilities)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Deutes a llarg termini</span>
                          <span>{formatCurrency(consolidatedData.details.long_term_debts)}</span>
                        </div>
                        
                        <div className="flex justify-between font-medium bg-muted/50 p-2 rounded mt-4">
                          <span>C) Passiu Corrent</span>
                          <span>{formatCurrency(consolidatedData.current_liabilities)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Deutes a curt termini</span>
                          <span>{formatCurrency(consolidatedData.details.short_term_debts)}</span>
                        </div>
                        <div className="flex justify-between text-sm pl-4">
                          <span>Creditors comercials</span>
                          <span>{formatCurrency(consolidatedData.details.trade_payables)}</span>
                        </div>
                        
                        <div className="flex justify-between font-bold bg-primary/10 p-2 rounded mt-4">
                          <span>TOTAL PN + PASSIU</span>
                          <span>{formatCurrency(consolidatedData.total_equity + consolidatedData.total_liabilities)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Companies */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Perímetre de Consolidació
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>BP</TableHead>
                        <TableHead>NRT</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>% Participació</TableHead>
                        <TableHead>Mètode</TableHead>
                        <TableHead>Estat</TableHead>
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
                          <TableCell>{company.participation_percentage}%</TableCell>
                          <TableCell>
                            {company.consolidation_method === 'global' ? 'Integració global' :
                             company.consolidation_method === 'proporcional' ? 'Integració proporcional' :
                             'Posada en equivalència'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                              <Link2 className="w-3 h-3 mr-1" />
                              Consolidada
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* PDF Import Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Balanç Consolidat des de PDF</DialogTitle>
            <DialogDescription>
              Puja un PDF amb el balanç consolidat per extreure les dades automàticament
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                className="hidden"
                id="pdf-upload"
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {pdfFile ? pdfFile.name : 'Clica per seleccionar un PDF'}
                </p>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPdfDialog(false)}>
              Cancel·lar
            </Button>
            <Button onClick={handlePdfUpload} disabled={!pdfFile || parsingPdf}>
              {parsingPdf ? 'Processant...' : 'Importar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsolidatedStatementsManager;
