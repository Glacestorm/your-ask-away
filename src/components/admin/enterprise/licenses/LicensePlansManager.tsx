/**
 * LicensePlansManager - CRUD completo para planes de licencia
 * Enterprise SaaS 2025-2026
 */

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Crown, 
  Zap, 
  Building2,
  DollarSign,
  Users,
  Laptop,
  Calendar,
  Sparkles,
  Check,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { LicensePlan, FeatureFlags } from '@/types/license';

interface PlanFormData {
  code: string;
  name: string;
  description: string;
  price_monthly: number | null;
  price_yearly: number | null;
  max_users_default: number;
  max_devices_default: number;
  max_api_calls_month: number | null;
  trial_days: number;
  is_active: boolean;
  display_order: number;
  features: FeatureFlags;
}

const DEFAULT_PLAN: PlanFormData = {
  code: '',
  name: '',
  description: '',
  price_monthly: null,
  price_yearly: null,
  max_users_default: 5,
  max_devices_default: 3,
  max_api_calls_month: null,
  trial_days: 14,
  is_active: true,
  display_order: 0,
  features: {
    'core.dashboard': true,
    'core.reports': true,
    'core.basic_analytics': true,
    'premium.advanced_analytics': false,
    'premium.api_access': false,
    'premium.integrations': false,
    'premium.ai_assistant': false,
    'enterprise.sso': false,
    'enterprise.audit_logs': false,
    'enterprise.custom_branding': false,
    'enterprise.priority_support': false,
  }
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-5 w-5" />,
  professional: <Crown className="h-5 w-5" />,
  enterprise: <Building2 className="h-5 w-5" />,
};

const FEATURE_CATEGORIES = [
  {
    name: 'Core',
    prefix: 'core.',
    features: [
      { key: 'core.dashboard', label: 'Dashboard' },
      { key: 'core.reports', label: 'Reportes' },
      { key: 'core.basic_analytics', label: 'Analítica Básica' },
    ]
  },
  {
    name: 'Premium',
    prefix: 'premium.',
    features: [
      { key: 'premium.advanced_analytics', label: 'Analítica Avanzada' },
      { key: 'premium.api_access', label: 'Acceso API' },
      { key: 'premium.integrations', label: 'Integraciones' },
      { key: 'premium.ai_assistant', label: 'Asistente IA' },
    ]
  },
  {
    name: 'Enterprise',
    prefix: 'enterprise.',
    features: [
      { key: 'enterprise.sso', label: 'SSO' },
      { key: 'enterprise.audit_logs', label: 'Logs de Auditoría' },
      { key: 'enterprise.custom_branding', label: 'Branding Personalizado' },
      { key: 'enterprise.priority_support', label: 'Soporte Prioritario' },
    ]
  }
];

