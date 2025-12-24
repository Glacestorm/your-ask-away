/**
 * LeadDistributionManager - Gestión de reglas de distribución de leads
 * Configuración de reglas automáticas basadas en criterios
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Target,
  Zap,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface LeadDistributionRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  rule_type: string;
  channel_filters: string[];
  specialty_filters: Json;
  agent_weights: Json;
  max_concurrent: number;
  is_active: boolean;
  created_at: string;
}

interface LeadDistributionManagerProps {
  className?: string;
}

const RULE_TYPES = [
  { value: 'round_robin', label: 'Round Robin', description: 'Distribución equitativa secuencial' },
  { value: 'weighted', label: 'Ponderado', description: 'Según peso asignado a cada agente' },
  { value: 'capacity', label: 'Capacidad', description: 'Según carga de trabajo actual' },
  { value: 'skill_based', label: 'Por Habilidades', description: 'Según especialidad' },
];

export function LeadDistributionManager({ className }: LeadDistributionManagerProps) {
  const [rules, setRules] = useState<LeadDistributionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadDistributionRule | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 1,
    rule_type: 'round_robin',
    channel_filters: '',
    max_concurrent: 10,
    is_active: true,
  });

  const fetchRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lead_distribution_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      
      const mappedRules: LeadDistributionRule[] = (data || []).map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        priority: rule.priority,
        rule_type: rule.rule_type,
        channel_filters: rule.channel_filters || [],
        specialty_filters: rule.specialty_filters || {},
        agent_weights: rule.agent_weights || {},
        max_concurrent: rule.max_concurrent,
        is_active: rule.is_active ?? true,
        created_at: rule.created_at,
      }));
      
      setRules(mappedRules);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Error al cargar reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la regla es requerido');
      return;
    }

    try {
      const channelFilters = formData.channel_filters
        ? formData.channel_filters.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const ruleData = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        rule_type: formData.rule_type,
        channel_filters: channelFilters,
        max_concurrent: formData.max_concurrent,
        is_active: formData.is_active,
        specialty_filters: {} as Json,
        agent_weights: {} as Json,
      };

      if (editingRule) {
        const { error } = await supabase
          .from('lead_distribution_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        if (error) throw error;
        toast.success('Regla actualizada');
      } else {
        const { error } = await supabase
          .from('lead_distribution_rules')
          .insert([ruleData]);
        if (error) throw error;
        toast.success('Regla creada');
      }

      setDialogOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Error al guardar regla');
    }
  };

  const handleDelete = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('lead_distribution_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
      toast.success('Regla eliminada');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Error al eliminar regla');
    }
  };

  const toggleRuleActive = async (rule: LeadDistributionRule) => {
    try {
      const { error } = await supabase
        .from('lead_distribution_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);
      if (error) throw error;
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast.error('Error al cambiar estado');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      priority: 1,
      rule_type: 'round_robin',
      channel_filters: '',
      max_concurrent: 10,
      is_active: true,
    });
    setEditingRule(null);
  };

  const openEditDialog = (rule: LeadDistributionRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      priority: rule.priority,
      rule_type: rule.rule_type,
      channel_filters: rule.channel_filters.join(', '),
      max_concurrent: rule.max_concurrent,
      is_active: rule.is_active,
    });
    setDialogOpen(true);
  };

  const getRuleTypeInfo = (type: string) => {
    return RULE_TYPES.find(t => t.value === type);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Distribución de Leads
            </CardTitle>
            <CardDescription>
              Configura reglas automáticas para asignar leads a gestores
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", loading && "animate-spin")} />
              Actualizar
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva Regla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Editar Regla' : 'Nueva Regla de Distribución'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre de la Regla</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Leads Enterprise"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descripción de la regla..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Distribución</Label>
                    <Select 
                      value={formData.rule_type} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, rule_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RULE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <p className="font-medium">{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Canales (separados por coma)</Label>
                      <Input
                        value={formData.channel_filters}
                        onChange={(e) => setFormData(prev => ({ ...prev, channel_filters: e.target.value }))}
                        placeholder="web, telefono, email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Máximo Concurrente</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.max_concurrent}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent: parseInt(e.target.value) || 10 }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Regla Activa</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSubmit}>
                      {editingRule ? 'Actualizar' : 'Crear'} Regla
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay reglas de distribución configuradas</p>
            <p className="text-sm text-muted-foreground/70">
              Crea tu primera regla para automatizar la asignación de leads
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {rules.map((rule) => {
                const typeInfo = getRuleTypeInfo(rule.rule_type);
                return (
                  <div 
                    key={rule.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      rule.is_active ? "bg-card" : "bg-muted/50 opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            #{rule.priority}
                          </Badge>
                          <h4 className="font-medium">{rule.name}</h4>
                          {rule.is_active ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            {typeInfo?.label || rule.rule_type}
                          </Badge>
                          {rule.channel_filters.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Canales: {rule.channel_filters.slice(0, 2).join(', ')}{rule.channel_filters.length > 2 ? '...' : ''}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Max: {rule.max_concurrent}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRuleActive(rule)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default LeadDistributionManager;
