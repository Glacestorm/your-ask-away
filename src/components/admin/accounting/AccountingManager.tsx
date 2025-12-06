import { useState, useEffect } from 'react';
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
import { FileUp, Plus, CheckCircle, Clock, FileText, Wallet, RefreshCcw, Archive, Building2, CreditCard, Pyramid, TrendingUp, Target, ClipboardCheck, FileBarChart, CalendarClock } from 'lucide-react';
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
  const [showCompanyIndex, setShowCompanyIndex] = useState(true);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

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

  return (
    <div className="space-y-6">
      {/* Toggle between Index and Company Detail */}
      {showCompanyIndex && !selectedCompany ? (
        <AccountingCompanyIndex onSelectCompany={handleSelectFromIndex} />
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
                  <Button variant="ghost" size="sm" onClick={handleBackToIndex}>
                    <Building2 className="w-4 h-4 mr-2" />
                    Tornar a l'índex
                  </Button>
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
                    <Button variant="outline" onClick={() => setShowPDFImport(true)}>
                      <FileUp className="w-4 h-4 mr-2" />
                      Importar PDF
                    </Button>
                    <Button variant="outline" onClick={fetchFinancialStatement}>
                      <RefreshCcw className="w-4 h-4 mr-2" />
                      Actualitzar
                    </Button>
                    {currentStatement.status === 'draft' && (
                      <Button onClick={() => updateStatementStatus('submitted')}>
                        <FileText className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    )}
                    {currentStatement.status === 'submitted' && (isAdmin || isSuperAdmin) && (
                      <Button onClick={() => updateStatementStatus('approved')} className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                    )}
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