export function LicensePlansManager() {
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_PLAN);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('license_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as LicensePlan[]);
    } catch (err) {
      console.error('Error fetching plans:', err);
      toast.error('Error al cargar planes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Open create dialog
  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      ...DEFAULT_PLAN,
      display_order: plans.length + 1
    });
    setIsDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (plan: LicensePlan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      name: plan.name,
      description: plan.description || '',
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users_default: plan.max_users_default,
      max_devices_default: plan.max_devices_default,
      max_api_calls_month: plan.max_api_calls_month,
      trial_days: plan.trial_days,
      is_active: plan.is_active,
      display_order: plan.display_order,
      features: plan.features || DEFAULT_PLAN.features,
    });
    setIsDialogOpen(true);
  };

  // Save plan
  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Código y nombre son requeridos');
      return;
    }

    setIsSaving(true);
    try {
      const planData = {
        code: formData.code.toLowerCase().replace(/\s+/g, '_'),
        name: formData.name,
        description: formData.description || null,
        price_monthly: formData.price_monthly,
        price_yearly: formData.price_yearly,
        max_users_default: formData.max_users_default,
        max_devices_default: formData.max_devices_default,
        max_api_calls_month: formData.max_api_calls_month,
        trial_days: formData.trial_days,
        is_active: formData.is_active,
        display_order: formData.display_order,
        features: formData.features,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('license_plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan actualizado');
      } else {
        const { error } = await supabase
          .from('license_plans')
          .insert([planData]);

        if (error) throw error;
        toast.success('Plan creado');
      }

      setIsDialogOpen(false);
      fetchPlans();
    } catch (err) {
      console.error('Error saving plan:', err);
      toast.error('Error al guardar plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete plan
  const handleDelete = async () => {
    if (!deletingPlanId) return;

    try {
      const { error } = await supabase
        .from('license_plans')
        .delete()
        .eq('id', deletingPlanId);

      if (error) throw error;
      toast.success('Plan eliminado');
      setIsDeleteDialogOpen(false);
      setDeletingPlanId(null);
      fetchPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
      toast.error('Error al eliminar plan');
    }
  };

  // Toggle feature
  const toggleFeature = (featureKey: string) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [featureKey]: !prev.features[featureKey]
      }
    }));
  };

  const getPlanIcon = (code: string) => {
    return PLAN_ICONS[code] || <Sparkles className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Planes de Licencia</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona los planes disponibles y sus precios
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No hay planes configurados</p>
            <Button onClick={handleCreate} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg",
                !plan.is_active && "opacity-60"
              )}
            >
              {!plan.is_active && (
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary">Inactivo</Badge>
                </div>
              )}
              
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {getPlanIcon(plan.code)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{plan.code}</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="flex items-baseline gap-2">
                  {plan.price_monthly !== null ? (
                    <>
                      <span className="text-3xl font-bold">${plan.price_monthly}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">Precio personalizado</span>
                  )}
                </div>
                
                {plan.price_yearly !== null && (
                  <p className="text-sm text-muted-foreground">
                    ${plan.price_yearly}/año
                    {plan.price_monthly && (
                      <Badge variant="outline" className="ml-2 text-green-600">
                        Ahorra {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%
                      </Badge>
                    )}
                  </p>
                )}

                {/* Limits */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.max_users_default} usuarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.max_devices_default} dispositivos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.trial_days} días trial</span>
                  </div>
                  {plan.max_api_calls_month && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span>{(plan.max_api_calls_month / 1000).toFixed(0)}K API/mes</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Features Preview */}
                <div className="space-y-1">
                  {Object.entries(plan.features || {})
                    .filter(([, enabled]) => enabled === true)
                    .slice(0, 4)
                    .map(([key]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">{key.split('.')[1]?.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(plan)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeletingPlanId(plan.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plan' : 'Nuevo Plan de Licencia'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? 'Modifica los detalles y precios del plan'
                : 'Configura un nuevo plan con sus características y precios'
              }
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 px-1">
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="ej: professional"
                    disabled={!!editingPlan}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ej: Professional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del plan..."
                  rows={2}
                />
              </div>

              {/* Pricing */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Precios
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_monthly">Precio Mensual ($)</Label>
                    <Input
                      id="price_monthly"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_monthly ?? ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        price_monthly: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_yearly">Precio Anual ($)</Label>
                    <Input
                      id="price_yearly"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_yearly ?? ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        price_yearly: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Límites
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_users">Usuarios</Label>
                    <Input
                      id="max_users"
                      type="number"
                      min="1"
                      value={formData.max_users_default}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_users_default: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_devices">Dispositivos</Label>
                    <Input
                      id="max_devices"
                      type="number"
                      min="1"
                      value={formData.max_devices_default}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_devices_default: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trial_days">Días Trial</Label>
                    <Input
                      id="trial_days"
                      type="number"
                      min="0"
                      value={formData.trial_days}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trial_days: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_calls">API Calls/Mes</Label>
                    <Input
                      id="api_calls"
                      type="number"
                      min="0"
                      value={formData.max_api_calls_month ?? ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        max_api_calls_month: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      placeholder="Sin límite"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Características
                </h4>
                <div className="space-y-4">
                  {FEATURE_CATEGORIES.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{category.name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {category.features.map((feature) => (
                          <div 
                            key={feature.key}
                            className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                          >
                            <Label htmlFor={feature.key} className="text-sm cursor-pointer">
                              {feature.label}
                            </Label>
                            <Switch
                              id={feature.key}
                              checked={!!formData.features[feature.key]}
                              onCheckedChange={() => toggleFeature(feature.key)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Estado del Plan</Label>
                  <p className="text-xs text-muted-foreground">
                    Los planes inactivos no pueden ser seleccionados
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Las licencias existentes con este plan no se verán afectadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default LicensePlansManager;
