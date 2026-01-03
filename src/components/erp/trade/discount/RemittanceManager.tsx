/**
 * RemittanceManager - Gestión de Remesas de Descuento
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Building2,
  FileOutput,
  Loader2
} from 'lucide-react';
import { useERPDiscountOperations, DiscountRemittance, DiscountEffect } from '@/hooks/erp/useERPDiscountOperations';
import { useERPTradeFinance } from '@/hooks/erp/useERPTradeFinance';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const REMITTANCE_STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-gray-500', icon: FileText },
  generated: { label: 'Generada', color: 'bg-blue-500', icon: FileOutput },
  sent: { label: 'Enviada', color: 'bg-yellow-500', icon: Send },
  confirmed: { label: 'Confirmada', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'bg-red-500', icon: AlertTriangle },
};

const FILE_FORMATS = [
  { value: 'cuaderno_58', label: 'Cuaderno 58 (CSB)' },
  { value: 'sepa_xml', label: 'SEPA XML ISO 20022' },
  { value: 'norma_32', label: 'Norma 32' },
  { value: 'custom', label: 'Formato personalizado' },
];

export function RemittanceManager() {
  const [showNewRemittance, setShowNewRemittance] = useState(false);
  const [showRemittanceDetail, setShowRemittanceDetail] = useState(false);
  const [selectedRemittance, setSelectedRemittance] = useState<DiscountRemittance | null>(null);
  const [selectedEffects, setSelectedEffects] = useState<string[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('cuaderno_58');
  const [isCreating, setIsCreating] = useState(false);

  const {
    remittances,
    fetchRemittances,
    fetchPendingEffects,
    createRemittance,
    loading
  } = useERPDiscountOperations();

  const { entities } = useERPTradeFinance();

  const [pendingEffects, setPendingEffects] = useState<DiscountEffect[]>([]);
  const [loadingEffects, setLoadingEffects] = useState(false);

  useEffect(() => {
    fetchRemittances();
  }, [fetchRemittances]);

  const loadPendingEffects = useCallback(async () => {
    setLoadingEffects(true);
    const effects = await fetchPendingEffects();
    setPendingEffects(effects);
    setLoadingEffects(false);
  }, [fetchPendingEffects]);

  useEffect(() => {
    if (showNewRemittance) {
      loadPendingEffects();
    }
  }, [showNewRemittance, loadPendingEffects]);

  const handleToggleEffect = (effectId: string) => {
    setSelectedEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEffects.length === pendingEffects.length) {
      setSelectedEffects([]);
    } else {
      setSelectedEffects(pendingEffects.map(e => e.id));
    }
  };

  const handleCreateRemittance = async () => {
    if (!selectedEntity) {
      toast.error('Selecciona una entidad financiera');
      return;
    }
    if (selectedEffects.length === 0) {
      toast.error('Selecciona al menos un efecto');
      return;
    }

    setIsCreating(true);
    try {
      // Using a placeholder company_id - in real app would come from context
      const companyId = '00000000-0000-0000-0000-000000000001';
      const result = await createRemittance(companyId, selectedEntity, selectedEffects);
      
      if (result) {
        setShowNewRemittance(false);
        setSelectedEffects([]);
        setSelectedEntity('');
        fetchRemittances();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount || 0);
  };

  const totalSelectedAmount = pendingEffects
    .filter(e => selectedEffects.includes(e.id))
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const bankEntities = entities.filter(e => e.entity_type === 'bank');

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Remesas de Descuento
          </h3>
          <p className="text-sm text-muted-foreground">
            Genera y envía remesas de efectos a entidades financieras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRemittances()}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setShowNewRemittance(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nueva Remesa
          </Button>
        </div>
      </div>

      {/* Remittances Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Remesa</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="text-center">Efectos</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remittances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <FileOutput className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay remesas registradas</p>
                      <p className="text-xs mt-1">Crea una remesa para enviar efectos al banco</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  remittances.map((remittance) => {
                    const status = REMITTANCE_STATUS[remittance.status] || REMITTANCE_STATUS.draft;
                    const StatusIcon = status.icon;
                    const entity = entities.find(e => e.id === remittance.entity_id);
                    
                    return (
                      <TableRow key={remittance.id}>
                        <TableCell className="font-medium font-mono">
                          {remittance.remittance_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {entity?.name || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {remittance.total_effects}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(remittance.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {FILE_FORMATS.find(f => f.value === remittance.file_format)?.label || remittance.file_format}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "gap-1",
                              status.color.replace('bg-', 'text-'),
                              status.color.replace('bg-', 'border-')
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {remittance.generation_date 
                            ? format(new Date(remittance.generation_date), 'dd/MM/yyyy', { locale: es })
                            : format(new Date(remittance.created_at), 'dd/MM/yyyy', { locale: es })
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRemittance(remittance);
                                setShowRemittanceDetail(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {remittance.file_url && (
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* New Remittance Dialog */}
      <Dialog open={showNewRemittance} onOpenChange={setShowNewRemittance}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              Nueva Remesa de Descuento
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden space-y-4">
            {/* Config Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Entidad Financiera
                </label>
                <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar banco..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bankEntities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {entity.name} ({entity.swift_bic})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Formato de Fichero
                </label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Effects Selection */}
            <Card>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Efectos Pendientes ({pendingEffects.length})
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Seleccionados: <strong>{selectedEffects.length}</strong> • 
                      Total: <strong className="text-green-600">{formatCurrency(totalSelectedAmount)}</strong>
                    </span>
                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                      {selectedEffects.length === pendingEffects.length ? 'Deseleccionar' : 'Seleccionar'} todos
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  {loadingEffects ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : pendingEffects.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No hay efectos pendientes</p>
                      <p className="text-xs mt-1">Registra nuevos efectos para incluirlos en remesas</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Librado</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Importe</TableHead>
                          <TableHead>Vencimiento</TableHead>
                          <TableHead>IBAN</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingEffects.map((effect) => (
                          <TableRow 
                            key={effect.id}
                            className={cn(
                              "cursor-pointer",
                              selectedEffects.includes(effect.id) && "bg-primary/5"
                            )}
                            onClick={() => handleToggleEffect(effect.id)}
                          >
                            <TableCell>
                              <Checkbox 
                                checked={selectedEffects.includes(effect.id)}
                                onCheckedChange={() => handleToggleEffect(effect.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {effect.drawee_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {effect.effect_type === 'bill' ? 'Letra' :
                                 effect.effect_type === 'promissory_note' ? 'Pagaré' :
                                 effect.effect_type === 'receipt' ? 'Recibo' : 'Cheque'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(effect.amount, effect.currency)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {format(new Date(effect.maturity_date), 'dd/MM/yyyy', { locale: es })}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {effect.bank_iban || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRemittance(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateRemittance}
              disabled={isCreating || selectedEffects.length === 0 || !selectedEntity}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FileOutput className="h-4 w-4 mr-2" />
                  Crear Remesa ({selectedEffects.length} efectos)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remittance Detail Dialog */}
      <Dialog open={showRemittanceDetail} onOpenChange={setShowRemittanceDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileOutput className="h-5 w-5" />
              Detalle de Remesa
            </DialogTitle>
          </DialogHeader>
          
          {selectedRemittance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Número</label>
                  <p className="font-mono font-medium">{selectedRemittance.remittance_number}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Estado</label>
                  <div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        "gap-1",
                        REMITTANCE_STATUS[selectedRemittance.status]?.color.replace('bg-', 'text-')
                      )}
                    >
                      {REMITTANCE_STATUS[selectedRemittance.status]?.label}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Efectos</label>
                  <p className="font-medium">{selectedRemittance.total_effects}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Importe Total</label>
                  <p className="font-mono font-medium text-lg">
                    {formatCurrency(selectedRemittance.total_amount)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Formato</label>
                  <p>{FILE_FORMATS.find(f => f.value === selectedRemittance.file_format)?.label}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Referencia Banco</label>
                  <p className="font-mono">{selectedRemittance.bank_reference || '-'}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedRemittance.status === 'draft' && (
                  <Button>
                    <FileOutput className="h-4 w-4 mr-2" />
                    Generar Fichero
                  </Button>
                )}
                {selectedRemittance.status === 'generated' && (
                  <>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar
                    </Button>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Marcar como Enviada
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RemittanceManager;
