import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  UserPlus,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  ExternalLink,
  Newspaper,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CommercialOpportunity {
  id: string;
  article_id: string;
  company_id: string;
  opportunity_type: 'upsell' | 'cross_sell' | 'new_lead';
  description: string;
  potential_value: number;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'contacted';
  assigned_to: string | null;
  created_at: string;
  article?: {
    title: string;
    source: string;
    published_at: string;
  };
  company?: {
    nombre_fiscal: string;
  };
  assignee?: {
    full_name: string;
  };
}

const OPPORTUNITY_TYPES = {
  upsell: { label: 'Upsell', icon: TrendingUp, color: 'text-green-500' },
  cross_sell: { label: 'Cross-sell', icon: Target, color: 'text-blue-500' },
  new_lead: { label: 'Nuevo Lead', icon: UserPlus, color: 'text-purple-500' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pendiente', variant: 'secondary' as const, icon: Clock },
  accepted: { label: 'Aceptada', variant: 'default' as const, icon: CheckCircle },
  rejected: { label: 'Rechazada', variant: 'destructive' as const, icon: ThumbsDown },
  contacted: { label: 'Contactado', variant: 'outline' as const, icon: Eye },
};

export const CommercialOpportunitiesDashboard: React.FC = () => {
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from('news_commercial_opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedOpportunities = (data || []).map(o => ({
        ...o,
        opportunity_type: o.opportunity_type as CommercialOpportunity['opportunity_type'],
        status: o.status as CommercialOpportunity['status'],
        article: undefined,
        company: undefined,
        assignee: undefined
      }));

      setOpportunities(typedOpportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Error al cargar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  const detectOpportunities = async () => {
    setDetecting(true);
    try {
      const { error } = await supabase.functions.invoke('detect-news-opportunities');
      if (error) throw error;
      toast.success('Análisis de oportunidades completado');
      fetchOpportunities();
    } catch (error) {
      console.error('Error detecting:', error);
      toast.error('Error al detectar oportunidades');
    } finally {
      setDetecting(false);
    }
  };

  const updateStatus = async (id: string, status: CommercialOpportunity['status']) => {
    try {
      const { error } = await supabase
        .from('news_commercial_opportunities')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setOpportunities(opportunities.map(o => 
        o.id === id ? { ...o, status } : o
      ));
      toast.success('Estado actualizado');
    } catch (error) {
      console.error('Error updating:', error);
      toast.error('Error al actualizar');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filteredOpportunities = opportunities.filter(o => {
    if (filter === 'all') return true;
    return o.status === filter;
  });

  const stats = {
    total: opportunities.length,
    pending: opportunities.filter(o => o.status === 'pending').length,
    accepted: opportunities.filter(o => o.status === 'accepted').length,
    potentialValue: opportunities
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => sum + (o.potential_value || 0), 0),
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Oportunidades Comerciales
          </h2>
          <p className="text-muted-foreground">
            Oportunidades detectadas automáticamente desde noticias del sector
          </p>
        </div>
        <Button onClick={detectOpportunities} disabled={detecting}>
          <RefreshCw className={`h-4 w-4 mr-2 ${detecting ? 'animate-spin' : ''}`} />
          Detectar Oportunidades
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total detectadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.accepted}</div>
            <p className="text-sm text-muted-foreground">Aceptadas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.potentialValue)}</div>
            <p className="text-sm text-muted-foreground">Valor potencial</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todas ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pendientes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
          <TabsTrigger value="contacted">Contactados</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Sin oportunidades {filter !== 'all' ? 'en este estado' : ''}</h3>
            <p className="text-muted-foreground">
              Ejecuta la detección automática para encontrar oportunidades comerciales
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opportunity) => {
            const TypeInfo = OPPORTUNITY_TYPES[opportunity.opportunity_type] || OPPORTUNITY_TYPES.new_lead;
            const StatusInfo = STATUS_CONFIG[opportunity.status];

            return (
              <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg bg-muted ${TypeInfo.color}`}>
                      <TypeInfo.icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{TypeInfo.label}</Badge>
                            <Badge variant={StatusInfo.variant}>
                              <StatusInfo.icon className="h-3 w-3 mr-1" />
                              {StatusInfo.label}
                            </Badge>
                          </div>
                          <h3 className="font-medium">{opportunity.description}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(opportunity.potential_value || 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {opportunity.confidence_score}% confianza
                          </div>
                        </div>
                      </div>

                      {/* Company & Article */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        {opportunity.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {opportunity.company.nombre_fiscal}
                          </span>
                        )}
                        {opportunity.article && (
                          <span className="flex items-center gap-1">
                            <Newspaper className="h-4 w-4" />
                            {opportunity.article.title?.substring(0, 50)}...
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      {opportunity.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateStatus(opportunity.id, 'accepted')}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Aceptar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateStatus(opportunity.id, 'contacted')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Contactar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => updateStatus(opportunity.id, 'rejected')}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      )}

                      {/* Assignee */}
                      {opportunity.assignee && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {opportunity.assignee.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            Asignado a {opportunity.assignee.full_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommercialOpportunitiesDashboard;
