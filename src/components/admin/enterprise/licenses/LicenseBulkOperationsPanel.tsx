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
import { useLicenseBulkOperations } from '@/hooks/admin/enterprise/useLicenseBulkOperations';
import { toast } from 'sonner';

type OperationType = 'activate' | 'suspend' | 'revoke' | 'export';

const OPERATIONS = [
  { 
    id: 'activate' as OperationType, 
    label: 'Activar Licencias', 
    description: 'Cambiar estado a activo',
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    color: 'bg-green-500/10 border-green-500/20',
    dangerous: false,
    status: 'active'
  },
  { 
    id: 'suspend' as OperationType, 
    label: 'Suspender Licencias', 
    description: 'Suspender licencias temporalmente',
    icon: <PauseCircle className="h-5 w-5 text-amber-500" />,
    color: 'bg-amber-500/10 border-amber-500/20',
    dangerous: true,
    status: 'suspended'
  },
  { 
    id: 'revoke' as OperationType, 
    label: 'Revocar Licencias', 
    description: 'Revocar permanentemente licencias',
    icon: <Trash2 className="h-5 w-5 text-red-500" />,
    color: 'bg-red-500/10 border-red-500/20',
    dangerous: true,
    status: 'revoked'
  },
  { 
    id: 'export' as OperationType, 
    label: 'Exportar Licencias', 
    description: 'Descargar datos de licencias',
    icon: <Download className="h-5 w-5 text-purple-500" />,
    color: 'bg-purple-500/10 border-purple-500/20',
    dangerous: false,
    status: ''
  },
];

export function LicenseBulkOperationsPanel() {
  const [selectedOperation, setSelectedOperation] = useState<OperationType | null>(null);
  const [licenseIds, setLicenseIds] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const {
    loading,
    progress,
    operationResult,
    bulkUpdateStatus,
    exportLicenses,
    resetProgress
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

    const operation = OPERATIONS.find(o => o.id === selectedOperation);

    if (selectedOperation === 'export') {
      await exportLicenses('csv');
    } else if (operation?.status) {
      await bulkUpdateStatus(ids, operation.status);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  placeholder={`Ingrese los IDs de licencia (uno por línea o separados por comas)\n\nEjemplo:\nlic_abc123...\nlic_def456...`}
                  value={licenseIds}
                  onChange={e => setLicenseIds(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{licenseCount} licencias detectadas</span>
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
                        Esta operación puede ser irreversible.
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
                    <span className="text-sm">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Results */}
              {operationResult && !loading && (
                <div className="space-y-2">
                  <Label>Resultados</Label>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-500">Exitosos:</span>
                      <span className="font-medium">{operationResult.success}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-red-500">Fallidos:</span>
                      <span className="font-medium">{operationResult.failed}</span>
                    </div>
                    {operationResult.errors.length > 0 && (
                      <ScrollArea className="h-[100px] mt-2">
                        {operationResult.errors.map((error, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground p-1">
                            Fila {error.row}: {error.error}
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
                      Elija el tipo de operación que desea realizar.
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
                resetProgress();
              }}
            >
              Limpiar Todo
            </Button>
            <Button
              onClick={handleStartOperation}
              disabled={!selectedOperation || (selectedOperation !== 'export' && licenseCount === 0) || loading}
            >
              <Zap className="h-4 w-4 mr-2" />
              Ejecutar ({licenseCount})
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
              Confirmar Operación
            </DialogTitle>
            <DialogDescription>
              Está a punto de {selectedOp?.label.toLowerCase()} {licenseCount} licencias.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                Licencias afectadas: {licenseCount}
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
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LicenseBulkOperationsPanel;
