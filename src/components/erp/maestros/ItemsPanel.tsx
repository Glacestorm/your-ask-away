/**
 * Panel de gestión de Artículos/Servicios
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Edit,
  Package,
  Wrench,
  Barcode
} from 'lucide-react';
import { useMaestros, Item } from '@/hooks/erp/useMaestros';

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

  const filteredItems = items.filter(i => {
    const matchesSearch = 
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()) ||
      (i.barcode?.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || i.item_type === typeFilter;
    const matchesActive = showInactive || i.is_active;
    return matchesSearch && matchesType && matchesActive;
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(price);
  };

  return (
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
        
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="product">Productos</SelectItem>
              <SelectItem value="service">Servicios</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-items"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-items" className="text-sm">
              Inactivos
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {itemsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay artículos{search && ' que coincidan con la búsqueda'}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Familia</TableHead>
                  <TableHead className="text-right">P. Coste</TableHead>
                  <TableHead className="text-right">P. Venta</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const family = families.find(f => f.id === item.family_id);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.barcode && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Barcode className="h-3 w-3" />
                              {item.barcode}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {item.item_type === 'product' ? (
                            <><Package className="h-3 w-3" /> Producto</>
                          ) : (
                            <><Wrench className="h-3 w-3" /> Servicio</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{family?.name || '-'}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatPrice(item.standard_cost)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatPrice(item.sale_price)}
                      </TableCell>
                      <TableCell>
                        {item.is_stocked ? (
                          <Badge variant="secondary" className="text-xs">Stockeable</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? 'default' : 'secondary'}>
                          {item.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Editar Artículo' : 'Nuevo Artículo'}
            </DialogTitle>
            <DialogDescription>
              {selectedItem 
                ? 'Modifica los datos del artículo'
                : 'Introduce los datos del nuevo artículo o servicio'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="prices">Precios</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
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
                      value={formData.family_id} 
                      onValueChange={(v) => setFormData({ ...formData, family_id: v })}
                    >
                      <SelectTrigger id="family_id">
                        <SelectValue placeholder="Seleccionar familia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin familia</SelectItem>
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

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Artículo activo</Label>
                </div>
              </TabsContent>

              <TabsContent value="prices" className="space-y-4 mt-4">
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
                      value={formData.tax_id} 
                      onValueChange={(v) => setFormData({ ...formData, tax_id: v })}
                    >
                      <SelectTrigger id="tax_id">
                        <SelectValue placeholder="Seleccionar impuesto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sin impuesto</SelectItem>
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
                      onValueChange={(v) => setFormData({ ...formData, cost_method: v as any })}
                    >
                      <SelectTrigger id="cost_method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avg">Precio Medio</SelectItem>
                        <SelectItem value="fifo">FIFO</SelectItem>
                        <SelectItem value="lifo">LIFO</SelectItem>
                        <SelectItem value="standard">Estándar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Gestionar Stock</Label>
                      <p className="text-sm text-muted-foreground">
                        Controlar niveles de inventario para este artículo
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_stocked}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_stocked: checked })}
                    />
                  </div>

                  {formData.is_stocked && (
                    <>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Trazabilidad por Lotes</Label>
                          <p className="text-sm text-muted-foreground">
                            Gestionar lotes de fabricación/caducidad
                          </p>
                        </div>
                        <Switch
                          checked={formData.track_lots}
                          onCheckedChange={(checked) => setFormData({ ...formData, track_lots: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base">Trazabilidad por Serie</Label>
                          <p className="text-sm text-muted-foreground">
                            Control individual por número de serie
                          </p>
                        </div>
                        <Switch
                          checked={formData.track_serials}
                          onCheckedChange={(checked) => setFormData({ ...formData, track_serials: checked })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createItem.isPending || updateItem.isPending}
              >
                {selectedItem ? 'Guardar Cambios' : 'Crear Artículo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ItemsPanel;
