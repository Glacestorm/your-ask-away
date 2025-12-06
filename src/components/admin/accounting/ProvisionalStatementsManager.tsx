import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Plus, FileUp, Calendar, TrendingUp, Save, Trash2, 
  CheckCircle, Clock, FileText, BarChart3 
} from "lucide-react";

interface ProvisionalStatementsManagerProps {
  companyId: string;
  companyName: string;
}

interface ProvisionalStatement {
  id: string;
  fiscal_year: number;
  period_type: 'quarterly' | 'semiannual' | 'annual';
  period_number: number;
  status: string;
  source: string;
  is_approved: boolean;
  created_at: string;
}

interface BalanceSheetData {
  intangible_assets: number;
  tangible_assets: number;
  real_estate_investments: number;
  long_term_financial_investments: number;
  deferred_tax_assets: number;
  inventory: number;
  trade_receivables: number;
  short_term_financial_investments: number;
  cash_equivalents: number;
  share_capital: number;
  share_premium: number;
  reserves: number;
  retained_earnings: number;
  current_year_result: number;
  long_term_provisions: number;
  long_term_debts: number;
  deferred_tax_liabilities: number;
  short_term_provisions: number;
  short_term_debts: number;
  trade_payables: number;
  other_creditors: number;
}

interface IncomeStatementData {
  net_turnover: number;
  inventory_variation: number;
  capitalized_work: number;
  supplies: number;
  other_operating_income: number;
  personnel_expenses: number;
  other_operating_expenses: number;
  depreciation: number;
  operating_grants: number;
  impairment_trade_operations: number;
  other_operating_results: number;
  financial_income: number;
  financial_expenses: number;
  exchange_differences: number;
  impairment_financial_instruments: number;
  other_financial_results: number;
  corporate_tax: number;
}

const currentYear = new Date().getFullYear();
const availableYears = [currentYear, currentYear - 1];

const periodLabels: Record<string, Record<number, string>> = {
  quarterly: { 1: 'T1', 2: 'T2', 3: 'T3', 4: 'T4' },
  semiannual: { 1: 'S1', 2: 'S2' },
  annual: { 1: 'Anual' }
};

const initialBalanceSheet: BalanceSheetData = {
  intangible_assets: 0,
  tangible_assets: 0,
  real_estate_investments: 0,
  long_term_financial_investments: 0,
  deferred_tax_assets: 0,
  inventory: 0,
  trade_receivables: 0,
  short_term_financial_investments: 0,
  cash_equivalents: 0,
  share_capital: 0,
  share_premium: 0,
  reserves: 0,
  retained_earnings: 0,
  current_year_result: 0,
  long_term_provisions: 0,
  long_term_debts: 0,
  deferred_tax_liabilities: 0,
  short_term_provisions: 0,
  short_term_debts: 0,
  trade_payables: 0,
  other_creditors: 0,
};

const initialIncomeStatement: IncomeStatementData = {
  net_turnover: 0,
  inventory_variation: 0,
  capitalized_work: 0,
  supplies: 0,
  other_operating_income: 0,
  personnel_expenses: 0,
  other_operating_expenses: 0,
  depreciation: 0,
  operating_grants: 0,
  impairment_trade_operations: 0,
  other_operating_results: 0,
  financial_income: 0,
  financial_expenses: 0,
  exchange_differences: 0,
  impairment_financial_instruments: 0,
  other_financial_results: 0,
  corporate_tax: 0,
};

