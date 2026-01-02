/**
 * Panel de gestión de Ubicaciones de Almacén
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Plus,
  MapPin,
  ChevronDown,
  Trash2,
  Warehouse
} from 'lucide-react';
import { useMaestros, Warehouse as WarehouseType } from '@/hooks/erp/useMaestros';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  zone?: string | null;
  aisle?: string | null;
  rack?: string | null;
  level?: string | null;
  is_active: boolean;
  created_at: string;
}

export const WarehouseLocationsPanel: React.FC = () => {
  const { warehouses, warehousesLoading, createWarehouse } = useMaestros();
  const { currentCompany } = useERPContext();
  const companyId = currentCompany?.id;
  
  const [locations, setLocations] = useState<Record<string, WarehouseLocation[]>>({});
  const [loadingLocations, setLoadingLocations] = useState<Record<string, boolean>>({});
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(new Set());
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    zone: '',
    aisle: '',
    rack: '',
    level: ''
  });

  // Load locations for a warehouse
  const loadLocations = async (warehouseId: string) => {
    if (loadingLocations[warehouseId]) return;
    
    setLoadingLocations(prev => ({ ...prev, [warehouseId]: true }));
    
    try {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('code');
      
      if (error) throw error;
      setLocations(prev => ({ ...prev, [warehouseId]: (data || []) as unknown as WarehouseLocation[] }));
    } catch (err) {
      console.error('[WarehouseLocationsPanel] Error loading locations:', err);
      toast.error('Error al cargar ubicaciones');
    } finally {
      setLoadingLocations(prev => ({ ...prev, [warehouseId]: false }));
    }
  };

  const toggleWarehouse = (warehouseId: string) => {
    const newExpanded = new Set(expandedWarehouses);
    if (newExpanded.has(warehouseId)) {
      newExpanded.delete(warehouseId);
    } else {
      newExpanded.add(warehouseId);
      if (!locations[warehouseId]) {
        loadLocations(warehouseId);
      }
    }
    setExpandedWarehouses(newExpanded);
  };

  const openNewDialog = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    setFormData({
      code: '',
      name: '',
      zone: '',
      aisle: '',
      rack: '',
      level: ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('warehouse_locations')
        .insert([{
          warehouse_id: selectedWarehouseId,
          code: formData.code.toUpperCase(),
          name: formData.name,
          zone: formData.zone || null,
          aisle: formData.aisle || null,
          rack: formData.rack || null,
          level: formData.level || null,
          is_active: true
        }] as any);
      
      if (error) throw error;
      
      toast.success('Ubicación creada');
      setIsDialogOpen(false);
      loadLocations(selectedWarehouseId);
    } catch (err) {
      console.error('[WarehouseLocationsPanel] Error creating location:', err);
      toast.error('Error al crear ubicación');
    }
  };

  const handleDeleteLocation = async (warehouseId: string, locationId: string) => {
    if (!confirm('¿Eliminar esta ubicación?')) return;
    
    try {
      const { error } = await supabase
        .from('warehouse_locations')
        .delete()
        .eq('id', locationId);
      
      if (error) throw error;
      
      toast.success('Ubicación eliminada');
      loadLocations(warehouseId);
    } catch (err) {
      console.error('[WarehouseLocationsPanel] Error deleting location:', err);
      toast.error('Error al eliminar ubicación');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Ubicaciones de Almacén
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {warehousesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Primero debes crear almacenes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warehouses.map((warehouse) => (
              <Collapsible 
                key={warehouse.id}
                open={expandedWarehouses.has(warehouse.id)}
                onOpenChange={() => toggleWarehouse(warehouse.id)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Warehouse className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{warehouse.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{warehouse.code}</p>
                        </div>
                        {warehouse.is_default && (
                          <Badge variant="secondary">Principal</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {locations[warehouse.id]?.length || 0} ubicaciones
                        </Badge>
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          expandedWarehouses.has(warehouse.id) ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t p-4">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-muted-foreground">
                          Gestiona las ubicaciones dentro de este almacén
                        </p>
                        <Button size="sm" onClick={() => openNewDialog(warehouse.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Ubicación
                        </Button>
                      </div>
                      
                      {loadingLocations[warehouse.id] ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : !locations[warehouse.id] || locations[warehouse.id].length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay ubicaciones</p>
                        </div>
                      ) : (
                        <ScrollArea className="h-[250px]">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Zona</TableHead>
                                <TableHead>Pasillo</TableHead>
                                <TableHead>Estante</TableHead>
                                <TableHead>Nivel</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {locations[warehouse.id].map((loc) => (
                                <TableRow key={loc.id}>
                                  <TableCell className="font-mono text-sm">{loc.code}</TableCell>
                                  <TableCell>{loc.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{loc.zone || '-'}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{loc.aisle || '-'}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{loc.rack || '-'}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{loc.level || '-'}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDeleteLocation(warehouse.id, loc.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Ubicación</DialogTitle>
            <DialogDescription>
              Define una ubicación física dentro del almacén
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="A01-01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ubicación A1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zona</Label>
                <Input
                  id="zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Zona A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aisle">Pasillo</Label>
                <Input
                  id="aisle"
                  value={formData.aisle}
                  onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                  placeholder="01"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rack">Estante</Label>
                <Input
                  id="rack"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  placeholder="A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <Input
                  id="level"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Crear Ubicación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default WarehouseLocationsPanel;
