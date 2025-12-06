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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUp, Plus, CheckCircle, Clock, FileText, Wallet, RefreshCcw, Archive } from 'lucide-react';
import BalanceSheetForm from './BalanceSheetForm';
import IncomeStatementForm from './IncomeStatementForm';
import CashFlowForm from './CashFlowForm';
import EquityChangesForm from './EquityChangesForm';
import FinancialNotesManager from './FinancialNotesManager';
import FinancialStatementsHistory from './FinancialStatementsHistory';
import PDFImportDialog from './PDFImportDialog';

interface Company {
  id: string;
  name: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [currentStatement, setCurrentStatement] = useState<FinancialStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('balance');
  const [showPDFImport, setShowPDFImport] = useState(false);
  const [showNewYearDialog, setShowNewYearDialog] = useState(false);
  const [statementType, setStatementType] = useState<'normal' | 'abreujat' | 'simplificat'>('abreujat');

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && selectedYear) {
      fetchFinancialStatement();
    }
  }, [selectedCompanyId, selectedYear]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error carregant empreses');
    }
  };

  const fetchFinancialStatement = async () => {
    if (!selectedCompanyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_financial_statements')
        .select('*')
        .eq('company_id', selectedCompanyId)
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
    if (!selectedCompanyId || !user) return;
    
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('company_financial_statements')
        .select('id')
        .eq('company_id', selectedCompanyId)
        .eq('fiscal_year', selectedYear)
        .maybeSingle();

      if (existing) {
        toast.error('Ja existeix un estat financer per aquest any');
        return;
      }

      const { data, error } = await supabase
        .from('company_financial_statements')
        .insert({
          company_id: selectedCompanyId,
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

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6 text-primary" />
              Comptabilitat - Estats Financers
            </CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Empresa:</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecciona empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
              {!currentStatement && selectedCompanyId && (
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
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregant dades financeres...</p>
          </CardContent>
        </Card>
      ) : !currentStatement ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hi ha estats financers per {selectedYear}</h3>
            <p className="text-muted-foreground mb-4">
              Crea un nou estat financer per començar a introduir les dades comptables.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="balance">Balanç</TabsTrigger>
            <TabsTrigger value="income">P&G</TabsTrigger>
            <TabsTrigger value="equity">Canvis PN</TabsTrigger>
            {currentStatement.statement_type === 'normal' && (
              <TabsTrigger value="cashflow">Flux Efectiu</TabsTrigger>
            )}
            <TabsTrigger value="notes">Memòria</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="balance">
            <BalanceSheetForm 
              statementId={currentStatement.id} 
              isLocked={currentStatement.status === 'approved'}
              fiscalYear={selectedYear}
            />
          </TabsContent>
          
          <TabsContent value="income">
            <IncomeStatementForm 
              statementId={currentStatement.id} 
              isLocked={currentStatement.status === 'approved'}
              fiscalYear={selectedYear}
            />
          </TabsContent>
          
          <TabsContent value="equity">
            <EquityChangesForm 
              statementId={currentStatement.id} 
              isLocked={currentStatement.status === 'approved'}
              fiscalYear={selectedYear}
            />
          </TabsContent>
          
          {currentStatement.statement_type === 'normal' && (
            <TabsContent value="cashflow">
              <CashFlowForm 
                statementId={currentStatement.id} 
                isLocked={currentStatement.status === 'approved'}
                fiscalYear={selectedYear}
              />
            </TabsContent>
          )}
          
          <TabsContent value="notes">
            <FinancialNotesManager 
              statementId={currentStatement.id} 
              isLocked={currentStatement.status === 'approved'}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <FinancialStatementsHistory 
              companyId={selectedCompanyId}
              currentYear={selectedYear}
            />
          </TabsContent>
        </Tabs>
      )}

      <PDFImportDialog
        open={showPDFImport}
        onOpenChange={setShowPDFImport}
        statementId={currentStatement?.id || ''}
        companyName={selectedCompany?.name || ''}
        fiscalYear={selectedYear}
        onImportComplete={fetchFinancialStatement}
      />
    </div>
  );
};

export default AccountingManager;
