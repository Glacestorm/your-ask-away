/**
 * License Bulk Operations Panel
 * Operaciones masivas sobre licencias
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Trash2,
  PauseCircle,
  Calendar,
  Download,
  Upload,
  Zap,
  Info
} from 'lucide-react';
import { useLicenseBulkOperations, BulkOperationResult } from '@/hooks/admin/enterprise/useLicenseBulkOperations';
import { toast } from 'sonner';

type OperationType = 'activate' | 'deactivate' | 'suspend' | 'renew' | 'revoke' | 'export';

const OPERATIONS = [
  { 
    id: 'activate' as OperationType, 
    label: 'Activar Licencias', 
    description: 'Activar múltiples licencias pendientes',
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    color: 'bg-green-500/10 border-green-500/20',
    dangerous: false
  },
  { 
    id: 'deactivate' as OperationType, 
    label: 'Desactivar Licencias', 
    description: 'Desactivar temporalmente licencias activas',
    icon: <PauseCircle className="h-5 w-5 text-amber-500" />,
    color: 'bg-amber-500/10 border-amber-500/20',
    dangerous: true
  },
  { 
    id: 'suspend' as OperationType, 
    label: 'Suspender Licencias', 
    description: 'Suspender licencias por incumplimiento',
    icon: <XCircle className="h-5 w-5 text-red-500" />,
    color: 'bg-red-500/10 border-red-500/20',
    dangerous: true
  },
  { 
    id: 'renew' as OperationType, 
    label: 'Renovar Licencias', 
    description: 'Extender fecha de expiración',
    icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
    color: 'bg-blue-500/10 border-blue-500/20',
    dangerous: false
  },
  { 
    id: 'revoke' as OperationType, 
    label: 'Revocar Licencias', 
    description: 'Revocar permanentemente licencias',
    icon: <Trash2 className="h-5 w-5 text-red-500" />,
    color: 'bg-red-500/10 border-red-500/20',
    dangerous: true
  },
  { 
    id: 'export' as OperationType, 
    label: 'Exportar Licencias', 
    description: 'Descargar datos de licencias seleccionadas',
    icon: <Download className="h-5 w-5 text-purple-500" />,
    color: 'bg-purple-500/10 border-purple-500/20',
    dangerous: false
  },
];

export function LicenseBulkOperationsPanel() {
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [licenseIds, setLicenseIds] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [renewDays, setRenewDays] = useState(365);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [results, setResults] = useState<BulkOperationResult | null>(null);

  const {
    loading,
    bulkActivate,
    bulkDeactivate,
    bulkSuspend,
    bulkRenew,
    bulkRevoke,
    bulkExport
  } = useLicenseBulkOperations();

  const parseLicenseIds = (): string[] => {
    return licenseIds
      .split(/[\n,;]/)
      .map(id => id.trim())
      .filter(id => id.length > 0);
  };

  const handleStartOperation = () => {
    const ids = parseLicenseIds();
    if (ids.length === 0) {
      toast.error('Ingrese al menos un ID de licencia');
      return;
    }

    const operation = OPERATIONS.find(o => o.id === selectedOperation);
    if (operation?.dangerous) {
      setIsConfirmOpen(true);
    } else {
      executeOperation();
    }
  };

  const executeOperation = async () => {
    const ids = parseLicenseIds();
    
    if (!selectedOperation) return;

    let result: BulkOperationResult | null = null;

    switch (selectedOperation) {
      case 'activate':
        result = await bulkActivate(ids);
        break;
      case 'deactivate':
        result = await bulkDeactivate(ids);
        break;
      case 'suspend':
        result = await bulkSuspend(ids);
        break;
      case 'renew':
        result = await bulkRenew(ids, renewDays);
        break;
      case 'revoke':
        result = await bulkRevoke(ids);
        break;
      case 'export':
        await bulkExport(ids, 'csv');
        result = { success: ids.length, failed: 0, errors: [] };
        break;
    }

    if (result) {
      setResults(result);
    }

    setIsConfirmOpen(false);
    setConfirmText('');
  };

  const handleConfirm = () => {
    if (confirmText.toLowerCase() !== 'confirmar') {
      toast.error('Escriba "CONFIRMAR" para continuar');
      return;
    }
    executeOperation();
  };

  const selectedOp = OPERATIONS.find(o => o.id === selectedOperation);
  const licenseCount = parseLicenseIds().length;

  return (
    <div className="space-y-6">
      {/* Operation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPERATIONS.map(operation => (
          <Card
            key={operation.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedOperation === operation.id
                ? `ring-2 ring-primary ${operation.color}`
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedOperation(operation.id)}
          >
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${operation.color}`}>
                  {operation.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{operation.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {operation.description}
                  </p>
                </div>
                {selectedOperation === operation.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Operaciones Masivas
          </CardTitle>
          <CardDescription>
            Ejecute operaciones sobre múltiples licencias simultáneamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* License IDs Input */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>IDs de Licencias</Label>
                <Textarea
                  placeholder={`Ingrese los IDs de licencia (uno por línea o separados por comas)\n\nEjemplo:\nlic_abc123...\nlic_def456...\nlic_ghi789...`}
                  value={licenseIds}
                  onChange={e => setLicenseIds(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{licenseCount} licencias detectadas</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Importar CSV
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setLicenseIds('')}
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Additional Options for Renew */}
              {selectedOperation === 'renew' && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <Label>Días a Extender</Label>
                  <Select
                    value={String(renewDays)}
                    onValueChange={v => setRenewDays(Number(v))}
                  >
                    <SelectTrigger>
                      <Calendar className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 días</SelectItem>
                      <SelectItem value="90">90 días</SelectItem>
                      <SelectItem value="180">180 días</SelectItem>
                      <SelectItem value="365">1 año</SelectItem>
                      <SelectItem value="730">2 años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Preview & Status */}
            <div className="space-y-4">
              {/* Selected Operation Preview */}
              {selectedOp && (
                <div className={`p-4 rounded-lg border ${selectedOp.color}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {selectedOp.icon}
                    <div>
                      <h4 className="font-medium">{selectedOp.label}</h4>
                      <p className="text-xs text-muted-foreground">{selectedOp.description}</p>
                    </div>
                  </div>
                  
                  {selectedOp.dangerous && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg mt-3">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <p className="text-xs text-destructive">
                        Esta operación es irreversible. Asegúrese de seleccionar las licencias correctas.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Progress */}
              {loading && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Procesando...</span>
                  </div>
                  <Progress value={50} className="animate-pulse" />
                </div>
              )}

              {/* Results */}
              {results && !loading && (
                <div className="space-y-2">
                  <Label>Resultados</Label>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-500">Exitosos:</span>
                      <span className="font-medium">{results.success}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-500">Fallidos:</span>
                      <span className="font-medium">{results.failed}</span>
                    </div>
                    {results.errors.length > 0 && (
                      <ScrollArea className="h-[100px] mt-2">
                        {results.errors.map((error, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground p-1">
                            {error}
                          </div>
                        ))}
                      </ScrollArea>
                    )}
                  </div>
                </div>
              )}

              {/* Info */}
              {!selectedOperation && (
                <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-1">Seleccione una operación</p>
                    <p className="text-xs">
                      Elija el tipo de operación que desea realizar sobre las licencias seleccionadas.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setLicenseIds('');
                setSelectedOperation(null);
                setResults(null);
              }}
            >
              Limpiar Todo
            </Button>
            <Button
              onClick={handleStartOperation}
              disabled={!selectedOperation || licenseCount === 0 || loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              Ejecutar Operación ({licenseCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Operación Peligrosa
            </DialogTitle>
            <DialogDescription>
              Está a punto de {selectedOp?.label.toLowerCase()} {licenseCount} licencias.
              Esta acción puede ser irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                Licencias afectadas: {licenseCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Esta operación afectará permanentemente las licencias seleccionadas.
                Asegúrese de haber verificado la lista antes de continuar.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Escriba "CONFIRMAR" para continuar</Label>
              <Input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'confirmar'}
            >
              Confirmar Operación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseBulkOperationsPanel;
