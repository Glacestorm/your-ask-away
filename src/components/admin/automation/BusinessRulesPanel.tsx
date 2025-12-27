/**
 * BusinessRulesPanel - Fase 9
 * Panel completo para gestión de reglas de negocio
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Scale, 
  RefreshCw, 
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Activity,
  ArrowUpDown,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  Zap
} from 'lucide-react';
import { useBusinessRules } from '@/hooks/admin/automation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface BusinessRulesPanelProps {
  className?: string;
  expanded?: boolean;
}

export default function BusinessRulesPanel({ className, expanded = false }: BusinessRulesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRuleDesc, setNewRuleDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { 
    rules, 
    evaluations,
    isLoading, 
    error,
    lastRefresh,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    evaluateRules
  } = useBusinessRules();

  useEffect(() => { 
    fetchRules(); 
  }, [fetchRules]);

  const handleCreateRule = useCallback(async () => {
    if (!newRuleDesc.trim()) return;
    
    setIsGenerating(true);
    try {
      const result = await createRule({ 
        description: newRuleDesc,
        generateWithAI: true 
      });
      if (result) {
        toast.success('Regla creada con IA');
        setShowCreateDialog(false);
        setNewRuleDesc('');
        fetchRules();
      }
    } catch (err) {
      toast.error('Error al crear regla');
    } finally {
      setIsGenerating(false);
    }
  }, [newRuleDesc, createRule, fetchRules]);

  const handleToggleRule = useCallback(async (ruleId: string, isActive: boolean) => {
    await updateRule(ruleId, { is_active: isActive });
    toast.success(isActive ? 'Regla activada' : 'Regla desactivada');
    fetchRules();
  }, [updateRule, fetchRules]);

  const categories = Array.from(new Set(rules.map(r => r.category).filter(Boolean)));
  
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const activeRules = rules.filter(r => r.is_active).length;
  const totalTriggers = rules.reduce((acc, r) => acc + (r.trigger_count || 0), 0);
  const avgPriority = rules.length 
    ? Math.round(rules.reduce((acc, r) => acc + (r.priority || 0), 0) / rules.length)
    : 0;

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-500 bg-red-500/10';
    if (priority >= 5) return 'text-amber-500 bg-amber-500/10';
    return 'text-blue-500 bg-blue-500/10';
  };

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Reglas de Negocio
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  Fase 9
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                {lastRefresh 
                  ? `Actualizado ${formatDistanceToNow(lastRefresh, { locale: es, addSuffix: true })}`
                  : 'Sincronizando...'
                }
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Sparkles className="h-4 w-4" />
                  Nueva Regla
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Crear Regla con IA
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Describe la regla en lenguaje natural. Ej: 'Si un cliente tiene más de 3 facturas impagadas, bloquear nuevos pedidos y notificar a finanzas'"
                    value={newRuleDesc}
                    onChange={(e) => setNewRuleDesc(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    La IA convertirá tu descripción en condiciones y acciones automáticas.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateRule} disabled={isGenerating || !newRuleDesc.trim()}>
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchRules()}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Activas
            </div>
            <p className="text-2xl font-bold">{activeRules}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Zap className="h-3.5 w-3.5" />
              Disparos
            </div>
            <p className="text-2xl font-bold">{totalTriggers}</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Prioridad Avg
            </div>
            <p className="text-2xl font-bold">{avgPriority}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar reglas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className={expanded ? "h-[400px]" : "h-[300px]"}>
          <div className="space-y-2">
            {error ? (
              <div className="p-4 text-center text-sm text-destructive">
                {error}
              </div>
            ) : filteredRules.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Scale className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No hay reglas configuradas</p>
                <Button variant="link" size="sm" onClick={() => setShowCreateDialog(true)}>
                  Crear primera regla
                </Button>
              </div>
            ) : (
              filteredRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                        />
                        <p className="font-medium text-sm">{rule.name}</p>
                        <Badge 
                          className={cn("text-xs", getPriorityColor(rule.priority))}
                          variant="outline"
                        >
                          P{rule.priority}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-11 line-clamp-1">
                          {rule.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 ml-11">
                        {rule.category && (
                          <Badge variant="secondary" className="text-xs">
                            {rule.category}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {rule.conditions?.length || 0} condiciones
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {rule.actions?.length || 0} acciones
                        </span>
                        {rule.trigger_count > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {rule.trigger_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          deleteRule(rule.id);
                          toast.success('Regla eliminada');
                          fetchRules();
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Recent Evaluations */}
        {evaluations && evaluations.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Evaluaciones Recientes
            </h4>
            <div className="space-y-1">
              {evaluations.slice(0, 3).map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{ev.rule_name}</span>
                  <Badge variant={ev.triggered ? 'default' : 'outline'} className="text-xs">
                    {ev.triggered ? 'Disparada' : 'No aplicó'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
