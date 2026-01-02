/**
 * Panel de gestión de Condiciones de Pago - Refactorizado
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Wallet, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useMaestros, PaymentTerm } from '@/hooks/erp/useMaestros';
import { motion } from 'framer-motion';
import { 
  DataTable, 
  Column, 
  SearchFilters,
  EntityFormDialog,
  FormTab,
  StatusBadge,
  StatsCard
} from './shared';

export const PaymentTermsPanel: React.FC = () => {
  const { paymentTerms, paymentTermsLoading, createPaymentTerm } = useMaestros();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    days: 0,
    day_of_month: null as number | null,
    is_default: false,
    is_active: true
  });

  // Stats
  const stats = useMemo(() => ({
    total: paymentTerms.length,
    active: paymentTerms.filter(t => t.is_active).length,
    withFixedDay: paymentTerms.filter(t => t.day_of_month).length,
    defaults: paymentTerms.filter(t => t.is_default).length
  }), [paymentTerms]);

  // Filtering
  const filteredTerms = useMemo(() => {
    return paymentTerms.filter(t => {
      return !search || t.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [paymentTerms, search]);

  // Table columns
  const columns: Column<PaymentTerm>[] = [
    { 
      key: 'name', 
      header: 'Nombre', 
      sortable: true,
      accessor: (term) => <span className="font-medium">{term.name}</span>
    },
    { 
      key: 'days', 
      header: 'Días', 
      sortable: true,
      className: 'text-right',
      accessor: (term) => <span className="font-mono">{term.days} días</span>
    },
    { 
      key: 'day_of_month', 
      header: 'Día Fijo',
      accessor: (term) => term.day_of_month ? (
        <span className="text-sm flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Día {term.day_of_month}
        </span>
      ) : <span className="text-muted-foreground text-sm">-</span>
    },
    { 
      key: 'is_default', 
      header: 'Por Defecto',
      accessor: (term) => term.is_default ? (
        <StatusBadge status="active" activeLabel="Sí" />
      ) : <span className="text-muted-foreground">-</span>
    },
    { 
      key: 'is_active', 
      header: 'Estado',
      accessor: (term) => (
        <StatusBadge status={term.is_active} />
      )
    }
  ];

  // Form tabs
  const formTabs: FormTab[] = [
    {
      key: 'general',
      label: 'General',
      content: (
        <div className="space-y-4">
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
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <Label htmlFor="is_default">Condición por defecto</Label>
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <Label htmlFor="is_active">Condición activa</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

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

  const handleSubmit = async () => {
    await createPaymentTerm.mutateAsync(formData);
    setIsDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <StatsCard label="Total" value={stats.total} icon={<Wallet className="h-4 w-4" />} />
            <StatsCard label="Activos" value={stats.active} icon={<CheckCircle className="h-4 w-4" />} iconBgColor="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
            <StatsCard label="Con día fijo" value={stats.withFixedDay} icon={<Calendar className="h-4 w-4" />} iconBgColor="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
            <StatsCard label="Por defecto" value={stats.defaults} icon={<Clock className="h-4 w-4" />} iconBgColor="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600" />
          </div>

          {/* Filters */}
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar condiciones..."
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredTerms}
            columns={columns}
            loading={paymentTermsLoading}
            emptyIcon={<Wallet className="h-12 w-12" />}
            emptyMessage="No hay condiciones de pago configuradas"
            emptyDescription='Usa "Cargar datos iniciales" para crear condiciones básicas'
          />
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Nueva Condición de Pago"
        description="Define una nueva forma de pago"
        tabs={formTabs}
        onSubmit={handleSubmit}
        isSubmitting={createPaymentTerm.isPending}
        submitLabel="Crear Condición"
        size="sm"
      />
    </motion.div>
  );
};

export default PaymentTermsPanel;
