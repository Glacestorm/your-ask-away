import React, { useState, useEffect } from 'react';
import { 
  Save, RefreshCw, Euro, Package, Percent, 
  TrendingUp, Edit2, Check, X 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ModulePricing {
  id: string;
  module_key: string;
  module_name: string;
  base_price: number;
  perpetual_multiplier: number;
  monthly_divisor: number;
  min_discount: number;
  max_discount: number;
  category: string;
  description: string | null;
  is_active: boolean;
}

export const ModulePricingManager: React.FC = () => {
  const [modules, setModules] = useState<ModulePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<ModulePricing>>({});

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('obelixia_module_pricing')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      toast.error('Error cargando precios');
    } else {
      setModules(data || []);
    }
    setLoading(false);
  };

  const startEditing = (module: ModulePricing) => {
    setEditingId(module.id);
    setEditValues({
      base_price: module.base_price,
      min_discount: module.min_discount,
      max_discount: module.max_discount,
      description: module.description,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveChanges = async (moduleId: string) => {
    const { error } = await supabase
      .from('obelixia_module_pricing')
      .update({
        base_price: editValues.base_price,
        min_discount: editValues.min_discount,
        max_discount: editValues.max_discount,
        description: editValues.description,
      })
      .eq('id', moduleId);

    if (error) {
      toast.error('Error guardando cambios');
    } else {
      toast.success('Precio actualizado');
      setModules(modules.map(m => 
        m.id === moduleId ? { ...m, ...editValues } : m
      ));
      cancelEditing();
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      core: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      horizontal: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      vertical: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      enterprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    };
    return <Badge className={styles[category] || styles.horizontal}>{category}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Euro className="w-5 h-5 text-purple-400" />
            Gestión de Precios de Módulos
          </h3>
          <p className="text-slate-400 text-sm">
            Administra los precios base y descuentos de cada módulo
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchModules}
          className="border-slate-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">Módulo</TableHead>
                <TableHead className="text-slate-400">Categoría</TableHead>
                <TableHead className="text-slate-400 text-right">Precio Base (Anual)</TableHead>
                <TableHead className="text-slate-400 text-right">Perpetua (5x)</TableHead>
                <TableHead className="text-slate-400 text-right">Mensual (/10)</TableHead>
                <TableHead className="text-slate-400 text-center">Descuento Max</TableHead>
                <TableHead className="text-slate-400 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : modules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                    No hay módulos configurados
                  </TableCell>
                </TableRow>
              ) : (
                modules.map(module => (
                  <TableRow key={module.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{module.module_name}</p>
                        <p className="text-xs text-slate-500">{module.module_key}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(module.category)}</TableCell>
                    <TableCell className="text-right">
                      {editingId === module.id ? (
                        <Input
                          type="number"
                          value={editValues.base_price}
                          onChange={e => setEditValues({ ...editValues, base_price: Number(e.target.value) })}
                          className="w-28 bg-slate-800 border-slate-600 text-right"
                        />
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          {formatPrice(module.base_price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      {formatPrice(module.base_price * module.perpetual_multiplier)}
                    </TableCell>
                    <TableCell className="text-right text-slate-300">
                      {formatPrice(module.base_price / module.monthly_divisor)}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === module.id ? (
                        <Input
                          type="number"
                          value={editValues.max_discount}
                          onChange={e => setEditValues({ ...editValues, max_discount: Number(e.target.value) })}
                          className="w-20 bg-slate-800 border-slate-600 text-center"
                        />
                      ) : (
                        <Badge variant="outline" className="border-slate-600">
                          {module.max_discount}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {editingId === module.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            size="sm" 
                            onClick={() => saveChanges(module.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 h-8 w-8 p-0"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={cancelEditing}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => startEditing(module)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Módulos Core</p>
                <p className="text-lg font-bold text-white">
                  {formatPrice(modules.filter(m => m.category === 'core').reduce((sum, m) => sum + m.base_price, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-emerald-400" />
              <div>
                <p className="text-sm text-slate-400">Módulos Horizontal</p>
                <p className="text-lg font-bold text-white">
                  {formatPrice(modules.filter(m => m.category === 'horizontal').reduce((sum, m) => sum + m.base_price, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Percent className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-sm text-slate-400">Módulos Enterprise</p>
                <p className="text-lg font-bold text-white">
                  {formatPrice(modules.filter(m => m.category === 'enterprise').reduce((sum, m) => sum + m.base_price, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
