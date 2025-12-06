import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUp, Plus, CheckCircle, Clock, FileText, Wallet, RefreshCcw, Archive, Building2, CreditCard, Pyramid, TrendingUp, Target, ClipboardCheck, FileBarChart, CalendarClock, Trash2, Printer, Unlock, AlertTriangle, Layers, TableProperties, Home, ArrowLeft } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import BalanceSheetForm from './BalanceSheetForm';
import IncomeStatementForm from './IncomeStatementForm';
import CashFlowForm from './CashFlowForm';
import EquityChangesForm from './EquityChangesForm';
import FinancialNotesManager from './FinancialNotesManager';
import FinancialStatementsHistory from './FinancialStatementsHistory';
import PDFImportDialog from './PDFImportDialog';
import CompanySearchBar from './CompanySearchBar';
import MultiYearComparison from './MultiYearComparison';
import RatiosPyramid from './RatiosPyramid';
import { FinancialAnalysisTab } from './FinancialAnalysisTab';
import { ProfitabilityTab } from './ProfitabilityTab';
import { ValuationTab } from './ValuationTab';
import { AuditTab } from './AuditTab';
import { ReportsTab } from './ReportsTab';
import { ProvisionalStatementsManager } from './ProvisionalStatementsManager';
import AccountingCompanyIndex from './AccountingCompanyIndex';
import PeriodYearSelector from './PeriodYearSelector';
import EnhancedCompanyHeader from './EnhancedCompanyHeader';
import ConsolidatedStatementsManager from './ConsolidatedStatementsManager';
import AccountingGroupsChart from './AccountingGroupsChart';
import { AccountingMainMenu } from './AccountingMainMenu';
import LiquidityDebtRatios from './LiquidityDebtRatios';
import SectoralRatiosAnalysis from './SectoralRatiosAnalysis';
import SectorSimulator from './SectorSimulator';
import DuPontPyramid from './DuPontPyramid';
import { BankRatingAnalysis } from './BankRatingAnalysis';
import EBITEBITDAAnalysis from './EBITEBITDAAnalysis';
import { ZScoreAnalysis } from './ZScoreAnalysis';
import IncomeStatementChart from './IncomeStatementChart';

interface Company {
  id: string;
  name: string;
  bp: string | null;
  tax_id: string | null;
}

