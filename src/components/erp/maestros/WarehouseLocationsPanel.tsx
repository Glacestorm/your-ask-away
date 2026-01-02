/**
 * Panel de gestión de Ubicaciones de Almacén - Refactorizado
 * Con animaciones y mejor UX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Warehouse,
  Layers
} from 'lucide-react';
import { useMaestros, Warehouse as WarehouseType } from '@/hooks/erp/useMaestros';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { EntityFormDialog } from './shared/EntityFormDialog';
import { ActionButtons } from './shared/ActionButtons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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

const INITIAL_FORM = {
  code: '',
  name: '',
  zone: '',
  aisle: '',
  rack: '',
  level: ''
};

export const WarehouseLocationsPanel: React.FC = () => {
  const { warehouses, warehousesLoading } = useMaestros();
  const { currentCompany } = useERPContext();
  const companyId = currentCompany?.id;
  
  const [locations, setLocations] = useState<Record<string, WarehouseLocation[]>>({});
  const [loadingLocations, setLoadingLocations] = useState<Record<string, boolean>>({});
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<string>>(new Set());
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load locations for a warehouse
  const loadLocations = useCallback(async (warehouseId: string) => {
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
  }, [loadingLocations]);

  const toggleWarehouse = useCallback((warehouseId: string) => {
    setExpandedWarehouses(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(warehouseId)) {
        newExpanded.delete(warehouseId);
      } else {
        newExpanded.add(warehouseId);
        if (!locations[warehouseId]) {
          loadLocations(warehouseId);
        }
      }
      return newExpanded;
    });
  }, [locations, loadLocations]);

  const openNewDialog = useCallback((warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    setFormData(INITIAL_FORM);
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedWarehouseId, formData, loadLocations]);

  const handleDeleteLocation = useCallback(async (warehouseId: string, locationId: string, locationName: string) => {
    if (!confirm(`¿Eliminar la ubicación "${locationName}"?`)) return;
    
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
  }, [loadLocations]);

  // Calculate total locations
  const totalLocations = Object.values(locations).reduce((sum, locs) => sum + locs.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicaciones de Almacén
              </CardTitle>
              <CardDescription>
                Gestiona las ubicaciones físicas dentro de cada almacén
              </CardDescription>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Layers className="h-3 w-3" />
              {totalLocations} ubicaciones
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {warehousesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No hay almacenes configurados</p>
              <p className="text-sm mt-1">Primero debes crear almacenes en la pestaña "Almacenes"</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {warehouses.map((warehouse, index) => (
                  <motion.div
                    key={warehouse.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Collapsible 
                      open={expandedWarehouses.has(warehouse.id)}
                      onOpenChange={() => toggleWarehouse(warehouse.id)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-amber-500/10">
                                <Warehouse className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium">{warehouse.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">{warehouse.code}</p>
                              </div>
                              {warehouse.is_default && (
                                <Badge variant="secondary" className="text-xs">Principal</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {locations[warehouse.id]?.length || 0} ubicaciones
                              </Badge>
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                expandedWarehouses.has(warehouse.id) && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t"
                          >
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-muted-foreground">
                                  Ubicaciones dentro de este almacén
                                </p>
                                <Button size="sm" onClick={() => openNewDialog(warehouse.id)} className="gap-1">
                                  <Plus className="h-4 w-4" />
                                  Nueva
                                </Button>
                              </div>
                              
                              {loadingLocations[warehouse.id] ? (
                                <div className="flex items-center justify-center py-6">
                                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                                </div>
                              ) : !locations[warehouse.id] || locations[warehouse.id].length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No hay ubicaciones definidas</p>
                                </div>
                              ) : (
                                <ScrollArea className="h-[250px]">
                                  <div className="grid gap-2">
                                    {locations[warehouse.id].map((loc, locIndex) => (
                                      <motion.div
                                        key={loc.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: locIndex * 0.03 }}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="p-1.5 rounded bg-muted">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-mono text-sm font-medium">{loc.code}</span>
                                              <span className="text-sm">{loc.name}</span>
                                            </div>
                                            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                              {loc.zone && <span>Zona: {loc.zone}</span>}
                                              {loc.aisle && <span>Pasillo: {loc.aisle}</span>}
                                              {loc.rack && <span>Estante: {loc.rack}</span>}
                                              {loc.level && <span>Nivel: {loc.level}</span>}
                                            </div>
                                          </div>
                                        </div>
                                        <ActionButtons
                                          onDelete={() => handleDeleteLocation(warehouse.id, loc.id, loc.name)}
                                          size="sm"
                                        />
                                      </motion.div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </motion.div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title="Nueva Ubicación"
        description="Define una ubicación física dentro del almacén"
        onSubmit={handleSubmit}
        submitLabel="Crear Ubicación"
        isSubmitting={isSubmitting}
        size="md"
      >
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
      </EntityFormDialog>
    </motion.div>
  );
};

export default WarehouseLocationsPanel;
