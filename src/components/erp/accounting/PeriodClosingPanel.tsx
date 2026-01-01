/**
 * PeriodClosingPanel - Panel de cierre de período contable
 * Fase 2: Cierres automáticos con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  ArrowRight,
  Loader2,
  RefreshCw,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting, ERPAccountingPeriod } from '@/hooks/erp/useERPAccounting';
import { useERPFinancialReports, PeriodClosingStatus, ClosingEntry } from '@/hooks/erp/useERPFinancialReports';
import { cn } from '@/lib/utils';

interface PeriodClosingPanelProps {
  className?: string;
}

export function PeriodClosingPanel({ className }: PeriodClosingPanelProps) {
  const { currentCompany } = useERPContext();
  const { periods, fetchPeriods, chartOfAccounts, fetchChartOfAccounts } = useERPAccounting();
  const {
    closingStatus,
    isClosing,
    checkClosingStatus,
    executePeriodClosing,
    revertPeriodClosing
  } = useERPFinancialReports();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertReason, setRevertReason] = useState('');
  
  // Opciones de cierre
  const [closingOptions, setClosingOptions] = useState({
    close_revenue: true,
    close_expenses: true,
    transfer_net_income: true,
    target_equity_account: ''
  });

  // Cargar períodos
  useEffect(() => {
    if (currentCompany?.id) {
      fetchPeriods();
      fetchChartOfAccounts();
    }
  }, [currentCompany?.id, fetchPeriods, fetchChartOfAccounts]);

  // Verificar estado al seleccionar período
  useEffect(() => {
    if (selectedPeriodId) {
      checkClosingStatus(selectedPeriodId);
    }
  }, [selectedPeriodId, checkClosingStatus]);

  // Obtener período seleccionado
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId);

  // Cuentas de patrimonio para selección
  const equityAccounts = chartOfAccounts.filter(a => 
    a.account_type === 'equity' && a.accepts_entries !== false
  );

  // Ejecutar cierre
  const handleExecuteClosing = async () => {
    if (!selectedPeriodId) return;
    
    setShowConfirmDialog(false);
    await executePeriodClosing(selectedPeriodId, closingOptions);
  };

  // Revertir cierre
  const handleRevertClosing = async () => {
    if (!selectedPeriodId || !revertReason.trim()) return;
    
    setShowRevertDialog(false);
    await revertPeriodClosing(selectedPeriodId, revertReason);
    setRevertReason('');
  };

  // Calcular progreso de cierre
  const calculateProgress = () => {
    if (!closingStatus) return 0;
    
    let steps = 0;
    let completed = 0;
    
    // Verificación de balance
    steps++;
    if (closingStatus.trial_balance_verified) completed++;
    
    // Conciliación de auxiliares
    steps++;
    if (closingStatus.subsidiary_reconciled) completed++;
    
    // Asientos de cierre
    steps += 3; // Revenue, expenses, net income
    completed += closingStatus.closing_entries.filter(e => e.status === 'posted').length;
    
    return Math.round((completed / steps) * 100);
  };

  // Renderizar estado del período
  const renderPeriodStatus = () => {
    if (!selectedPeriod) return null;

    const statusConfig = {
      open: { icon: Unlock, color: 'text-green-600 bg-green-500/10', label: 'Abierto' },
      closing: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-500/10', label: 'En Proceso' },
      closed: { icon: Lock, color: 'text-blue-600 bg-blue-500/10', label: 'Cerrado' }
    };

    const status = closingStatus?.status || 'open';
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg", config.color)}>
        <Icon className="h-5 w-5" />
        <div>
          <div className="font-medium">{selectedPeriod.name}</div>
          <div className="text-xs">
            {format(new Date(selectedPeriod.start_date), 'dd/MM/yyyy', { locale: es })} - {' '}
            {format(new Date(selectedPeriod.end_date), 'dd/MM/yyyy', { locale: es })}
          </div>
        </div>
        <Badge variant="outline" className="ml-auto">{config.label}</Badge>
      </div>
    );
  };

  // Renderizar checklist de cierre
  const renderClosingChecklist = () => {
    if (!closingStatus) return null;

    const checks = [
      {
        label: 'Balance de comprobación verificado',
        checked: closingStatus.trial_balance_verified,
        description: 'Sumas y saldos cuadran correctamente'
      },
      {
        label: 'Auxiliares conciliados',
        checked: closingStatus.subsidiary_reconciled,
        description: 'Clientes, proveedores, bancos conciliados'
      },
      {
        label: 'Sin bloqueos',
        checked: closingStatus.blocking_issues.length === 0,
        description: closingStatus.blocking_issues.length > 0 
          ? `${closingStatus.blocking_issues.length} problemas pendientes`
          : 'No hay problemas que impidan el cierre'
      }
    ];

    return (
      <div className="space-y-2">
        {checks.map((check, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              check.checked ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"
            )}
          >
            {check.checked ? (
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <div className="font-medium text-sm">{check.label}</div>
              <div className="text-xs text-muted-foreground">{check.description}</div>
            </div>
          </div>
        ))}

        {/* Problemas bloqueantes */}
        {closingStatus.blocking_issues.length > 0 && (
          <div className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="font-medium text-sm text-red-600 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Problemas que impiden el cierre
            </div>
            <ul className="space-y-1">
              {closingStatus.blocking_issues.map((issue, i) => (
                <li key={i} className="text-sm text-red-600 flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Renderizar asientos de cierre
  const renderClosingEntries = () => {
    if (!closingStatus?.closing_entries.length) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No hay asientos de cierre generados</p>
        </div>
      );
    }

    const entryTypeLabels: Record<string, string> = {
      revenue_close: 'Cierre de Ingresos',
      expense_close: 'Cierre de Gastos',
      net_income: 'Traspaso Resultado',
      dividend: 'Distribución Dividendos'
    };

    const statusBadge = (status: string) => {
      const config = {
        pending: { color: 'bg-amber-500/10 text-amber-600', label: 'Pendiente' },
        posted: { color: 'bg-green-500/10 text-green-600', label: 'Contabilizado' },
        reversed: { color: 'bg-red-500/10 text-red-600', label: 'Anulado' }
      };
      const c = config[status as keyof typeof config] || config.pending;
      return <Badge variant="outline" className={c.color}>{c.label}</Badge>;
    };

    return (
      <div className="space-y-2">
        {closingStatus.closing_entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">
                  {entryTypeLabels[entry.entry_type] || entry.entry_type}
                </div>
                <div className="text-xs text-muted-foreground">{entry.description}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">
                {new Intl.NumberFormat('es-ES').format(entry.total_amount)} €
              </span>
              {statusBadge(entry.status)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cierre de Período</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedPeriodId || 'none'} onValueChange={(v) => setSelectedPeriodId(v === 'none' ? '' : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seleccionar período</SelectItem>
                {periods.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.is_closed && ' (Cerrado)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedPeriodId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => checkClosingStatus(selectedPeriodId)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {!selectedPeriodId ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Seleccione un período para ver el estado de cierre</p>
          </div>
        ) : (
          <>
            {/* Estado del período */}
            {renderPeriodStatus()}

            {/* Progreso */}
            {closingStatus && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progreso de Cierre</span>
                  <span className="font-medium">{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            )}

            {/* Accordion con secciones */}
            <Accordion type="multiple" defaultValue={['checklist', 'options']}>
              <AccordionItem value="checklist">
                <AccordionTrigger className="text-sm font-medium">
                  Verificaciones Previas
                </AccordionTrigger>
                <AccordionContent>
                  {renderClosingChecklist()}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="options">
                <AccordionTrigger className="text-sm font-medium">
                  Opciones de Cierre
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="close-revenue" className="text-sm">
                        Cerrar cuentas de ingresos
                      </Label>
                      <Switch
                        id="close-revenue"
                        checked={closingOptions.close_revenue}
                        onCheckedChange={(v) => setClosingOptions(prev => ({ ...prev, close_revenue: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="close-expenses" className="text-sm">
                        Cerrar cuentas de gastos
                      </Label>
                      <Switch
                        id="close-expenses"
                        checked={closingOptions.close_expenses}
                        onCheckedChange={(v) => setClosingOptions(prev => ({ ...prev, close_expenses: v }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="transfer-income" className="text-sm">
                        Traspasar resultado a patrimonio
                      </Label>
                      <Switch
                        id="transfer-income"
                        checked={closingOptions.transfer_net_income}
                        onCheckedChange={(v) => setClosingOptions(prev => ({ ...prev, transfer_net_income: v }))}
                      />
                    </div>

                    {closingOptions.transfer_net_income && (
                      <div className="space-y-2">
                        <Label className="text-sm">Cuenta destino del resultado</Label>
                        <Select
                          value={closingOptions.target_equity_account || 'default'}
                          onValueChange={(v) => setClosingOptions(prev => ({ 
                            ...prev, 
                            target_equity_account: v === 'default' ? '' : v 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar cuenta" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Resultado del ejercicio (por defecto)</SelectItem>
                            {equityAccounts.map(a => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.account_code} - {a.account_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="entries">
                <AccordionTrigger className="text-sm font-medium">
                  Asientos de Cierre
                </AccordionTrigger>
                <AccordionContent>
                  {renderClosingEntries()}
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {closingStatus?.status === 'closed' ? (
                <Button
                  variant="outline"
                  onClick={() => setShowRevertDialog(true)}
                  disabled={isClosing}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revertir Cierre
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isClosing || !closingStatus?.can_close}
                >
                  {isClosing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Ejecutar Cierre
                    </>
                  )}
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Dialog de confirmación de cierre */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cierre de Período</DialogTitle>
            <DialogDescription>
              Esta acción generará los asientos de cierre contable para el período{' '}
              <strong>{selectedPeriod?.name}</strong>. Una vez ejecutado, el período
              quedará cerrado y no se podrán registrar más asientos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <div className="text-sm">
              <strong>Operaciones a ejecutar:</strong>
            </div>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {closingOptions.close_revenue && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cerrar cuentas de ingresos
                </li>
              )}
              {closingOptions.close_expenses && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Cerrar cuentas de gastos
                </li>
              )}
              {closingOptions.transfer_net_income && (
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Traspasar resultado a patrimonio
                </li>
              )}
            </ul>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExecuteClosing} disabled={isClosing}>
              {isClosing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de reversión */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revertir Cierre de Período</DialogTitle>
            <DialogDescription>
              Esta acción revertirá todos los asientos de cierre del período{' '}
              <strong>{selectedPeriod?.name}</strong> y lo reabrirá para nuevos registros.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600 text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                Atención
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Revertir un cierre contable es una operación excepcional que debe estar
                debidamente justificada. Se generarán asientos de reversión y quedará
                registrado en la auditoría.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revert-reason">Motivo de la reversión *</Label>
              <Textarea
                id="revert-reason"
                placeholder="Indique el motivo por el cual se revierte el cierre..."
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevertDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevertClosing}
              disabled={isClosing || !revertReason.trim()}
            >
              {isClosing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Revertir Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PeriodClosingPanel;
