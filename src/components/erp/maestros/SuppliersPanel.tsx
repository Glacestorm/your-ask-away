/**
 * Panel de gestión de Proveedores - Refactorizado
 * Usa componentes compartidos para mejor mantenibilidad
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Truck } from 'lucide-react';
import { useMaestros, Supplier } from '@/hooks/erp/useMaestros';
import { DataTable, Column } from './shared/DataTable';
import { SearchFilters, FilterOption } from './shared/SearchFilters';
import { EntityFormDialog } from './shared/EntityFormDialog';
import { StatusBadge } from './shared/StatusBadge';
import { ActionButtons } from './shared/ActionButtons';
import { motion } from 'framer-motion';

const INITIAL_FORM = {
  code: '',
  legal_name: '',
  tax_id: '',
  email: '',
  phone: '',
  notes: '',
  is_active: true
};

export const SuppliersPanel: React.FC = () => {
  const { suppliers, suppliersLoading, createSupplier, updateSupplier, deleteSupplier } = useMaestros();
  
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Memoized filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = search.toLowerCase().trim();
      const matchesSearch = !q || 
        s.legal_name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.tax_id?.toLowerCase().includes(q));
      const matchesActive = showInactive || s.is_active;
      return matchesSearch && matchesActive;
    });
  }, [suppliers, search, showInactive]);

  // Filter configuration
  const filters: FilterOption[] = useMemo(() => [
    { key: 'showInactive', label: 'Mostrar inactivos', type: 'switch', defaultValue: false }
  ], []);

  const filterValues = useMemo(() => ({
    showInactive
  }), [showInactive]);

  const handleFilterChange = useCallback((key: string, value: string | boolean) => {
    if (key === 'showInactive') {
      setShowInactive(value as boolean);
    }
  }, []);

  // Table columns
  const columns: Column<Supplier>[] = useMemo(() => [
    {
      key: 'code',
      header: 'Código',
      accessor: (row) => <span className="font-mono text-sm">{row.code}</span>,
      sortable: true
    },
    {
      key: 'legal_name',
      header: 'Nombre',
      accessor: (row) => <span className="font-medium">{row.legal_name}</span>,
      sortable: true
    },
    {
      key: 'tax_id',
      header: 'CIF/NIF',
      accessor: (row) => <span className="font-mono text-sm">{row.tax_id || '-'}</span>,
      sortable: true
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (row) => <span className="text-sm">{row.email || '-'}</span>
    },
    {
      key: 'phone',
      header: 'Teléfono',
      accessor: (row) => <span className="text-sm">{row.phone || '-'}</span>
    },
    {
      key: 'is_active',
      header: 'Estado',
      accessor: (row) => <StatusBadge status={row.is_active} />
    }
  ], []);

  // Dialog handlers
  const openNewDialog = useCallback(() => {
    setSelectedSupplier(null);
    setFormData(INITIAL_FORM);
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      code: supplier.code,
      legal_name: supplier.legal_name,
      tax_id: supplier.tax_id || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      notes: supplier.notes || '',
      is_active: supplier.is_active
    });
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedSupplier) {
      await updateSupplier.mutateAsync({ id: selectedSupplier.id, ...formData });
    } else {
      await createSupplier.mutateAsync(formData);
    }
    setIsDialogOpen(false);
  }, [selectedSupplier, formData, updateSupplier, createSupplier]);

  const handleDelete = useCallback(async (supplier: Supplier) => {
    if (!confirm(`¿Eliminar el proveedor "${supplier.legal_name}"?`)) return;
    await deleteSupplier.mutateAsync(supplier.id);
  }, [deleteSupplier]);

  // Row actions renderer
  const renderRowActions = useCallback((row: Supplier) => (
    <ActionButtons
      onEdit={() => openEditDialog(row)}
      onDelete={() => handleDelete(row)}
      size="sm"
    />
  ), [openEditDialog, handleDelete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Proveedores
            </CardTitle>
            <Button onClick={openNewDialog} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Proveedor
            </Button>
          </div>
          
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar por nombre, código o CIF..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredSuppliers}
            columns={columns}
            loading={suppliersLoading}
            emptyIcon={<Truck className="h-12 w-12" />}
            emptyMessage="No hay proveedores"
            emptyDescription={search ? 'que coincidan con la búsqueda' : undefined}
            onRowDoubleClick={openEditDialog}
            rowActions={renderRowActions}
            exportFilename="proveedores"
          />
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={selectedSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        description={selectedSupplier 
          ? 'Modifica los datos del proveedor'
          : 'Introduce los datos del nuevo proveedor'
        }
        onSubmit={handleSubmit}
        submitLabel={selectedSupplier ? 'Guardar Cambios' : 'Crear Proveedor'}
        isSubmitting={createSupplier.isPending || updateSupplier.isPending}
        size="md"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="PROV001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax_id">CIF/NIF</Label>
            <Input
              id="tax_id"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
              placeholder="B12345678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="legal_name">Razón Social *</Label>
          <Input
            id="legal_name"
            value={formData.legal_name}
            onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
            placeholder="Proveedor S.L."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contacto@proveedor.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+34 912 345 678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observaciones..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
          />
          <Label htmlFor="is_active">Proveedor activo</Label>
        </div>
      </EntityFormDialog>
    </motion.div>
  );
};

export default SuppliersPanel;
