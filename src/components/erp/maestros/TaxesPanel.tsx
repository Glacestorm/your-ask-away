/**
 * Panel de gestión de Impuestos
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Receipt,
  Percent,
  Check
} from 'lucide-react';
import { useMaestros, Tax } from '@/hooks/erp/useMaestros';

export const TaxesPanel: React.FC = () => {
  const { taxes, taxesLoading, createTax } = useMaestros();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    tax_code: '',
    rate: 21,
    type: 'vat',
    is_default_sales: false,
    is_default_purchases: false,
    is_active: true
  });

  const openNewDialog = () => {
    setFormData({
      name: '',
      tax_code: '',
      rate: 21,
      type: 'vat',
      is_default_sales: false,
      is_default_purchases: false,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTax.mutateAsync(formData);
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Impuestos (IVA)
          </CardTitle>
          <Button onClick={openNewDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Impuesto
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {taxesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : taxes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay impuestos configurados</p>
            <p className="text-sm mt-2">
              Usa "Cargar datos iniciales" para crear los impuestos españoles
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Tasa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Defecto Ventas</TableHead>
                  <TableHead>Defecto Compras</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell className="font-medium">{tax.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tax.tax_code || '-'}</TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {tax.rate}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {tax.type === 'vat' ? 'IVA' : tax.type === 'withholding' ? 'Retención' : 'Otro'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tax.is_default_sales && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Sí
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {tax.is_default_purchases && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Sí
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tax.is_active ? 'default' : 'secondary'}>
                        {tax.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Nuevo Impuesto</DialogTitle>
            <DialogDescription>
              Configura un nuevo tipo de impuesto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="IVA 21%"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_code">Código</Label>
                <Input
                  id="tax_code"
                  value={formData.tax_code}
                  onChange={(e) => setFormData({ ...formData, tax_code: e.target.value.toUpperCase() })}
                  placeholder="IVA21"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rate">Tasa (%) *</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    required
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({ ...formData, type: v })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vat">IVA</SelectItem>
                    <SelectItem value="withholding">Retención</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="is_default_sales">Defecto para Ventas</Label>
                <Switch
                  id="is_default_sales"
                  checked={formData.is_default_sales}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default_sales: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="is_default_purchases">Defecto para Compras</Label>
                <Switch
                  id="is_default_purchases"
                  checked={formData.is_default_purchases}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default_purchases: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="is_active">Impuesto activo</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTax.isPending}>
                Crear Impuesto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TaxesPanel;
