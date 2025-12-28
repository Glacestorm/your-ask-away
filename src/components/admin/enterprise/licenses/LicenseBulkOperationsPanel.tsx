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
import { Checkbox } from '@/components/ui/checkbox';
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
  Play,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  RefreshCw,
  Trash2,
  PauseCircle,
  Calendar,
  Download,
  Upload,
  Zap,
  Info,
  Clock
} from 'lucide-react';
import { useLicenseBulkOperations } from '@/hooks/admin/enterprise';
import { toast } from 'sonner';

type OperationType = 'activate' | 'deactivate' | 'suspend' | 'renew' | 'delete' | 'export';

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
    id: 'delete' as OperationType, 
    label: 'Eliminar Licencias', 
    description: 'Eliminar permanentemente licencias',
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

  const {
    isProcessing,
    progress,
    results,
    executeBulkOperation,
    cancelOperation
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

    const params: Record<string, unknown> = {};
    if (selectedOperation === 'renew') {
      params.days = renewDays;
    }

    await executeBulkOperation(selectedOperation, ids, params);
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
                  placeholder="Ingrese los IDs de licencia (uno por línea o separados por comas)&#10;&#10;Ejemplo:&#10;lic_abc123...&#10;lic_def456...&#10;lic_ghi789..."
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
              {isProcessing && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Procesando...</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="text-green-500">{progress.success} exitosos</span>
                    <span className="text-red-500">{progress.failed} fallidos</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={cancelOperation}
                  >
                    Cancelar Operación
                  </Button>
                </div>
              )}

              {/* Results */}
              {results.length > 0 && !isProcessing && (
                <div className="space-y-2">
                  <Label>Resultados</Label>
                  <ScrollArea className="h-[200px] border rounded-lg p-2">
                    {results.map((result, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-2 p-2 text-sm rounded ${
                          result.success ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}
                      >
                        {result.success ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <code className="text-xs">{result.licenseId.slice(0, 12)}...</code>
                        {result.error && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {result.error}
                          </span>
                        )}
                      </div>
                    ))}
                  </ScrollArea>
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
              }}
            >
              Limpiar Todo
            </Button>
            <Button
              onClick={handleStartOperation}
              disabled={!selectedOperation || licenseCount === 0 || isProcessing}
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
