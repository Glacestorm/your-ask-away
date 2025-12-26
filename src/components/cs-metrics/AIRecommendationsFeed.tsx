/**
 * AI Recommendations Feed
 * Feed de recomendaciones proactivas con IA
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Zap,
  TrendingUp,
  AlertTriangle,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Target,
  RefreshCw,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AIRecommendation {
  id: string;
  type: 'retention' | 'expansion' | 'engagement' | 'risk' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  estimatedValue?: number;
  targetEntity?: {
    type: 'customer' | 'segment' | 'global';
    id?: string;
    name: string;
  };
  suggestedAction: string;
  playbook?: string;
  confidence: number;
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
}

const mockRecommendations: AIRecommendation[] = [
  {
    id: '1',
    type: 'risk',
    priority: 'critical',
    title: 'Intervención urgente: TechCorp Enterprise',
    description: 'Detectada pérdida de sponsor interno + 40% reducción de uso en últimas 2 semanas',
    impact: 'Prevenir churn de €15,000/mes ARR',
    estimatedValue: 180000,
    targetEntity: { type: 'customer', id: 'c1', name: 'TechCorp Enterprise' },
    suggestedAction: 'Agendar llamada ejecutiva + enviar análisis de valor',
    playbook: 'Champion Recovery',
    confidence: 92,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: '2',
    type: 'expansion',
    priority: 'high',
    title: 'Oportunidad de upsell: Global Finance Ltd',
    description: 'Uso al 95% de capacidad actual, 3 solicitudes de features enterprise',
    impact: 'Potencial upgrade a plan Enterprise (+€12K/año)',
    estimatedValue: 12000,
    targetEntity: { type: 'customer', id: 'c2', name: 'Global Finance Ltd' },
    suggestedAction: 'Proponer demo de features enterprise + pricing',
    playbook: 'Usage-Based Expansion',
    confidence: 87,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: '3',
    type: 'engagement',
    priority: 'medium',
    title: 'Reactivar segmento Mid-Market',
    description: '15 cuentas con engagement < 30% en últimos 30 días',
    impact: 'Prevenir €45K ARR at-risk',
    estimatedValue: 45000,
    targetEntity: { type: 'segment', name: 'Mid-Market Low Engagement' },
    suggestedAction: 'Lanzar campaña de reengagement con webinar exclusivo',
    playbook: 'Segment Reactivation',
    confidence: 78,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'in_progress',
  },
  {
    id: '4',
    type: 'retention',
    priority: 'high',
    title: 'Renovación proactiva: InnovateTech',
    description: 'Renovación en 45 días, NPS bajó de 8 a 6 este trimestre',
    impact: 'Asegurar renovación de €8,500/mes',
    estimatedValue: 102000,
    targetEntity: { type: 'customer', id: 'c3', name: 'InnovateTech' },
    suggestedAction: 'QBR anticipado + revisar objetivos no cumplidos',
    playbook: 'Proactive Renewal',
    confidence: 85,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: '5',
    type: 'optimization',
    priority: 'medium',
    title: 'Automatizar onboarding SMB',
    description: 'Tiempo promedio de onboarding SMB: 14 días (benchmark: 7 días)',
    impact: 'Reducir TTV 50%, liberar 15h/semana de CS',
    targetEntity: { type: 'global', name: 'Proceso de Onboarding' },
    suggestedAction: 'Implementar checklist automatizado + in-app guidance',
    confidence: 91,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
  },
  {
    id: '6',
    type: 'expansion',
    priority: 'medium',
    title: 'Cross-sell módulo Analytics',
    description: '23 cuentas activas con alto uso de reportes básicos',
    impact: 'Pipeline de €92K en upgrades',
    estimatedValue: 92000,
    targetEntity: { type: 'segment', name: 'Analytics Candidates' },
    suggestedAction: 'Enviar demo personalizada + trial de 14 días',
    playbook: 'Feature Cross-sell',
    confidence: 82,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
];

const typeConfig = {
  retention: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  expansion: { icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  engagement: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  risk: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  optimization: { icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'text-red-500' },
  high: { color: 'bg-orange-500', text: 'text-orange-500' },
  medium: { color: 'bg-amber-500', text: 'text-amber-500' },
  low: { color: 'bg-emerald-500', text: 'text-emerald-500' },
};

export function AIRecommendationsFeed() {
  const [recommendations, setRecommendations] = useState(mockRecommendations);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredRecs = useMemo(() => {
    if (activeFilter === 'all') return recommendations;
    if (activeFilter === 'pending') return recommendations.filter(r => r.status === 'pending');
    return recommendations.filter(r => r.type === activeFilter);
  }, [recommendations, activeFilter]);

  const stats = useMemo(() => ({
    total: recommendations.length,
    pending: recommendations.filter(r => r.status === 'pending').length,
    totalValue: recommendations.reduce((sum, r) => sum + (r.estimatedValue || 0), 0),
    critical: recommendations.filter(r => r.priority === 'critical' && r.status === 'pending').length,
  }), [recommendations]);

  const handleAction = (id: string, action: 'start' | 'complete' | 'dismiss') => {
    setRecommendations(prev => prev.map(r => {
      if (r.id !== id) return r;
      const newStatus = action === 'start' ? 'in_progress' : action === 'complete' ? 'completed' : 'dismissed';
      return { ...r, status: newStatus };
    }));
    
    const messages = {
      start: 'Recomendación en progreso',
      complete: 'Recomendación completada',
      dismiss: 'Recomendación descartada',
    };
    toast.success(messages[action]);
  };

  const refresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
    toast.success('Recomendaciones actualizadas');
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Recommendations Feed</CardTitle>
              <p className="text-sm text-muted-foreground">
                Acciones proactivas generadas por IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn(
              stats.critical > 0 && "border-red-500/50 text-red-600 animate-pulse"
            )}>
              {stats.critical} críticas
            </Badge>
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-600">
              <DollarSign className="h-3 w-3 mr-1" />
              €{(stats.totalValue / 1000).toFixed(0)}K potencial
            </Badge>
            <Button variant="ghost" size="icon" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            Todas ({stats.total})
          </Button>
          <Button
            variant={activeFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('pending')}
          >
            <Clock className="h-3 w-3 mr-1" />
            Pendientes ({stats.pending})
          </Button>
          {Object.entries(typeConfig).map(([type, config]) => (
            <Button
              key={type}
              variant={activeFilter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(type)}
              className={activeFilter === type ? '' : config.color}
            >
              <config.icon className="h-3 w-3 mr-1" />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Recommendations List */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {filteredRecs.map((rec) => {
              const config = typeConfig[rec.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={rec.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    config.bg,
                    config.border,
                    rec.status === 'completed' && "opacity-60",
                    rec.status === 'dismissed' && "opacity-40"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{rec.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={cn("text-[10px] h-5", priorityConfig[rec.priority].text)}
                          >
                            {rec.priority}
                          </Badge>
                          {rec.status !== 'pending' && (
                            <Badge variant={rec.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                              {rec.status === 'in_progress' && 'En progreso'}
                              {rec.status === 'completed' && 'Completado'}
                              {rec.status === 'dismissed' && 'Descartado'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-muted-foreground mb-1">
                        Confianza IA
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rec.confidence}%
                      </Badge>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-xs">
                    {rec.targetEntity && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Target</p>
                        <p className="font-medium">{rec.targetEntity.name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground mb-0.5">Impacto</p>
                      <p className="font-medium">{rec.impact}</p>
                    </div>
                    {rec.estimatedValue && (
                      <div>
                        <p className="text-muted-foreground mb-0.5">Valor estimado</p>
                        <p className="font-medium text-emerald-600">€{rec.estimatedValue.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground mb-0.5">Generado</p>
                      <p className="font-medium">
                        {formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="p-2 rounded-lg bg-background/50 border mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="font-medium">Acción sugerida:</span>
                      <span className="text-muted-foreground">{rec.suggestedAction}</span>
                      {rec.playbook && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {rec.playbook}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {rec.status === 'pending' && (
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => handleAction(rec.id, 'dismiss')}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Descartar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleAction(rec.id, 'start')}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        En progreso
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleAction(rec.id, 'complete')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completar
                      </Button>
                    </div>
                  )}
                  
                  {rec.status === 'in_progress' && (
                    <div className="flex gap-2 justify-end">
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleAction(rec.id, 'complete')}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Marcar completado
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AIRecommendationsFeed;