interface FinancialStatement {
  id: string;
  company_id: string;
  fiscal_year: number;
  statement_type: 'normal' | 'abreujat' | 'simplificat';
  status: 'draft' | 'submitted' | 'approved';
  source: 'manual' | 'pdf_import';
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

const AccountingManager = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentStatement, setCurrentStatement] = useState<FinancialStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison');
  const [showPDFImport, setShowPDFImport] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const [statementType, setStatementType] = useState<'normal' | 'abreujat' | 'simplificat'>('abreujat');
  const [bp, setBp] = useState('');
  const [showCompanyIndex, setShowCompanyIndex] = useState(viewParam !== 'menu');
  const [showMainMenu, setShowMainMenu] = useState(viewParam === 'menu');
  const [currentMenuSection, setCurrentMenuSection] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
  // Handle view param changes
  useEffect(() => {
    if (viewParam === 'menu') {
      setShowMainMenu(true);
      setShowCompanyIndex(false);
    }
  }, [viewParam]);

  useEffect(() => {
    if (selectedCompany?.id && selectedYear) {
      fetchFinancialStatement();
    }
  }, [selectedCompany?.id, selectedYear]);

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setBp(company.bp || '');
    setShowCompanyIndex(false);
  };
  
  const handleSelectFromIndex = (companyId: string) => {
    // Fetch company details and select
    supabase
      .from('companies')
      .select('id, name, bp, tax_id')
      .eq('id', companyId)
      .single()
      .then(({ data }) => {
        if (data) {
          handleSelectCompany(data);
        }
      });
  };
  
  const handleBackToIndex = () => {
    setSelectedCompany(null);
    setCurrentStatement(null);
    setShowCompanyIndex(true);
    setShowMainMenu(false);
    setCurrentMenuSection(null);
  };

  const handleBackToMainMenu = () => {
    setShowMainMenu(true);
    setShowCompanyIndex(false);
    setSelectedCompany(null);
    setCurrentMenuSection(null);
  };

  const handleMenuNavigate = (section: string) => {
    setCurrentMenuSection(section);
    
    // Sections that don't require company selection - render directly
    const directAccessSections = [
      'inicio', 'empresas', 'consolidacion', 'bateria-informes',
      'estudio-sectorial', 'estudio-financiero', 'comentarios-gestion'
    ];
    
    if (section === 'inicio') {
      handleBackToMainMenu();
      return;
    }
    
    if (section === 'empresas') {
      setShowCompanyIndex(true);
      setShowMainMenu(false);
      return;
    }
    
    if (section === 'consolidacion') {
      setShowCompanyIndex(false);
      setShowMainMenu(false);
      setActiveTab('consolidated');
      return;
    }
    
    // For all other sections, show the content directly (with company selection if needed)
    setShowMainMenu(false);
    setShowCompanyIndex(false);
  };

  const fetchFinancialStatement = async () => {
    if (!selectedCompany?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_financial_statements')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .eq('fiscal_year', selectedYear)
        .eq('is_archived', false)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setCurrentStatement({
          ...data,
          statement_type: data.statement_type as 'normal' | 'abreujat' | 'simplificat',
          status: data.status as 'draft' | 'submitted' | 'approved',
          source: data.source as 'manual' | 'pdf_import'
        });
        setStatementType(data.statement_type as 'normal' | 'abreujat' | 'simplificat');
      } else {
        setCurrentStatement(null);
      }
    } catch (error) {
      console.error('Error fetching statement:', error);
      toast.error('Error carregant estat financer');
    } finally {
      setLoading(false);
    }
  };

  const createNewStatement = async () => {
    if (!selectedCompany?.id || !user) return;
    
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('company_financial_statements')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .eq('fiscal_year', selectedYear)
        .maybeSingle();

      if (existing) {
        toast.error('Ja existeix un estat financer per aquest any');
        return;
      }

      // Update company BP if provided
      if (bp && bp !== selectedCompany.bp) {
        await supabase
          .from('companies')
          .update({ bp })
          .eq('id', selectedCompany.id);
      }

      const { data, error } = await supabase
        .from('company_financial_statements')
        .insert({
          company_id: selectedCompany.id,
          fiscal_year: selectedYear,
          statement_type: statementType,
          status: 'draft',
          source: 'manual',
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;

      await Promise.all([
        supabase.from('balance_sheets').insert({ statement_id: data.id }),
        supabase.from('income_statements').insert({ statement_id: data.id }),
        supabase.from('cash_flow_statements').insert({ statement_id: data.id }),
        supabase.from('equity_changes_statements').insert({ statement_id: data.id })
      ]);

      toast.success('Estat financer creat correctament');
      setShowNewYearDialog(false);
      fetchFinancialStatement();
    } catch (error) {
      console.error('Error creating statement:', error);
      toast.error('Error creant estat financer');
    } finally {
      setSaving(false);
    }
  };

  const updateStatementStatus = async (newStatus: 'draft' | 'submitted' | 'approved') => {
    if (!currentStatement || !user) return;

    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'approved') {
        updateData.approved_by = user.id;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('company_financial_statements')
        .update(updateData)
        .eq('id', currentStatement.id);
      
      if (error) throw error;

      toast.success(`Estat actualitzat a ${newStatus}`);
      fetchFinancialStatement();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error actualitzant estat');
    } finally {
      setSaving(false);
    }
  };

  const deleteStatement = async () => {
    if (!currentStatement) return;

    setSaving(true);
    try {
      // Delete related records first
      await Promise.all([
        supabase.from('balance_sheets').delete().eq('statement_id', currentStatement.id),
        supabase.from('income_statements').delete().eq('statement_id', currentStatement.id),
        supabase.from('cash_flow_statements').delete().eq('statement_id', currentStatement.id),
        supabase.from('equity_changes_statements').delete().eq('statement_id', currentStatement.id),
        supabase.from('financial_notes').delete().eq('statement_id', currentStatement.id)
      ]);

      // Then delete the main statement
      const { error } = await supabase
        .from('company_financial_statements')
        .delete()
        .eq('id', currentStatement.id);
      
      if (error) throw error;

      toast.success('Estat financer eliminat correctament');
      setCurrentStatement(null);
      fetchFinancialStatement();
    } catch (error) {
      console.error('Error deleting statement:', error);
      toast.error('Error eliminant estat financer');
    } finally {
      setSaving(false);
    }
  };

  const unlockStatement = async () => {
    if (!currentStatement) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('company_financial_statements')
        .update({ status: 'draft', approved_by: null, approved_at: null })
        .eq('id', currentStatement.id);
      
      if (error) throw error;

      toast.success('Estat desbloquejat per edició');
      fetchFinancialStatement();
    } catch (error) {
      console.error('Error unlocking statement:', error);
      toast.error('Error desbloquejant estat');
    } finally {
      setSaving(false);
    }
  };

  const printStatement = async () => {
    if (!currentStatement || !selectedCompany) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("No s'ha pogut obrir la finestra d'impressió");
      return;
    }

    try {
      const [balanceResult, incomeResult] = await Promise.all([
        supabase.from('balance_sheets').select('*').eq('statement_id', currentStatement.id).single(),
        supabase.from('income_statements').select('*').eq('statement_id', currentStatement.id).single()
      ]);

      const balance = balanceResult.data;
      const income = incomeResult.data;

      const formatCurrency = (value: number | null) => 
        new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value || 0);

      const totalNonCurrentAssets = (balance?.intangible_assets || 0) + (balance?.goodwill || 0) + 
        (balance?.tangible_assets || 0) + (balance?.real_estate_investments || 0) +
        (balance?.long_term_group_investments || 0) + (balance?.long_term_financial_investments || 0) +
        (balance?.deferred_tax_assets || 0) + (balance?.long_term_trade_receivables || 0);

      const totalCurrentAssets = (balance?.non_current_assets_held_for_sale || 0) + (balance?.inventory || 0) +
        (balance?.trade_receivables || 0) + (balance?.short_term_group_receivables || 0) +
        (balance?.short_term_financial_investments || 0) + (balance?.accruals_assets || 0) +
        (balance?.cash_equivalents || 0);

      const totalAssets = totalNonCurrentAssets + totalCurrentAssets;

      const totalEquity = (balance?.share_capital || 0) + (balance?.share_premium || 0) +
        (balance?.revaluation_reserve || 0) + (balance?.legal_reserve || 0) +
        (balance?.statutory_reserves || 0) + (balance?.voluntary_reserves || 0) -
        (balance?.treasury_shares || 0) + (balance?.retained_earnings || 0) +
        (balance?.current_year_result || 0) - (balance?.interim_dividend || 0) +
        (balance?.other_equity_instruments || 0) + (balance?.capital_grants || 0);

      const totalNonCurrentLiabilities = (balance?.long_term_provisions || 0) +
        (balance?.long_term_debts || 0) + (balance?.long_term_group_debts || 0) +
        (balance?.deferred_tax_liabilities || 0) + (balance?.long_term_accruals || 0);

      const totalCurrentLiabilities = (balance?.liabilities_held_for_sale || 0) +
        (balance?.short_term_provisions || 0) + (balance?.short_term_debts || 0) +
        (balance?.short_term_group_debts || 0) + (balance?.trade_payables || 0) +
        (balance?.other_creditors || 0) + (balance?.short_term_accruals || 0);

      const totalEquityAndLiabilities = totalEquity + totalNonCurrentLiabilities + totalCurrentLiabilities;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Estats Financers - ${selectedCompany.name} - ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; padding: 20px; }
            h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
            h2 { font-size: 14px; color: #333; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 20px; }
            h3 { font-size: 12px; color: #666; margin: 10px 0 5px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            .company-info { font-size: 10px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid #eee; }
            th { background: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; }
            .total { font-weight: bold; background: #f0f0f0; }
            .subtotal { font-weight: bold; font-style: italic; }
            .section { page-break-inside: avoid; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ESTATS FINANCERS</h1>
            <p style="font-size: 16px; font-weight: bold;">${selectedCompany.name}</p>
            <p class="company-info">
              ${selectedCompany.bp ? 'BP: ' + selectedCompany.bp + ' | ' : ''}
              ${selectedCompany.tax_id ? 'NRT: ' + selectedCompany.tax_id + ' | ' : ''}
              Exercici: ${selectedYear} | Model: ${currentStatement.statement_type}
            </p>
          </div>
          <div class="section">
            <h2>BALANÇ DE SITUACIÓ</h2>
            <h3>ACTIU</h3>
            <table>
              <tr class="subtotal"><td>Actiu No Corrent</td><td class="amount">${formatCurrency(totalNonCurrentAssets)}</td></tr>
              <tr><td style="padding-left:20px">Immobilitzat intangible</td><td class="amount">${formatCurrency(balance?.intangible_assets || 0)}</td></tr>
              <tr><td style="padding-left:20px">Immobilitzat material</td><td class="amount">${formatCurrency(balance?.tangible_assets || 0)}</td></tr>
              <tr><td style="padding-left:20px">Inversions financeres llarg termini</td><td class="amount">${formatCurrency(balance?.long_term_financial_investments || 0)}</td></tr>
              <tr class="subtotal"><td>Actiu Corrent</td><td class="amount">${formatCurrency(totalCurrentAssets)}</td></tr>
              <tr><td style="padding-left:20px">Existències</td><td class="amount">${formatCurrency(balance?.inventory || 0)}</td></tr>
              <tr><td style="padding-left:20px">Deutors comercials</td><td class="amount">${formatCurrency(balance?.trade_receivables || 0)}</td></tr>
              <tr><td style="padding-left:20px">Efectiu i equivalents</td><td class="amount">${formatCurrency(balance?.cash_equivalents || 0)}</td></tr>
              <tr class="total"><td>TOTAL ACTIU</td><td class="amount">${formatCurrency(totalAssets)}</td></tr>
            </table>
            <h3>PATRIMONI NET I PASSIU</h3>
            <table>
              <tr class="subtotal"><td>Patrimoni Net</td><td class="amount">${formatCurrency(totalEquity)}</td></tr>
              <tr><td style="padding-left:20px">Capital social</td><td class="amount">${formatCurrency(balance?.share_capital || 0)}</td></tr>
              <tr><td style="padding-left:20px">Reserves</td><td class="amount">${formatCurrency((balance?.legal_reserve || 0) + (balance?.statutory_reserves || 0) + (balance?.voluntary_reserves || 0))}</td></tr>
              <tr><td style="padding-left:20px">Resultat de l'exercici</td><td class="amount">${formatCurrency(balance?.current_year_result || 0)}</td></tr>
              <tr class="subtotal"><td>Passiu No Corrent</td><td class="amount">${formatCurrency(totalNonCurrentLiabilities)}</td></tr>
              <tr><td style="padding-left:20px">Deutes llarg termini</td><td class="amount">${formatCurrency(balance?.long_term_debts || 0)}</td></tr>
              <tr class="subtotal"><td>Passiu Corrent</td><td class="amount">${formatCurrency(totalCurrentLiabilities)}</td></tr>
              <tr><td style="padding-left:20px">Creditors comercials</td><td class="amount">${formatCurrency(balance?.trade_payables || 0)}</td></tr>
              <tr class="total"><td>TOTAL PATRIMONI NET I PASSIU</td><td class="amount">${formatCurrency(totalEquityAndLiabilities)}</td></tr>
            </table>
          </div>
          <div class="section" style="page-break-before: always;">
            <h2>COMPTE DE PÈRDUES I GUANYS</h2>
            <table>
              <tr><td>Import net de la xifra de negocis</td><td class="amount">${formatCurrency(income?.net_turnover || 0)}</td></tr>
              <tr><td>Aprovisionaments</td><td class="amount">${formatCurrency(income?.supplies || 0)}</td></tr>
              <tr><td>Despeses de personal</td><td class="amount">${formatCurrency(income?.personnel_expenses || 0)}</td></tr>
              <tr><td>Altres despeses d'explotació</td><td class="amount">${formatCurrency(income?.other_operating_expenses || 0)}</td></tr>
              <tr><td>Amortització de l'immobilitzat</td><td class="amount">${formatCurrency(income?.depreciation || 0)}</td></tr>
              <tr><td>Ingressos financers</td><td class="amount">${formatCurrency(income?.financial_income || 0)}</td></tr>
              <tr><td>Despeses financeres</td><td class="amount">${formatCurrency(income?.financial_expenses || 0)}</td></tr>
              <tr><td>Impost sobre beneficis</td><td class="amount">${formatCurrency(income?.corporate_tax || 0)}</td></tr>
              <tr class="total"><td>RESULTAT DE L'EXERCICI</td><td class="amount">${formatCurrency(balance?.current_year_result || 0)}</td></tr>
            </table>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">Imprimir</button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Error preparing print:', error);
      toast.error('Error preparant impressió');
      printWindow.close();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" /> Esborrany</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><FileText className="w-3 h-3 mr-1" /> Enviat</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Aprovat</Badge>;
      default:
        return null;
    }
  };

  const getStatementTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      normal: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
      abreujat: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
      simplificat: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30'
    };
    return <Badge variant="outline" className={colors[type] || ''}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  // Render content based on currentMenuSection
  const renderSectionContent = () => {
    const companyId = selectedCompany?.id || '';
    const companyName = selectedCompany?.name || '';
    
    // Helper to show company selection prompt if no company selected
    const needsCompanySelection = !selectedCompany;
    
    const CompanySelectionPrompt = () => (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleBackToMainMenu}>
              <Home className="w-4 h-4 mr-2" />
              Menú Principal
            </Button>
          </div>
          <div className="text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona una Empresa</h3>
            <p className="text-muted-foreground mb-4">
              Aquesta secció requereix seleccionar una empresa.
            </p>
            <CompanySearchBar 
              onSelectCompany={handleSelectCompany}
              selectedCompanyId=""
            />
          </div>
        </CardContent>
      </Card>
    );

    const SectionWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBackToMainMenu}>
            <Home className="w-4 h-4 mr-2" />
            Menú Principal
          </Button>
          <span className="text-lg font-semibold">{title}</span>
        </div>
        {children}
      </div>
    );

    switch (currentMenuSection) {
      // RATIOS sections
      case 'ratios-liquidez':
      case 'ratios-endeudamiento':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Ratios de Liquidez y Endeudamiento">
            <LiquidityDebtRatios companyId={companyId} companyName={companyName} onNavigate={handleMenuNavigate} />
          </SectionWrapper>
        );
      
      case 'ratios-sectoriales':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Ratios Sectoriales">
            <SectoralRatiosAnalysis companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );
      
      case 'simulador-sectorial':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Simulador Sectorial">
            <SectorSimulator companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );
      
      case 'piramide-ratios':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Pirámide de Ratios Financieros">
            <RatiosPyramid companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );
      
      case 'piramide-dupont':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Pirámide DuPont">
            <DuPontPyramid companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );
      
      case 'analisis-bancario':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Análisis Bancario">
            <BankRatingAnalysis companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // FINANCIERA sections - use FinancialAnalysisTab which handles data loading
      case 'masas-patrimoniales':
      case 'cuadro-analitico':
      case 'resumen-analitico':
      case 'flujo-caja':
      case 'valor-anadido':
      case 'cuadro-financiacion':
      case 'ebit-ebitda':
      case 'capital-circulante':
      case 'situacion-largo-plazo':
      case 'flujos-tesoreria':
      case 'nof':
      case 'cuadro-mando':
      case 'indice-z':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Análisis Financiero">
            <FinancialAnalysisTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // BALANCES sections
      case 'balance-situacion':
      case 'activo-disponible':
      case 'activo-no-corriente':
      case 'activo-funcional':
      case 'exigible':
      case 'fondos-propios':
      case 'resultados-explotacion':
      case 'resultados-financieros':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Balance de Situación">
            <AccountingGroupsChart companyId={companyId} />
          </SectionWrapper>
        );
      
      case 'estado-perdidas-ganancias':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Estado de Pérdidas y Ganancias">
            <IncomeStatementChart companyId={companyId} />
          </SectionWrapper>
        );

      // RENTABILIDAD sections
      case 'rentabilidad-economica':
      case 'umbral-rentabilidad':
      case 'apalancamiento':
      case 'fondo-maniobra':
      case 'autofinanciacion':
      case 'periodos-maduracion':
      case 'capacidad-crecimiento':
      case 'nivel-endeudamiento':
      case 'estados-financieros':
      case 'resumen-financiero':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Rentabilidad">
            <ProfitabilityTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // VALORACIONES sections
      case 'activo-neto':
      case 'valor-substancial':
      case 'multiplos':
      case 'flujos-descontados':
      case 'proyecciones':
      case 'proyecto-inversion':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Valoraciones">
            <ValuationTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // AUDITORIA sections
      case 'desv-balance':
      case 'desv-resultados':
      case 'audit-fondo-maniobra':
      case 'audit-acid-test':
      case 'audit-disponibilidad':
      case 'audit-cobro':
      case 'audit-pago':
      case 'audit-rotacion':
      case 'audit-apalancamiento':
      case 'audit-fondos-propios':
      case 'audit-endeudamiento':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Auditoría">
            <AuditTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // CUENTAS ANUALES sections
      case 'ca-balance':
      case 'ca-perdidas-ganancias':
      case 'ca-flujos-efectivo':
      case 'ca-cambios-patrimonio':
      case 'ca-gastos-ingresos':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Cuentas Anuales">
            <ReportsTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // INFORMES
      case 'bateria-informes':
        if (needsCompanySelection) return <CompanySelectionPrompt />;
        return (
          <SectionWrapper title="Batería de Informes">
            <ReportsTab companyId={companyId} companyName={companyName} />
          </SectionWrapper>
        );

      // CONSOLIDACION
      case 'consolidacion':
        return (
          <SectionWrapper title="Consolidación de Empresas">
            <ConsolidatedStatementsManager />
          </SectionWrapper>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header principal con título centrado */}
      {showMainMenu && (
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl p-4 border border-border/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent rounded-xl" />
          <div className="relative text-center">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Organigrama Comptable Corporate / Empreses
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona una opció per accedir a les funcionalitats del sistema
            </p>
          </div>
        </div>
      )}

      {/* Main Menu View */}
      {showMainMenu ? (
        <AccountingMainMenu 
          onNavigate={handleMenuNavigate}
          currentSection={currentMenuSection || undefined}
        />
      ) : currentMenuSection && !showCompanyIndex ? (
        // Render section-specific content
        renderSectionContent()
      ) : showCompanyIndex && !selectedCompany ? (
        <>
          {/* Button to go back to main menu */}
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleBackToMainMenu}>
              <Home className="w-4 h-4 mr-2" />
              Menú Principal
            </Button>
          </div>
          <AccountingCompanyIndex onSelectCompany={handleSelectFromIndex} />
        </>
      ) : (
        <>
          {/* Search Bar and Company Header */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Comptabilitat - Estats Financers
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleBackToMainMenu}>
                      <Home className="w-4 h-4 mr-2" />
                      Menú Principal
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleBackToIndex}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Índex Empreses
                    </Button>
                  </div>
                </div>
                
                {/* Company Search */}
                <CompanySearchBar 
                  onSelectCompany={handleSelectCompany}
                  selectedCompanyId={selectedCompany?.id || ''}
                />
              </div>
            </CardHeader>

            {selectedCompany && (
              <CardContent>
                {/* Enhanced Company Header with CNAE */}
                <EnhancedCompanyHeader companyId={selectedCompany.id} />
                
                {/* Period Year Selector */}
                <PeriodYearSelector 
                  companyId={selectedCompany.id}
                  selectedYear={selectedYear}
                  onSelectYear={setSelectedYear}
                />

            {/* Year Selection and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Any:</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {currentStatement && (
                  <>
                    {getStatusBadge(currentStatement.status)}
                    {getStatementTypeBadge(currentStatement.statement_type)}
                    {currentStatement.source === 'pdf_import' && (
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                        <FileUp className="w-3 h-3 mr-1" /> Importat PDF
                      </Badge>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {!currentStatement && (
                  <Dialog open={showNewYearDialog} onOpenChange={setShowNewYearDialog} modal={false}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Any {selectedYear}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                      <DialogHeader>
                        <DialogTitle>Crear Estat Financer {selectedYear}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>BP (Número de Compte)</Label>
                          <Input 
                            value={bp}
                            onChange={(e) => setBp(e.target.value)}
                            placeholder="Introdueix el BP..."
                            maxLength={34}
                          />
                          <p className="text-xs text-muted-foreground">
                            El BP s'utilitzarà com a referència per als balanços d'aquesta empresa
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Tipus de Model</Label>
                          <select 
                            value={statementType} 
                            onChange={(e) => setStatementType(e.target.value as 'normal' | 'abreujat' | 'simplificat')}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          >
                            <option value="normal">Normal (Complet)</option>
                            <option value="abreujat">Abreujat</option>
                            <option value="simplificat">Simplificat</option>
                          </select>
                          <p className="text-sm text-muted-foreground">
                            El model determina el nivell de detall dels estats financers segons el PGC Andorrà.
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowNewYearDialog(false)}>Cancel·lar</Button>
                          <Button onClick={createNewStatement} disabled={saving}>
                            {saving ? 'Creant...' : 'Crear'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {currentStatement && (
                  <>
                    <Button variant="outline" size="sm" onClick={printStatement}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowPDFImport(true)}>
                      <FileUp className="w-4 h-4 mr-2" />
                      Importar PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchFinancialStatement}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Actualitzar
                    </Button>
                    {currentStatement.status === 'approved' && (isAdmin || isSuperAdmin) && (
                      <Button variant="outline" size="sm" onClick={unlockStatement}>
                        <Unlock className="w-4 h-4 mr-2" />
                        Desbloquejar
                      </Button>
                    )}
                    {currentStatement.status === 'draft' && (
                      <Button size="sm" onClick={() => updateStatementStatus('submitted')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    )}
                    {currentStatement.status === 'submitted' && (isAdmin || isSuperAdmin) && (
                      <Button size="sm" onClick={() => updateStatementStatus('approved')} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            Eliminar Estat Financer
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Estàs segur que vols eliminar l'estat financer de l'any {selectedYear}? 
                            Aquesta acció no es pot desfer i s'eliminaran totes les dades associades 
                            (balanç, compte de resultats, estat de fluxos, canvis de patrimoni i notes).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel·lar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteStatement} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {!selectedCompany ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona una Empresa</h3>
            <p className="text-muted-foreground">
              Utilitza el cercador per trobar una empresa per nom, BP o NRT i veure els seus estats financers.
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregant dades financeres...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 mb-4">
            <TabsTrigger value="comparison" className="text-xs px-2 py-1.5">Comparativa</TabsTrigger>
            <TabsTrigger value="balance" disabled={!currentStatement} className="text-xs px-2 py-1.5">Balanç</TabsTrigger>
            <TabsTrigger value="income" disabled={!currentStatement} className="text-xs px-2 py-1.5">P&G</TabsTrigger>
            <TabsTrigger value="equity" disabled={!currentStatement} className="text-xs px-2 py-1.5">Canvis PN</TabsTrigger>
            <TabsTrigger value="notes" disabled={!currentStatement} className="text-xs px-2 py-1.5">Memòria</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs px-2 py-1.5">
              <TrendingUp className="w-3 h-3 mr-1" />
              Anàlisi
            </TabsTrigger>
            <TabsTrigger value="ratios" className="text-xs px-2 py-1.5">
              <Pyramid className="w-3 h-3 mr-1" />
              Ràtios
            </TabsTrigger>
            <TabsTrigger value="profitability" className="text-xs px-2 py-1.5">
              <Target className="w-3 h-3 mr-1" />
              Rendibilitat
            </TabsTrigger>
            <TabsTrigger value="valuation" className="text-xs px-2 py-1.5">Valoració</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs px-2 py-1.5">
              <ClipboardCheck className="w-3 h-3 mr-1" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs px-2 py-1.5">
              <FileBarChart className="w-3 h-3 mr-1" />
              Informes
            </TabsTrigger>
            <TabsTrigger value="provisional" className="text-xs px-2 py-1.5">
              <CalendarClock className="w-3 h-3 mr-1" />
              Previsional
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="text-xs px-2 py-1.5">
              <Layers className="w-3 h-3 mr-1" />
              Consolidació
            </TabsTrigger>
            <TabsTrigger value="pgc" className="text-xs px-2 py-1.5">
              <TableProperties className="w-3 h-3 mr-1" />
              Quadre PGC
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs px-2 py-1.5">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison">
            <MultiYearComparison 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="balance">
            {currentStatement && (
              <BalanceSheetForm 
                statementId={currentStatement.id} 
                isLocked={currentStatement.status === 'approved'}
                fiscalYear={selectedYear}
              />
            )}
          </TabsContent>
          
          <TabsContent value="income">
            {currentStatement && (
              <IncomeStatementForm 
                statementId={currentStatement.id} 
                isLocked={currentStatement.status === 'approved'}
                fiscalYear={selectedYear}
              />
            )}
          </TabsContent>
          
          <TabsContent value="equity">
            {currentStatement && (
              <EquityChangesForm 
                statementId={currentStatement.id} 
                isLocked={currentStatement.status === 'approved'}
                fiscalYear={selectedYear}
              />
            )}
          </TabsContent>
          
          <TabsContent value="notes">
            {currentStatement && (
              <FinancialNotesManager 
                statementId={currentStatement.id} 
                isLocked={currentStatement.status === 'approved'}
              />
            )}
          </TabsContent>

          <TabsContent value="analysis">
            <FinancialAnalysisTab 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>
          
          <TabsContent value="ratios">
            <RatiosPyramid 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="profitability">
            <ProfitabilityTab 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="valuation">
            <ValuationTab 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="audit">
            <AuditTab 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>
          
          <TabsContent value="provisional">
            <ProvisionalStatementsManager 
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </TabsContent>

          <TabsContent value="pgc">
            <AccountingGroupsChart companyId={selectedCompany.id} />
          </TabsContent>

          <TabsContent value="history">
            <FinancialStatementsHistory 
              companyId={selectedCompany.id}
              currentYear={selectedYear}
            />
          </TabsContent>
        </Tabs>
      )}

      {currentStatement && (
        <PDFImportDialog
          open={showPDFImport}
          onOpenChange={setShowPDFImport}
          statementId={currentStatement.id}
          companyName={selectedCompany?.name || ''}
          fiscalYear={selectedYear}
          onImportComplete={fetchFinancialStatement}
        />
      )}
        </>
      )}
    </div>
  );
};

export default AccountingManager;
