/**
 * Panel de gestión de Impuestos - Refactorizado
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Receipt, Percent, CheckCircle } from 'lucide-react';
import { useMaestros, Tax } from '@/hooks/erp/useMaestros';
import { motion } from 'framer-motion';
import { 
  DataTable, 
  Column, 
  SearchFilters, 
  FilterOption,
  EntityFormDialog,
  FormTab,
  StatusBadge,
  StatsCard
} from './shared';

export const TaxesPanel: React.FC = () => {
  const { taxes, taxesLoading, createTax } = useMaestros();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
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

  // Stats
  const stats = useMemo(() => ({
    total: taxes.length,
    active: taxes.filter(t => t.is_active).length,
    vatCount: taxes.filter(t => t.type === 'vat').length,
    defaultSales: taxes.filter(t => t.is_default_sales).length
  }), [taxes]);

  // Filtering
  const filteredTaxes = useMemo(() => {
    return taxes.filter(t => {
      const matchesSearch = !search || 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tax_code?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [taxes, search, typeFilter]);

  // Filter options for SearchFilters
  const filterOptions: FilterOption[] = [
    { 
      key: 'type', 
      label: 'Tipo', 
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'vat', label: 'IVA' },
        { value: 'withholding', label: 'Retención' },
        { value: 'other', label: 'Otros' }
      ],
      defaultValue: 'all'
    }
  ];

  // Table columns
  const columns: Column<Tax>[] = [
    { 
      key: 'name', 
      header: 'Nombre', 
      sortable: true,
      accessor: (tax) => <span className="font-medium">{tax.name}</span>
    },
    { 
      key: 'tax_code', 
      header: 'Código', 
      sortable: true,
      accessor: (tax) => <span className="font-mono text-sm">{tax.tax_code || '-'}</span>
    },
    { 
      key: 'rate', 
      header: 'Tasa', 
      sortable: true,
      className: 'text-right',
      accessor: (tax) => <span className="font-mono font-medium">{tax.rate}%</span>
    },
    { 
      key: 'type', 
      header: 'Tipo',
      accessor: (tax) => (
        <span className="text-sm">
          {tax.type === 'vat' ? 'IVA' : tax.type === 'withholding' ? 'Retención' : 'Otro'}
        </span>
      )
    },
    { 
      key: 'is_default_sales', 
      header: 'Def. Ventas',
      accessor: (tax) => tax.is_default_sales ? (
        <StatusBadge status="active" activeLabel="Sí" />
      ) : <span className="text-muted-foreground">-</span>
    },
    { 
      key: 'is_default_purchases', 
      header: 'Def. Compras',
      accessor: (tax) => tax.is_default_purchases ? (
        <StatusBadge status="active" activeLabel="Sí" />
      ) : <span className="text-muted-foreground">-</span>
    },
    { 
      key: 'is_active', 
      header: 'Estado',
      accessor: (tax) => (
        <StatusBadge status={tax.is_active} />
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
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <Label htmlFor="is_default_sales">Defecto para Ventas</Label>
              <Switch
                id="is_default_sales"
                checked={formData.is_default_sales}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default_sales: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <Label htmlFor="is_default_purchases">Defecto para Compras</Label>
              <Switch
                id="is_default_purchases"
                checked={formData.is_default_purchases}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default_purchases: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <Label htmlFor="is_active">Impuesto activo</Label>
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
      tax_code: '',
      rate: 21,
      type: 'vat',
      is_default_sales: false,
      is_default_purchases: false,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    await createTax.mutateAsync(formData);
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
              <Receipt className="h-5 w-5" />
              Impuestos (IVA)
            </CardTitle>
            <Button onClick={openNewDialog} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Impuesto
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <StatsCard label="Total" value={stats.total} icon={<Receipt className="h-4 w-4" />} />
            <StatsCard label="Activos" value={stats.active} icon={<CheckCircle className="h-4 w-4" />} iconBgColor="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
            <StatsCard label="IVA" value={stats.vatCount} icon={<Percent className="h-4 w-4" />} iconBgColor="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
            <StatsCard label="Def. Ventas" value={stats.defaultSales} icon={<Receipt className="h-4 w-4" />} iconBgColor="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600" />
          </div>

          {/* Filters */}
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar por nombre o código..."
            filters={filterOptions}
            filterValues={{ type: typeFilter }}
            onFilterChange={(key, value) => {
              if (key === 'type') setTypeFilter(String(value));
            }}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredTaxes}
            columns={columns}
            loading={taxesLoading}
            emptyIcon={<Receipt className="h-12 w-12" />}
            emptyMessage="No hay impuestos configurados"
            emptyDescription='Usa "Cargar datos iniciales" para crear los impuestos españoles'
          />
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Nuevo Impuesto"
        description="Configura un nuevo tipo de impuesto"
        tabs={formTabs}
        onSubmit={handleSubmit}
        isSubmitting={createTax.isPending}
        submitLabel="Crear Impuesto"
      />
    </motion.div>
  );
};

export default TaxesPanel;
