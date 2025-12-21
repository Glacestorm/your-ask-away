import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Lightbulb, CheckCircle, XCircle, Clock, ArrowRight, 
  MessageSquare, TrendingUp, ExternalLink, Filter
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Insight {
  id: string;
  news_article_id: string | null;
  insight_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  ai_recommendation: string | null;
  detected_from_trends: string[] | null;
  review_notes: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400' },
  { value: 'in_review', label: 'En Revisión', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'approved', label: 'Aprobado', color: 'bg-emerald-500/20 text-emerald-400' },
  { value: 'implemented', label: 'Implementado', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'rejected', label: 'Rechazado', color: 'bg-red-500/20 text-red-400' }
];

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400 border-red-500/50',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
};

export const NewsInsightsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const { data: insights, isLoading } = useQuery({
    queryKey: ['news-insights', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('news_improvement_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as Insight[];
    }
  });

  const updateInsightMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: any = { 
        status,
        reviewed_at: new Date().toISOString()
      };
      if (notes) update.review_notes = notes;
      
      const { error } = await supabase
        .from('news_improvement_insights')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Insight actualizado');
      queryClient.invalidateQueries({ queryKey: ['news-insights'] });
      queryClient.invalidateQueries({ queryKey: ['news-admin-stats'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const stats = {
    pending: insights?.filter(i => i.status === 'pending').length || 0,
    in_review: insights?.filter(i => i.status === 'in_review').length || 0,
    approved: insights?.filter(i => i.status === 'approved').length || 0,
    implemented: insights?.filter(i => i.status === 'implemented').length || 0
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-xs text-amber-400/70">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-blue-400">{stats.in_review}</p>
              <p className="text-xs text-blue-400/70">En Revisión</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-emerald-400">{stats.approved}</p>
              <p className="text-xs text-emerald-400/70">Aprobados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-3 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-purple-400">{stats.implemented}</p>
              <p className="text-xs text-purple-400/70">Implementados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-600">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights?.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-8 text-center">
              <Lightbulb className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No hay insights detectados</p>
              <p className="text-sm text-slate-500">Las sugerencias de mejora aparecerán aquí cuando se detecten automáticamente</p>
            </CardContent>
          </Card>
        ) : (
          insights?.map((insight) => {
            const isExpanded = expandedId === insight.id;
            const statusOption = STATUS_OPTIONS.find(s => s.value === insight.status);
            
            return (
              <Card 
                key={insight.id} 
                className={`bg-slate-800/50 border-slate-700 transition-all ${isExpanded ? 'ring-1 ring-emerald-500/50' : ''}`}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={PRIORITY_COLORS[insight.priority] || PRIORITY_COLORS.medium}>
                          {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                        <Badge className={statusOption?.color || 'bg-slate-500/20 text-slate-400'}>
                          {statusOption?.label || insight.status}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDistanceToNow(new Date(insight.created_at), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {isExpanded ? 'Cerrar' : 'Ver más'}
                    </Button>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-300 mb-3">{insight.description}</p>

                  {/* Trends */}
                  {insight.detected_from_trends && insight.detected_from_trends.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                      <div className="flex flex-wrap gap-1">
                        {insight.detected_from_trends.map((trend, i) => (
                          <Badge key={i} variant="outline" className="text-xs text-cyan-400 border-cyan-500/30">
                            {trend}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-4">
                      {insight.ai_recommendation && (
                        <div className="bg-slate-900/50 p-3 rounded">
                          <p className="text-xs text-slate-400 mb-1">Recomendación IA:</p>
                          <p className="text-sm text-slate-300">{insight.ai_recommendation}</p>
                        </div>
                      )}

                      {/* Review Notes */}
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Notas de revisión:</p>
                        <Textarea
                          value={reviewNotes[insight.id] || insight.review_notes || ''}
                          onChange={(e) => setReviewNotes({ ...reviewNotes, [insight.id]: e.target.value })}
                          placeholder="Añade notas sobre esta propuesta..."
                          className="bg-slate-900 border-slate-600 text-sm"
                          rows={2}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {insight.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInsightMutation.mutate({ 
                                id: insight.id, 
                                status: 'in_review',
                                notes: reviewNotes[insight.id]
                              })}
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Revisar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInsightMutation.mutate({ 
                                id: insight.id, 
                                status: 'rejected',
                                notes: reviewNotes[insight.id]
                              })}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {insight.status === 'in_review' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateInsightMutation.mutate({ 
                                id: insight.id, 
                                status: 'approved',
                                notes: reviewNotes[insight.id]
                              })}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInsightMutation.mutate({ 
                                id: insight.id, 
                                status: 'rejected',
                                notes: reviewNotes[insight.id]
                              })}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {insight.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => updateInsightMutation.mutate({ 
                              id: insight.id, 
                              status: 'implemented',
                              notes: reviewNotes[insight.id]
                            })}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Marcar Implementado
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
