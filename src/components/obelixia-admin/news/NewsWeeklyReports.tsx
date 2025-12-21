import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Calendar, TrendingUp, Lightbulb, BarChart3,
  ChevronDown, ChevronUp, Download, ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WeeklyReport {
  id: string;
  week_start: string;
  week_end: string;
  summary: string | null;
  top_news: Array<{
    id: string;
    title: string;
    category: string;
    relevance_score: number;
    importance_level: string;
    product_connection: string | null;
  }> | null;
  detected_trends: Array<{ trend: string; count: number }> | null;
  improvement_proposals: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
  }> | null;
  statistics: {
    total_articles_fetched: number;
    total_articles_saved: number;
    critical_news: number;
    high_relevance_news: number;
    articles_with_product_connection: number;
  } | null;
  created_at: string;
}

export const NewsWeeklyReports: React.FC = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['news-weekly-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_weekly_reports')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(12) as { data: WeeklyReport[] | null; error: any };
      if (error) throw error;
      return data as WeeklyReport[];
    }
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-weekly-report');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Informe semanal generado correctamente');
      queryClient.invalidateQueries({ queryKey: ['news-weekly-reports'] });
    },
    onError: (error) => {
      toast.error(`Error generando informe: ${error.message}`);
    }
  });

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando informes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Informes Semanales</h3>
          <p className="text-sm text-slate-400">Resumen semanal de noticias, tendencias y mejoras</p>
        </div>
        <Button
          onClick={() => generateReportMutation.mutate()}
          disabled={generateReportMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generar Ahora
        </Button>
      </div>

      {reports?.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No hay informes generados</p>
            <p className="text-sm text-slate-500 mb-4">Genera el primer informe semanal</p>
            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={generateReportMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Generar Informe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {reports?.map((report) => {
              const isExpanded = expandedId === report.id;
              
              return (
                <Card key={report.id} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20">
                          <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-white">
                            Semana {format(new Date(report.week_start), 'd MMM', { locale: es })} - {format(new Date(report.week_end), 'd MMM yyyy', { locale: es })}
                          </CardTitle>
                          <p className="text-xs text-slate-400">
                            Generado: {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedId(isExpanded ? null : report.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {/* Quick Stats */}
                    {report.statistics && (
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-lg font-bold text-white">{report.statistics.total_articles_saved}</p>
                          <p className="text-xs text-slate-500">Artículos</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-lg font-bold text-red-400">{report.statistics.critical_news}</p>
                          <p className="text-xs text-slate-500">Críticos</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-lg font-bold text-emerald-400">{report.statistics.high_relevance_news}</p>
                          <p className="text-xs text-slate-500">Alta Rel.</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-lg font-bold text-purple-400">{report.statistics.articles_with_product_connection}</p>
                          <p className="text-xs text-slate-500">Conexiones</p>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded text-center">
                          <p className="text-lg font-bold text-cyan-400">{report.detected_trends?.length || 0}</p>
                          <p className="text-xs text-slate-500">Tendencias</p>
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {report.summary && (
                      <p className="text-sm text-slate-300 mb-4 line-clamp-3">{report.summary}</p>
                    )}

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        {/* Top News */}
                        {report.top_news && report.top_news.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              Top Noticias
                            </h4>
                            <div className="space-y-2">
                              {report.top_news.slice(0, 5).map((news, i) => (
                                <div key={news.id} className="flex items-center gap-2 text-sm">
                                  <span className="text-slate-500 w-4">{i + 1}.</span>
                                  <Badge variant="outline" className="text-xs">{news.category}</Badge>
                                  <span className="text-slate-300 flex-1 truncate">{news.title}</span>
                                  <span className={`text-xs ${
                                    news.relevance_score >= 80 ? 'text-emerald-400' : 
                                    news.relevance_score >= 60 ? 'text-amber-400' : 'text-slate-400'
                                  }`}>
                                    {news.relevance_score}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Trends */}
                        {report.detected_trends && report.detected_trends.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-cyan-400" />
                              Tendencias Detectadas
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {report.detected_trends.map((trend, i) => (
                                <Badge key={i} variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                                  {trend.trend} ({trend.count})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Improvement Proposals */}
                        {report.improvement_proposals && report.improvement_proposals.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-amber-400" />
                              Propuestas de Mejora Pendientes
                            </h4>
                            <div className="space-y-2">
                              {report.improvement_proposals.slice(0, 5).map((proposal) => (
                                <div key={proposal.id} className="bg-slate-900/50 p-2 rounded">
                                  <div className="flex items-center gap-2">
                                    <Badge className={
                                      proposal.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                      proposal.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-slate-500/20 text-slate-400'
                                    }>
                                      {proposal.priority}
                                    </Badge>
                                    <span className="text-sm text-slate-300">{proposal.title}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