export function ProvisionalStatementsManager({ companyId, companyName }: ProvisionalStatementsManagerProps) {
  const [statements, setStatements] = useState<ProvisionalStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<ProvisionalStatement | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData>(initialBalanceSheet);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData>(initialIncomeStatement);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [newStatementYear, setNewStatementYear] = useState(currentYear);
  const [newStatementPeriodType, setNewStatementPeriodType] = useState<'quarterly' | 'semiannual' | 'annual'>('quarterly');
  const [newStatementPeriodNumber, setNewStatementPeriodNumber] = useState(1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStatements();
  }, [companyId]);

  const fetchStatements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('provisional_financial_statements')
        .select('*')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false })
        .order('period_number', { ascending: true });

      if (error) throw error;
      setStatements(data || []);
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatementData = async (statement: ProvisionalStatement) => {
    setSelectedStatement(statement);
    
    try {
      const [balanceRes, incomeRes] = await Promise.all([
        supabase
          .from('provisional_balance_sheets')
          .select('*')
          .eq('provisional_statement_id', statement.id)
          .single(),
        supabase
          .from('provisional_income_statements')
          .select('*')
          .eq('provisional_statement_id', statement.id)
          .single()
      ]);

      if (balanceRes.data) {
        setBalanceSheet(balanceRes.data as BalanceSheetData);
      } else {
        setBalanceSheet(initialBalanceSheet);
      }

      if (incomeRes.data) {
        setIncomeStatement(incomeRes.data as IncomeStatementData);
      } else {
        setIncomeStatement(initialIncomeStatement);
      }
    } catch (error) {
      console.error('Error loading statement data:', error);
    }
  };

  const createStatement = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('provisional_financial_statements')
        .insert({
          company_id: companyId,
          fiscal_year: newStatementYear,
          period_type: newStatementPeriodType,
          period_number: newStatementPeriodNumber,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Create empty balance sheet and income statement
      await Promise.all([
        supabase.from('provisional_balance_sheets').insert({ provisional_statement_id: data.id }),
        supabase.from('provisional_income_statements').insert({ provisional_statement_id: data.id })
      ]);

      toast({ title: "Estado previsional creado correctamente" });
      setShowCreateDialog(false);
      fetchStatements();
      loadStatementData(data);
    } catch (error: any) {
      toast({ 
        title: "Error al crear estado previsional", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const saveStatementData = async () => {
    if (!selectedStatement) return;
    
    setSaving(true);
    try {
      await Promise.all([
        supabase
          .from('provisional_balance_sheets')
          .update(balanceSheet)
          .eq('provisional_statement_id', selectedStatement.id),
        supabase
          .from('provisional_income_statements')
          .update(incomeStatement)
          .eq('provisional_statement_id', selectedStatement.id)
      ]);

      toast({ title: "Datos guardados correctamente" });
    } catch (error: any) {
      toast({ 
        title: "Error al guardar", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteStatement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('provisional_financial_statements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Estado previsional eliminado" });
      if (selectedStatement?.id === id) {
        setSelectedStatement(null);
      }
      fetchStatements();
    } catch (error: any) {
      toast({ 
        title: "Error al eliminar", 
        description: error.message,
        variant: "destructive" 
      });
    }
  };

  const handlePdfUpload = async () => {
    if (!pdfFile || !selectedStatement) return;

    setParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfContent = e.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke('parse-financial-pdf', {
          body: {
            pdfContent: pdfContent.split(',')[1], // Remove data URL prefix
            companyName,
            fiscalYear: selectedStatement.fiscal_year,
            statementId: selectedStatement.id,
            isProvisional: true
          }
        });

        if (error) throw error;

        // Map parsed fields to balance sheet and income statement
        const mappedFields = data.mappedFields || [];
        const newBalanceSheet = { ...balanceSheet };
        const newIncomeStatement = { ...incomeStatement };

        mappedFields.forEach((field: any) => {
          const fieldName = field.field.replace('balance_', '').replace('income_', '');
          if (field.field.startsWith('balance_') && fieldName in newBalanceSheet) {
            (newBalanceSheet as any)[fieldName] = field.value;
          } else if (field.field.startsWith('income_') && fieldName in newIncomeStatement) {
            (newIncomeStatement as any)[fieldName] = field.value;
          }
        });

        setBalanceSheet(newBalanceSheet);
        setIncomeStatement(newIncomeStatement);
        
        toast({ 
          title: "PDF procesado correctamente",
          description: `Se han mapeado ${mappedFields.length} campos`
        });
        setShowPdfDialog(false);
        setPdfFile(null);
      };
      reader.readAsDataURL(pdfFile);
    } catch (error: any) {
      toast({ 
        title: "Error al procesar PDF", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setParsing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleBalanceChange = (field: keyof BalanceSheetData, value: string) => {
    setBalanceSheet(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleIncomeChange = (field: keyof IncomeStatementData, value: string) => {
    setIncomeStatement(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  // Calculate totals
  const totalAssets = 
    balanceSheet.intangible_assets + balanceSheet.tangible_assets + balanceSheet.real_estate_investments +
    balanceSheet.long_term_financial_investments + balanceSheet.deferred_tax_assets + balanceSheet.inventory +
    balanceSheet.trade_receivables + balanceSheet.short_term_financial_investments + balanceSheet.cash_equivalents;

  const totalEquity = 
    balanceSheet.share_capital + balanceSheet.share_premium + balanceSheet.reserves +
    balanceSheet.retained_earnings + balanceSheet.current_year_result;

  const totalLiabilities = 
    balanceSheet.long_term_provisions + balanceSheet.long_term_debts + balanceSheet.deferred_tax_liabilities +
    balanceSheet.short_term_provisions + balanceSheet.short_term_debts + balanceSheet.trade_payables +
    balanceSheet.other_creditors;

  const operatingResult = 
    incomeStatement.net_turnover + incomeStatement.inventory_variation + incomeStatement.capitalized_work +
    incomeStatement.other_operating_income + incomeStatement.operating_grants -
    incomeStatement.supplies - incomeStatement.personnel_expenses - incomeStatement.other_operating_expenses -
    incomeStatement.depreciation + incomeStatement.impairment_trade_operations + incomeStatement.other_operating_results;

  const netResult = 
    operatingResult + incomeStatement.financial_income - incomeStatement.financial_expenses +
    incomeStatement.exchange_differences + incomeStatement.impairment_financial_instruments +
    incomeStatement.other_financial_results - incomeStatement.corporate_tax;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Estats Financers Previsionals</h3>
          <p className="text-sm text-muted-foreground">{companyName}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nou Estat Previsional
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nou Estat Previsional</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Any Fiscal</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={newStatementYear}
                  onChange={(e) => setNewStatementYear(parseInt(e.target.value))}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tipus de Període</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={newStatementPeriodType}
                  onChange={(e) => {
                    setNewStatementPeriodType(e.target.value as any);
                    setNewStatementPeriodNumber(1);
                  }}
                >
                  <option value="quarterly">Trimestral</option>
                  <option value="semiannual">Semestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Període</Label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={newStatementPeriodNumber}
                  onChange={(e) => setNewStatementPeriodNumber(parseInt(e.target.value))}
                >
                  {newStatementPeriodType === 'quarterly' && (
                    <>
                      <option value={1}>T1 (Gener - Març)</option>
                      <option value={2}>T2 (Abril - Juny)</option>
                      <option value={3}>T3 (Juliol - Setembre)</option>
                      <option value={4}>T4 (Octubre - Desembre)</option>
                    </>
                  )}
                  {newStatementPeriodType === 'semiannual' && (
                    <>
                      <option value={1}>S1 (Gener - Juny)</option>
                      <option value={2}>S2 (Juliol - Desembre)</option>
                    </>
                  )}
                  {newStatementPeriodType === 'annual' && (
                    <option value={1}>Anual Complet</option>
                  )}
                </select>
              </div>
              <Button onClick={createStatement} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Crear Estat Previsional
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statements List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Estats Disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {statements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hi ha estats previsionals
              </p>
            ) : (
              statements.map((stmt) => (
                <div
                  key={stmt.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedStatement?.id === stmt.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => loadStatementData(stmt)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {stmt.fiscal_year} - {periodLabels[stmt.period_type][stmt.period_number]}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={stmt.is_approved ? "default" : "secondary"} className="text-xs">
                          {stmt.is_approved ? 'Aprovat' : 'Esborrany'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {stmt.source === 'manual' ? 'Manual' : 'PDF'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteStatement(stmt.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Statement Editor */}
        <Card className="lg:col-span-3">
          {selectedStatement ? (
            <>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedStatement.fiscal_year} - {periodLabels[selectedStatement.period_type][selectedStatement.period_number]}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Estat Previsional</p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileUp className="w-4 h-4 mr-2" />
                          Importar PDF
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Importar des de PDF</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Seleccionar Fitxer PDF</Label>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                            />
                          </div>
                          <Button 
                            onClick={handlePdfUpload} 
                            disabled={!pdfFile || parsing}
                            className="w-full"
                          >
                            {parsing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processant...
                              </>
                            ) : (
                              <>
                                <FileUp className="w-4 h-4 mr-2" />
                                Processar i Mapar
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button onClick={saveStatementData} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="balance" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="balance">Balanç</TabsTrigger>
                    <TabsTrigger value="income">Compte de Resultats</TabsTrigger>
                    <TabsTrigger value="summary">Resum</TabsTrigger>
                  </TabsList>

                  <TabsContent value="balance" className="space-y-4">
                    {/* Assets */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Actiu ({formatCurrency(totalAssets)})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'intangible_assets', label: 'Immobilitzat Intangible' },
                          { key: 'tangible_assets', label: 'Immobilitzat Material' },
                          { key: 'real_estate_investments', label: 'Inversions Immobiliàries' },
                          { key: 'long_term_financial_investments', label: 'Inversions Financeres LP' },
                          { key: 'deferred_tax_assets', label: 'Actius per Impost Diferit' },
                          { key: 'inventory', label: 'Existències' },
                          { key: 'trade_receivables', label: 'Deutors Comercials' },
                          { key: 'short_term_financial_investments', label: 'Inversions Financeres CP' },
                          { key: 'cash_equivalents', label: 'Efectiu' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={balanceSheet[key as keyof BalanceSheetData]}
                              onChange={(e) => handleBalanceChange(key as keyof BalanceSheetData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Patrimoni Net ({formatCurrency(totalEquity)})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'share_capital', label: 'Capital Social' },
                          { key: 'share_premium', label: 'Prima d\'Emissió' },
                          { key: 'reserves', label: 'Reserves' },
                          { key: 'retained_earnings', label: 'Resultats d\'Exercicis Anteriors' },
                          { key: 'current_year_result', label: 'Resultat de l\'Exercici' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={balanceSheet[key as keyof BalanceSheetData]}
                              onChange={(e) => handleBalanceChange(key as keyof BalanceSheetData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Liabilities */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Passiu ({formatCurrency(totalLiabilities)})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'long_term_provisions', label: 'Provisions LP' },
                          { key: 'long_term_debts', label: 'Deutes LP' },
                          { key: 'deferred_tax_liabilities', label: 'Passius per Impost Diferit' },
                          { key: 'short_term_provisions', label: 'Provisions CP' },
                          { key: 'short_term_debts', label: 'Deutes CP' },
                          { key: 'trade_payables', label: 'Creditors Comercials' },
                          { key: 'other_creditors', label: 'Altres Creditors' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={balanceSheet[key as keyof BalanceSheetData]}
                              onChange={(e) => handleBalanceChange(key as keyof BalanceSheetData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="income" className="space-y-4">
                    {/* Operating Income */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Ingressos d'Explotació</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'net_turnover', label: 'Xifra de Negocis' },
                          { key: 'inventory_variation', label: 'Variació Existències' },
                          { key: 'capitalized_work', label: 'Treballs per a l\'Actiu' },
                          { key: 'other_operating_income', label: 'Altres Ingressos' },
                          { key: 'operating_grants', label: 'Subvencions' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={incomeStatement[key as keyof IncomeStatementData]}
                              onChange={(e) => handleIncomeChange(key as keyof IncomeStatementData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operating Expenses */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Despeses d'Explotació</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'supplies', label: 'Aprovisionaments' },
                          { key: 'personnel_expenses', label: 'Despeses de Personal' },
                          { key: 'other_operating_expenses', label: 'Altres Despeses' },
                          { key: 'depreciation', label: 'Amortitzacions' },
                          { key: 'impairment_trade_operations', label: 'Deteriorament' },
                          { key: 'other_operating_results', label: 'Altres Resultats' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={incomeStatement[key as keyof IncomeStatementData]}
                              onChange={(e) => handleIncomeChange(key as keyof IncomeStatementData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Results */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Resultat Financer</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { key: 'financial_income', label: 'Ingressos Financers' },
                          { key: 'financial_expenses', label: 'Despeses Financeres' },
                          { key: 'exchange_differences', label: 'Diferències de Canvi' },
                          { key: 'impairment_financial_instruments', label: 'Deteriorament Financer' },
                          { key: 'other_financial_results', label: 'Altres Resultats Financers' },
                          { key: 'corporate_tax', label: 'Impost sobre Societats' },
                        ].map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              type="number"
                              value={incomeStatement[key as keyof IncomeStatementData]}
                              onChange={(e) => handleIncomeChange(key as keyof IncomeStatementData, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Total Actiu</p>
                          <p className="text-lg font-bold">{formatCurrency(totalAssets)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Patrimoni Net</p>
                          <p className="text-lg font-bold">{formatCurrency(totalEquity)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Total Passiu</p>
                          <p className="text-lg font-bold">{formatCurrency(totalLiabilities)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Equilibri</p>
                          <p className={`text-lg font-bold ${Math.abs(totalAssets - totalEquity - totalLiabilities) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalAssets - totalEquity - totalLiabilities)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Xifra de Negocis</p>
                          <p className="text-lg font-bold">{formatCurrency(incomeStatement.net_turnover)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Resultat d'Explotació</p>
                          <p className={`text-lg font-bold ${operatingResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(operatingResult)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Resultat Net</p>
                          <p className={`text-lg font-bold ${netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(netResult)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Ratios */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Ràtios Clau</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Ràtio Endeutament</p>
                            <p className="font-medium">
                              {totalEquity !== 0 ? ((totalLiabilities / totalEquity) * 100).toFixed(1) : '0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Marge Net</p>
                            <p className="font-medium">
                              {incomeStatement.net_turnover !== 0 ? ((netResult / incomeStatement.net_turnover) * 100).toFixed(1) : '0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ROE</p>
                            <p className="font-medium">
                              {totalEquity !== 0 ? ((netResult / totalEquity) * 100).toFixed(1) : '0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ROA</p>
                            <p className="font-medium">
                              {totalAssets !== 0 ? ((netResult / totalAssets) * 100).toFixed(1) : '0'}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Selecciona un estat previsional o crea'n un de nou</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
