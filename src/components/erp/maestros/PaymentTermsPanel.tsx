/**
 * Panel de gestión de Condiciones de Pago
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Wallet,
  Calendar,
  Check
} from 'lucide-react';
import { useMaestros, PaymentTerm } from '@/hooks/erp/useMaestros';

export const PaymentTermsPanel: React.FC = () => {
  const { paymentTerms, paymentTermsLoading, createPaymentTerm } = useMaestros();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    days: 0,
    day_of_month: null as number | null,
    is_default: false,
    is_active: true
  });

  const openNewDialog = () => {
    setFormData({
      name: '',
      days: 0,
      day_of_month: null,
      is_default: false,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPaymentTerm.mutateAsync(formData);
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Condiciones de Pago
          </CardTitle>
          <Button onClick={openNewDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Condición
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {paymentTermsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : paymentTerms.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay condiciones de pago configuradas</p>
            <p className="text-sm mt-2">
              Usa "Cargar datos iniciales" para crear condiciones básicas
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead>Día Fijo</TableHead>
                  <TableHead>Por Defecto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium">{term.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {term.days} días
                    </TableCell>
                    <TableCell>
                      {term.day_of_month ? (
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="h-3 w-3" />
                          Día {term.day_of_month}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {term.is_default && (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Sí
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={term.is_active ? 'default' : 'secondary'}>
                        {term.is_active ? 'Activo' : 'Inactivo'}
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
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva Condición de Pago</DialogTitle>
            <DialogDescription>
              Define una nueva forma de pago
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="30 días"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="days">Días</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  value={formData.days}
                  onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="day_of_month">Día Fijo del Mes</Label>
                <Input
                  id="day_of_month"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Opcional"
                  value={formData.day_of_month || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    day_of_month: e.target.value ? parseInt(e.target.value) : null 
                  })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="is_default">Condición por defecto</Label>
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <Label htmlFor="is_active">Condición activa</Label>
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
              <Button type="submit" disabled={createPaymentTerm.isPending}>
                Crear Condición
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PaymentTermsPanel;
