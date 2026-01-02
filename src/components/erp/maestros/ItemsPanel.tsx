/**
 * Panel de gestión de Artículos/Servicios - Refactorizado
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Package,
  Wrench,
  Barcode,
  CheckCircle,
  Edit
} from 'lucide-react';
import { useMaestros, Item } from '@/hooks/erp/useMaestros';
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

export const ItemsPanel: React.FC = () => {
  const { 
    items, 
    itemsLoading, 
    createItem, 
    updateItem,
    families,
    taxes 
  } = useMaestros();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    item_type: 'product' as 'product' | 'service',
    family_id: '',
    unit: 'UND',
    barcode: '',
    is_stocked: true,
    track_lots: false,
    track_serials: false,
    tax_id: '',
    cost_method: 'avg' as 'avg' | 'fifo' | 'lifo' | 'standard',
    standard_cost: 0,
    sale_price: 0,
    is_active: true
  });

  // Stats
  const stats = useMemo(() => ({
    total: items.length,
    products: items.filter(i => i.item_type === 'product').length,
    services: items.filter(i => i.item_type === 'service').length,
    active: items.filter(i => i.is_active).length
  }), [items]);

  // Filtering
  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchesSearch = !search || 
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        i.barcode?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || i.item_type === typeFilter;
      const matchesActive = showInactive || i.is_active;
      return matchesSearch && matchesType && matchesActive;
    });
  }, [items, search, typeFilter, showInactive]);

  // Filter options
  const filterOptions: FilterOption[] = [
    { 
      key: 'type', 
      label: 'Tipo', 
      type: 'select',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'product', label: 'Productos' },
        { value: 'service', label: 'Servicios' }
      ],
      defaultValue: 'all'
    },
    {
      key: 'showInactive',
      label: 'Inactivos',
      type: 'switch',
      defaultValue: false
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price);
  };

  // Table columns
  const columns: Column<Item>[] = [
    { 
      key: 'sku', 
      header: 'SKU', 
      sortable: true,
      accessor: (item) => <span className="font-mono text-sm">{item.sku}</span>
    },
    { 
      key: 'name', 
      header: 'Nombre', 
      sortable: true,
      accessor: (item) => (
        <div>
          <p className="font-medium">{item.name}</p>
          {item.barcode && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Barcode className="h-3 w-3" />
              {item.barcode}
            </p>
          )}
        </div>
      )
    },
    { 
      key: 'item_type', 
      header: 'Tipo',
      accessor: (item) => (
        <span className="text-sm flex items-center gap-1">
          {item.item_type === 'product' ? <Package className="h-3 w-3" /> : <Wrench className="h-3 w-3" />}
          {item.item_type === 'product' ? 'Producto' : 'Servicio'}
        </span>
      )
    },
    { 
      key: 'family_id', 
      header: 'Familia',
      accessor: (item) => {
        const family = families.find(f => f.id === item.family_id);
        return <span className="text-sm">{family?.name || '-'}</span>;
      }
    },
    { 
      key: 'standard_cost', 
      header: 'P. Coste', 
      sortable: true,
      className: 'text-right',
      accessor: (item) => <span className="font-mono text-sm">{formatPrice(item.standard_cost)}</span>
    },
    { 
      key: 'sale_price', 
      header: 'P. Venta', 
      sortable: true,
      className: 'text-right',
      accessor: (item) => <span className="font-mono text-sm font-medium">{formatPrice(item.sale_price)}</span>
    },
    { 
      key: 'is_stocked', 
      header: 'Stock',
      accessor: (item) => item.is_stocked ? (
        <StatusBadge status="active" activeLabel="Stockeable" size="sm" />
      ) : <span className="text-muted-foreground text-xs">No</span>
    },
    { 
      key: 'is_active', 
      header: 'Estado',
      accessor: (item) => (
        <StatusBadge status={item.is_active} />
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="ART001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item_type">Tipo *</Label>
              <Select 
                value={formData.item_type} 
                onValueChange={(v) => setFormData({ ...formData, item_type: v as 'product' | 'service' })}
              >
                <SelectTrigger id="item_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value.toUpperCase() })}
                placeholder="UND"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre del artículo"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="family_id">Familia</Label>
              <Select 
                value={formData.family_id || '__none__'} 
                onValueChange={(v) => setFormData({ ...formData, family_id: v === '__none__' ? '' : v })}
              >
                <SelectTrigger id="family_id">
                  <SelectValue placeholder="Seleccionar familia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin familia</SelectItem>
                  {families.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="8421234567890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción del artículo..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Artículo activo</Label>
          </div>
        </div>
      )
    },
    {
      key: 'prices',
      label: 'Precios',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standard_cost">Precio de Coste</Label>
              <Input
                id="standard_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.standard_cost}
                onChange={(e) => setFormData({ ...formData, standard_cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Precio de Venta</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id">Impuesto (IVA)</Label>
              <Select 
                value={formData.tax_id || '__none__'} 
                onValueChange={(v) => setFormData({ ...formData, tax_id: v === '__none__' ? '' : v })}
              >
                <SelectTrigger id="tax_id">
                  <SelectValue placeholder="Seleccionar impuesto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin impuesto</SelectItem>
                  {taxes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.rate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_method">Método de Coste</Label>
              <Select 
                value={formData.cost_method} 
                onValueChange={(v) => setFormData({ ...formData, cost_method: v as 'avg' | 'fifo' | 'lifo' | 'standard' })}
              >
                <SelectTrigger id="cost_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avg">Promedio</SelectItem>
                  <SelectItem value="fifo">FIFO</SelectItem>
                  <SelectItem value="lifo">LIFO</SelectItem>
                  <SelectItem value="standard">Estándar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="is_stocked" className="text-base">Artículo Stockeable</Label>
              <p className="text-sm text-muted-foreground">Gestionar inventario para este artículo</p>
            </div>
            <Switch
              id="is_stocked"
              checked={formData.is_stocked}
              onCheckedChange={(checked) => setFormData({ ...formData, is_stocked: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="track_lots" className="text-base">Trazabilidad por Lotes</Label>
              <p className="text-sm text-muted-foreground">Controlar entradas/salidas por lote</p>
            </div>
            <Switch
              id="track_lots"
              checked={formData.track_lots}
              onCheckedChange={(checked) => setFormData({ ...formData, track_lots: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="track_serials" className="text-base">Trazabilidad por Series</Label>
              <p className="text-sm text-muted-foreground">Controlar unidades individuales por número de serie</p>
            </div>
            <Switch
              id="track_serials"
              checked={formData.track_serials}
              onCheckedChange={(checked) => setFormData({ ...formData, track_serials: checked })}
            />
          </div>
        </div>
      )
    }
  ];

  const openNewDialog = () => {
    setSelectedItem(null);
    setFormData({
      sku: '',
      name: '',
      description: '',
      item_type: 'product',
      family_id: '',
      unit: 'UND',
      barcode: '',
      is_stocked: true,
      track_lots: false,
      track_serials: false,
      tax_id: taxes.find(t => t.is_default_sales)?.id || '',
      cost_method: 'avg',
      standard_cost: 0,
      sale_price: 0,
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      sku: item.sku,
      name: item.name,
      description: item.description || '',
      item_type: item.item_type,
      family_id: item.family_id || '',
      unit: item.unit,
      barcode: item.barcode || '',
      is_stocked: item.is_stocked,
      track_lots: item.track_lots,
      track_serials: item.track_serials,
      tax_id: item.tax_id || '',
      cost_method: item.cost_method,
      standard_cost: item.standard_cost,
      sale_price: item.sale_price,
      is_active: item.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const submitData = {
      ...formData,
      family_id: formData.family_id || null,
      tax_id: formData.tax_id || null
    };
    
    if (selectedItem) {
      await updateItem.mutateAsync({ id: selectedItem.id, ...submitData });
    } else {
      await createItem.mutateAsync(submitData);
    }
    
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
              <Package className="h-5 w-5" />
              Artículos y Servicios
            </CardTitle>
            <Button onClick={openNewDialog} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Artículo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <StatsCard label="Total" value={stats.total} icon={<Package className="h-4 w-4" />} />
            <StatsCard label="Productos" value={stats.products} icon={<Package className="h-4 w-4" />} iconBgColor="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
            <StatsCard label="Servicios" value={stats.services} icon={<Wrench className="h-4 w-4" />} iconBgColor="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600" />
            <StatsCard label="Activos" value={stats.active} icon={<CheckCircle className="h-4 w-4" />} iconBgColor="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
          </div>

          {/* Filters */}
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar por nombre, SKU o código de barras..."
            filters={filterOptions}
            filterValues={{ type: typeFilter, showInactive }}
            onFilterChange={(key, value) => {
              if (key === 'type') setTypeFilter(String(value));
              if (key === 'showInactive') setShowInactive(Boolean(value));
            }}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredItems}
            columns={columns}
            loading={itemsLoading}
            emptyIcon={<Package className="h-12 w-12" />}
            emptyMessage="No hay artículos"
            emptyDescription={search ? 'que coincidan con la búsqueda' : undefined}
            onRowDoubleClick={openEditDialog}
            rowActions={(item) => (
              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          />
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={selectedItem ? 'Editar Artículo' : 'Nuevo Artículo'}
        description={selectedItem ? 'Modifica los datos del artículo' : 'Introduce los datos del nuevo artículo o servicio'}
        tabs={formTabs}
        onSubmit={handleSubmit}
        isSubmitting={createItem.isPending || updateItem.isPending}
        submitLabel={selectedItem ? 'Guardar' : 'Crear Artículo'}
        size="lg"
      />
    </motion.div>
  );
};

export default ItemsPanel;
