import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Archive, Calendar, CheckCircle, Clock, Eye, FileText, History } from 'lucide-react';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

interface FinancialStatementsHistoryProps {
  companyId: string;
  currentYear: number;
}

interface Statement {
  id: string;
  fiscal_year: number;
  statement_type: string;
  status: string;
  source: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface ArchivedStatement {
  id: string;
  fiscal_year: number;
  statement_type: string;
  archived_at: string;
  balance_sheet_data: unknown;
  income_statement_data: unknown;
}

const FinancialStatementsHistory = ({ companyId, currentYear }: FinancialStatementsHistoryProps) => {
  const [activeStatements, setActiveStatements] = useState<Statement[]>([]);
  const [archivedStatements, setArchivedStatements] = useState<ArchivedStatement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [companyId]);

  const fetchHistory = async () => {
    try {
      const { data: active, error: activeError } = await supabase
        .from('company_financial_statements')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('fiscal_year', { ascending: false });
      
      if (activeError) throw activeError;
      setActiveStatements(active || []);

      const { data: archived, error: archivedError } = await supabase
        .from('financial_statements_archive')
        .select('*')
        .eq('company_id', companyId)
        .order('fiscal_year', { ascending: false });
      
      if (archivedError) throw archivedError;
      setArchivedStatements(archived || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Error carregant historial');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600"><Clock className="w-3 h-3 mr-1" /> Esborrany</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600"><FileText className="w-3 h-3 mr-1" /> Enviat</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Aprovat</Badge>;
      default:
        return null;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  if (loading) {
    return (
      <Card><CardContent className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Estats Financers Actius (últims 5 anys)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeStatements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hi ha estats financers actius</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Any Fiscal</TableHead>
                  <TableHead>Tipus</TableHead>
                  <TableHead>Estat</TableHead>
                  <TableHead>Font</TableHead>
                  <TableHead>Última Actualització</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeStatements.map(statement => (
                  <TableRow key={statement.id} className={statement.fiscal_year === currentYear ? 'bg-primary/5' : ''}>
                    <TableCell className="font-bold">
                      {statement.fiscal_year}
                      {statement.fiscal_year === currentYear && (
                        <Badge variant="secondary" className="ml-2">Actual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statement.statement_type.charAt(0).toUpperCase() + statement.statement_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(statement.status)}</TableCell>
                    <TableCell>
                      {statement.source === 'pdf_import' ? (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600">PDF</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/10 text-gray-600">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(statement.updated_at), 'dd/MM/yyyy HH:mm', { locale: ca })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Archive className="w-5 h-5 text-muted-foreground" />
            Estats Financers Arxivats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {archivedStatements.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hi ha estats financers arxivats.
              <br />
              <span className="text-sm">Els estats més antics s'arxiven automàticament quan superen 5 anys.</span>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Any Fiscal</TableHead>
                  <TableHead>Tipus</TableHead>
                  <TableHead>Data Arxiu</TableHead>
                  <TableHead>Accions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedStatements.map(statement => (
                  <TableRow key={statement.id}>
                    <TableCell className="font-bold">{statement.fiscal_year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {statement.statement_type.charAt(0).toUpperCase() + statement.statement_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(statement.archived_at), 'dd/MM/yyyy', { locale: ca })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" /> Veure
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Estat Financer Arxivat - {statement.fiscal_year}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Balanç</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                  {statement.balance_sheet_data && typeof statement.balance_sheet_data === 'object' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Total Actiu:</span>
                                        <span className="font-bold">
                                          {formatCurrency(
                                            (Number((statement.balance_sheet_data as Record<string, unknown>).intangible_assets) || 0) +
                                            (Number((statement.balance_sheet_data as Record<string, unknown>).tangible_assets) || 0) +
                                            (Number((statement.balance_sheet_data as Record<string, unknown>).inventory) || 0) +
                                            (Number((statement.balance_sheet_data as Record<string, unknown>).cash_equivalents) || 0)
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Capital Social:</span>
                                        <span>{formatCurrency(Number((statement.balance_sheet_data as Record<string, unknown>).share_capital) || 0)}</span>
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm">Compte de Resultats</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-1">
                                  {statement.income_statement_data && typeof statement.income_statement_data === 'object' && (
                                    <>
                                      <div className="flex justify-between">
                                        <span>Xifra de Negocis:</span>
                                        <span className="font-bold">{formatCurrency(Number((statement.income_statement_data as Record<string, unknown>).net_turnover) || 0)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Despeses Personal:</span>
                                        <span>{formatCurrency(Number((statement.income_statement_data as Record<string, unknown>).personnel_expenses) || 0)}</span>
                                      </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                              Aquestes dades són de només lectura.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            Línia Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
            <div className="space-y-4">
              {[...activeStatements, ...archivedStatements.map(a => ({ ...a, is_archived: true, status: 'archived' }))]
                .sort((a, b) => b.fiscal_year - a.fiscal_year)
                .map((statement) => (
                  <div key={statement.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                      'is_archived' in statement && statement.is_archived 
                        ? 'bg-muted border-muted-foreground' 
                        : 'bg-primary border-primary'
                    }`}></div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-lg">{statement.fiscal_year}</span>
                      {'status' in statement && statement.status !== 'archived' && getStatusBadge(statement.status)}
                      {'is_archived' in statement && statement.is_archived && (
                        <Badge variant="secondary">Arxivat</Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialStatementsHistory;
