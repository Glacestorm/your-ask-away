/**
 * Gestión de Series Documentales
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hash, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useERPSeries } from '@/hooks/erp/useERPSeries';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { ERPSeries, CreateSeriesForm } from '@/types/erp';
import { toast } from 'sonner';

const MODULES = [
  { value: 'sales', label: 'Ventas' },
  { value: 'purchases', label: 'Compras' },
  { value: 'inventory', label: 'Almacén' },
  { value: 'accounting', label: 'Contabilidad' },
  { value: 'treasury', label: 'Tesorería' },
];

const DOCUMENT_TYPES: Record<string, { value: string; label: string }[]> = {
  sales: [
    { value: 'invoice', label: 'Factura' },
    { value: 'credit_note', label: 'Abono' },
    { value: 'quote', label: 'Presupuesto' },
    { value: 'order', label: 'Pedido' },
    { value: 'delivery', label: 'Albarán' },
  ],
  purchases: [
    { value: 'invoice', label: 'Factura' },
    { value: 'credit_note', label: 'Abono' },
    { value: 'order', label: 'Pedido' },
    { value: 'receipt', label: 'Recepción' },
  ],
  inventory: [
    { value: 'movement', label: 'Movimiento' },
    { value: 'transfer', label: 'Transferencia' },
    { value: 'adjustment', label: 'Ajuste' },
  ],
  accounting: [
    { value: 'journal', label: 'Asiento' },
  ],
  treasury: [
    { value: 'payment', label: 'Pago' },
    { value: 'receipt', label: 'Cobro' },
    { value: 'sepa', label: 'Remesa SEPA' },
  ],
};

const initialForm: CreateSeriesForm = {
  module: 'sales',
  document_type: 'invoice',
  code: '',
  name: '',
  prefix: '',
  suffix: '',
  padding: 5,
  reset_annually: true,
  is_default: false,
};

export function ERPSeriesManager() {
  const { currentCompany, hasPermission } = useERPContext();
  const { series, isLoading, fetchSeries, createSeries, updateSeries, deleteSeries } = useERPSeries();
  
  const [showDialog, setShowDialog] = useState(false);
  const [editingSeries, setEditingSeries] = useState<ERPSeries | null>(null);
  const [form, setForm] = useState<CreateSeriesForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const canWrite = hasPermission('admin.all');

  useEffect(() => {
    if (currentCompany?.id) {
      fetchSeries();
    }
  }, [currentCompany?.id, fetchSeries]);

  const handleOpenCreate = () => {
    setEditingSeries(null);
    setForm(initialForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (s: ERPSeries) => {
    setEditingSeries(s);
    setForm({
      module: s.module,
      document_type: s.document_type,
      code: s.code,
      name: s.name,
      prefix: s.prefix,
      suffix: s.suffix,
      padding: s.padding,
      reset_annually: s.reset_annually,
      is_default: s.is_default,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    if (!currentCompany?.id) return;

    setIsSaving(true);
    try {
      if (editingSeries) {
        await updateSeries(editingSeries.id, form);
      } else {
        await createSeries(form);
      }
      setShowDialog(false);
    } catch (err) {
      toast.error('Error al guardar serie');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (s: ERPSeries) => {
    if (!confirm(`¿Eliminar permanentemente la serie "${s.name}"?`)) return;
    
    try {
      await deleteSeries(s.id);
    } catch (err) {
      toast.error('Error al eliminar serie');
    }
  };

  const getModuleLabel = (module: string) => 
    MODULES.find(m => m.value === module)?.label || module;

  const getDocTypeLabel = (module: string, docType: string) =>
    DOCUMENT_TYPES[module]?.find(d => d.value === docType)?.label || docType;

  const previewNumber = () => {
    const num = '1'.padStart(form.padding || 5, '0');
    return `${form.prefix || ''}${num}${form.suffix || ''}`;
  };

  if (!currentCompany) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Selecciona una empresa para gestionar series
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Series Documentales
            </CardTitle>
            <CardDescription>
              Configuración de numeración automática de documentos
            </CardDescription>
          </div>
          {canWrite && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Serie
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay series configuradas.
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Tipo Doc.</TableHead>
                  <TableHead>Próximo Nº</TableHead>
                  <TableHead>Por Defecto</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono">{s.code}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getModuleLabel(s.module)}</Badge>
                    </TableCell>
                    <TableCell>{getDocTypeLabel(s.module, s.document_type)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.prefix}{String(s.next_number).padStart(s.padding, '0')}{s.suffix}
                    </TableCell>
                    <TableCell>
                      {s.is_default && <Badge>Default</Badge>}
                    </TableCell>
                    {canWrite && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Crear/Editar */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSeries ? 'Editar Serie' : 'Nueva Serie'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Módulo</Label>
                  <Select 
                    value={form.module} 
                    onValueChange={(v) => setForm({ ...form, module: v, document_type: DOCUMENT_TYPES[v]?.[0]?.value || '' })}
                    disabled={!!editingSeries}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODULES.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select 
                    value={form.document_type} 
                    onValueChange={(v) => setForm({ ...form, document_type: v })}
                    disabled={!!editingSeries}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(DOCUMENT_TYPES[form.module] || []).map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="FAC"
                    maxLength={10}
                    disabled={!!editingSeries}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Facturas de Venta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefijo</Label>
                  <Input
                    id="prefix"
                    value={form.prefix}
                    onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                    placeholder="FAC-"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="padding">Dígitos</Label>
                  <Input
                    id="padding"
                    type="number"
                    min={1}
                    max={10}
                    value={form.padding}
                    onChange={(e) => setForm({ ...form, padding: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suffix">Sufijo</Label>
                  <Input
                    id="suffix"
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                    placeholder="-2025"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Vista previa:</p>
                <p className="font-mono text-lg">{previewNumber()}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.reset_annually}
                    onCheckedChange={(v) => setForm({ ...form, reset_annually: v })}
                  />
                  <Label>Reiniciar numeración anualmente</Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.is_default}
                    onCheckedChange={(v) => setForm({ ...form, is_default: v })}
                  />
                  <Label>Serie por defecto</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSeries ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPSeriesManager;
