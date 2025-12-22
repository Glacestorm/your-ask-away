import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  Clock, 
  DollarSign,
  ArrowUpRight,
  Brain,
  Sparkles,
  Filter,
  ChevronRight
} from 'lucide-react';
import { useExpansionIntelligence } from '@/hooks/useExpansionIntelligence';
import { cn } from '@/lib/utils';

const ExpansionOpportunitiesPanel = () => {
  const { opportunities, isLoading, updateOpportunity } = useExpansionIntelligence();
  const [filter, setFilter] = useState<'all' | 'upsell' | 'cross_sell' | 'upgrade'>('all');

  // Mock data for demonstration
  const mockOpportunities = [
    {
      id: '1',
      company_id: 'c1',
      company: { name: 'TechCorp Solutions' },
      opportunity_type: 'upsell',
      propensity_score: 87,
      estimated_value: 15000,
      recommended_action: 'Ofrecer módulo de Analytics Avanzado',
      optimal_timing: '2024-02-15',
      triggers: ['Alto uso de reportes', 'Solicitud de métricas avanzadas', 'NPS alto'],
      status: 'identified',
      confidence_level: 92
    },
    {
      id: '2',
      company_id: 'c2',
      company: { name: 'Global Retail Inc' },
      opportunity_type: 'cross_sell',
      propensity_score: 78,
      estimated_value: 8500,
      recommended_action: 'Proponer integración con ERP',
      optimal_timing: '2024-02-20',
      triggers: ['Expansión de equipo', 'Nuevas sucursales', 'Crecimiento MRR 25%'],
      status: 'identified',
      confidence_level: 85
    },
    {
      id: '3',
      company_id: 'c3',
      company: { name: 'FinServ Partners' },
      opportunity_type: 'upgrade',
      propensity_score: 94,
      estimated_value: 25000,
      recommended_action: 'Migrar a plan Enterprise',
      optimal_timing: '2024-02-10',
      triggers: ['Límites de usuarios alcanzados', 'Requerimientos de compliance', 'ROI demostrado'],
      status: 'in_progress',
      confidence_level: 96
    },
    {
      id: '4',
      company_id: 'c4',
      company: { name: 'HealthTech Labs' },
      opportunity_type: 'upsell',
      propensity_score: 72,
      estimated_value: 12000,
      recommended_action: 'Añadir módulo de automatización',
      optimal_timing: '2024-03-01',
      triggers: ['Procesos manuales identificados', 'Feedback sobre eficiencia'],
      status: 'identified',
      confidence_level: 78
    }
  ];

  const displayOpportunities = opportunities?.length ? opportunities : mockOpportunities;
  
  const filteredOpportunities = filter === 'all' 
    ? displayOpportunities 
    : displayOpportunities.filter(o => o.opportunity_type === filter);

  const totalPotentialValue = displayOpportunities.reduce((sum, o) => sum + ((o as any).estimated_value || 0), 0);
  const avgPropensity = displayOpportunities.reduce((sum, o) => sum + (o.propensity_score || 0), 0) / displayOpportunities.length;

  const getOpportunityTypeConfig = (type: string) => {
    switch (type) {
      case 'upsell':
        return { label: 'Upsell', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: TrendingUp };
      case 'cross_sell':
        return { label: 'Cross-sell', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Zap };
      case 'upgrade':
        return { label: 'Upgrade', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: ArrowUpRight };
      default:
        return { label: type, color: 'bg-muted text-muted-foreground', icon: Target };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'identified':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Identificada</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">En Progreso</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Convertida</Badge>;
      case 'lost':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Perdida</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Oportunidades Activas</p>
                <p className="text-3xl font-bold text-blue-500">{displayOpportunities.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Potencial Total</p>
                <p className="text-3xl font-bold text-green-500">{formatCurrency(totalPotentialValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Propensión Promedio</p>
                <p className="text-3xl font-bold text-purple-500">{avgPropensity.toFixed(0)}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Timing Óptimo</p>
                <p className="text-3xl font-bold text-amber-500">3</p>
                <p className="text-xs text-muted-foreground">esta semana</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Oportunidades de Expansión
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <TabsList className="h-8">
                  <TabsTrigger value="all" className="text-xs px-3">Todas</TabsTrigger>
                  <TabsTrigger value="upsell" className="text-xs px-3">Upsell</TabsTrigger>
                  <TabsTrigger value="cross_sell" className="text-xs px-3">Cross-sell</TabsTrigger>
                  <TabsTrigger value="upgrade" className="text-xs px-3">Upgrade</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOpportunities.map((opportunity) => {
              const typeConfig = getOpportunityTypeConfig(opportunity.opportunity_type);
              const TypeIcon = typeConfig.icon;
              
              return (
                <div 
                  key={opportunity.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        typeConfig.color
                      )}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">
                            {(opportunity as any).company?.name || 'Cliente'}
                          </h4>
                          <Badge variant="outline" className={typeConfig.color}>
                            {typeConfig.label}
                          </Badge>
                          {getStatusBadge(opportunity.status || 'identified')}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {(opportunity as any).recommended_action}
                        </p>

                        {/* Triggers */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {((opportunity as any).triggers as string[] || []).map((trigger, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs bg-muted/50"
                            >
                              {trigger}
                            </Badge>
                          ))}
                        </div>

                        {/* Progress bars */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Propensión</span>
                              <span className="font-medium">{opportunity.propensity_score}%</span>
                            </div>
                            <Progress 
                              value={opportunity.propensity_score || 0} 
                              className="h-1.5"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Confianza IA</span>
                              <span className="font-medium">{(opportunity as any).confidence_level || 80}%</span>
                            </div>
                            <Progress 
                              value={(opportunity as any).confidence_level || 80} 
                              className="h-1.5"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-2xl font-bold text-green-500">
                        {formatCurrency((opportunity as any).estimated_value || 0)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Timing: {formatDate(opportunity.optimal_timing || new Date().toISOString())}</span>
                      </div>
                      <Button size="sm" className="mt-3">
                        Iniciar <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpansionOpportunitiesPanel;
