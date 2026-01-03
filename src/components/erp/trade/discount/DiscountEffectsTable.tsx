/**
 * Tabla de Efectos de Descuento
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Search,
  FileText,
  Receipt,
  CreditCard,
  CheckSquare
} from 'lucide-react';
import { useERPDiscountOperations, DiscountEffect } from '@/hooks/erp/useERPDiscountOperations';
import { NewEffectForm } from './NewEffectForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const effectTypeConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  bill: { label: 'Letra', icon: <FileText className="h-3 w-3" /> },
  promissory_note: { label: 'Pagaré', icon: <CreditCard className="h-3 w-3" /> },
  receipt: { label: 'Recibo', icon: <Receipt className="h-3 w-3" /> },
  check: { label: 'Cheque', icon: <CheckSquare className="h-3 w-3" /> }
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  discounted: { label: 'Descontado', variant: 'default' },
  paid: { label: 'Cobrado', variant: 'default' },
  returned: { label: 'Devuelto', variant: 'destructive' },
  protested: { label: 'Protestado', variant: 'destructive' }
};

export function DiscountEffectsTable() {
  const [showNewEffect, setShowNewEffect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { effects, fetchEffects, fetchPendingEffects } = useERPDiscountOperations();

  useEffect(() => {
    fetchEffects();
  }, [fetchEffects]);

  const filteredEffects = effects.filter(effect => {
    const matchesSearch = 
      effect.drawee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      effect.effect_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      effect.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || effect.status === statusFilter;
    const matchesType = typeFilter === 'all' || effect.effect_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getDaysToMaturity = (maturityDate: string) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por librado, número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="bill">Letras</SelectItem>
            <SelectItem value="promissory_note">Pagarés</SelectItem>
            <SelectItem value="receipt">Recibos</SelectItem>
            <SelectItem value="check">Cheques</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="discounted">Descontados</SelectItem>
            <SelectItem value="paid">Cobrados</SelectItem>
            <SelectItem value="returned">Devueltos</SelectItem>
          </SelectContent>
        </Select>

        <Button size="sm" onClick={() => setShowNewEffect(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Efecto
        </Button>
      </div>

      {/* Table */}
      <ScrollArea className="h-[350px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Nº Efecto</TableHead>
              <TableHead>Librado</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEffects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No hay efectos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredEffects.map((effect) => {
                const typeInfo = effectTypeConfig[effect.effect_type] || effectTypeConfig.bill;
                const statusInfo = statusConfig[effect.status] || statusConfig.pending;
                const daysToMaturity = getDaysToMaturity(effect.maturity_date);

                return (
                  <TableRow key={effect.id}>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {typeInfo.icon}
                        {typeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {effect.effect_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{effect.drawee_name}</p>
                        {effect.drawee_tax_id && (
                          <p className="text-xs text-muted-foreground">{effect.drawee_tax_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(effect.amount, effect.currency)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(effect.issue_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(effect.maturity_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={daysToMaturity < 0 ? 'destructive' : daysToMaturity < 7 ? 'secondary' : 'outline'}
                      >
                        {daysToMaturity} días
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Summary */}
      <div className="flex justify-between items-center pt-2 border-t text-sm">
        <span className="text-muted-foreground">
          {filteredEffects.length} efectos
        </span>
        <span className="font-medium">
          Total: {formatCurrency(filteredEffects.reduce((sum, e) => sum + e.amount, 0))}
        </span>
      </div>

      {/* New Effect Dialog */}
      <Dialog open={showNewEffect} onOpenChange={setShowNewEffect}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Efecto</DialogTitle>
          </DialogHeader>
          <NewEffectForm 
            onSuccess={() => {
              setShowNewEffect(false);
              fetchEffects();
            }}
            onCancel={() => setShowNewEffect(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DiscountEffectsTable;
