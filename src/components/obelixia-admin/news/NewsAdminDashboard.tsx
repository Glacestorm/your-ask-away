import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, Settings, Database, Tag, Archive, 
  Lightbulb, FileText, RefreshCw, TrendingUp, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NewsConfigPanel } from './NewsConfigPanel';
import { NewsSourcesManager } from './NewsSourcesManager';
import { NewsInsightsPanel } from './NewsInsightsPanel';
import { NewsFetchLogs } from './NewsFetchLogs';
import { NewsWeeklyReports } from './NewsWeeklyReports';
import { NewsArchivedList } from './NewsArchivedList';

export const NewsAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['news-admin-stats'],
    queryFn: async () => {
      const [articlesRes, insightsRes, logsRes, sourcesRes] = await Promise.all([
        supabase.from('news_articles').select('id, relevance_score, importance_level, is_archived, product_connection', { count: 'exact' }),
        supabase.from('news_improvement_insights').select('id, status', { count: 'exact' }),
        supabase.from('news_fetch_logs').select('*').order('execution_time', { ascending: false }).limit(1),
        supabase.from('news_sources').select('id, is_active', { count: 'exact' })
      ]);

      const articles = articlesRes.data || [];
      const insights = insightsRes.data || [];
      const lastLog = logsRes.data?.[0];
      const sources = sourcesRes.data || [];

      return {
        totalArticles: articlesRes.count || 0,
        criticalNews: articles.filter(a => a.importance_level === 'critical').length,
        highRelevance: articles.filter(a => a.relevance_score >= 80).length,
        archivedCount: articles.filter(a => a.is_archived).length,
        withProductConnection: articles.filter(a => a.product_connection).length,
        pendingInsights: insights.filter(i => i.status === 'pending').length,
        totalInsights: insightsRes.count || 0,
        activeSources: sources.filter(s => s.is_active).length,
        totalSources: sourcesRes.count || 0,
        lastFetch: lastLog?.execution_time,
        lastFetchStatus: lastLog?.status
      };
    }
  });

  // Refresh news mutation
  const refreshNewsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('fetch-sector-news');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Noticias actualizadas: ${data.message}`);
      queryClient.invalidateQueries({ queryKey: ['news-admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['news-fetch-logs'] });
    },
    onError: (error) => {
      toast.error(`Error actualizando noticias: ${error.message}`);
    }
  });

  // Generate weekly report mutation
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

  const statCards = [
    { 
      label: 'Artículos Totales', 
      value: stats?.totalArticles || 0, 
      icon: FileText, 
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-blue-500/5'
    },
    { 
      label: 'Noticias Críticas', 
      value: stats?.criticalNews || 0, 
      icon: TrendingUp, 
      color: 'text-red-400',
      bgColor: 'from-red-500/10 to-red-500/5'
    },
    { 
      label: 'Alta Relevancia (80+)', 
      value: stats?.highRelevance || 0, 
      icon: BarChart3, 
      color: 'text-emerald-400',
      bgColor: 'from-emerald-500/10 to-emerald-500/5'
    },
    { 
      label: 'Con Conexión Producto', 
      value: stats?.withProductConnection || 0, 
      icon: Tag, 
      color: 'text-purple-400',
      bgColor: 'from-purple-500/10 to-purple-500/5'
    },
    { 
      label: 'Mejoras Pendientes', 
      value: stats?.pendingInsights || 0, 
      icon: Lightbulb, 
      color: 'text-amber-400',
      bgColor: 'from-amber-500/10 to-amber-500/5'
    },
    { 
      label: 'Fuentes Activas', 
      value: `${stats?.activeSources || 0}/${stats?.totalSources || 0}`, 
      icon: Database, 
      color: 'text-cyan-400',
      bgColor: 'from-cyan-500/10 to-cyan-500/5'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Sistema de Noticias</h2>
          <p className="text-slate-400 text-sm mt-1">
            Gestión completa de noticias, tendencias y mejoras detectadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generar Informe
          </Button>
          <Button
            size="sm"
            onClick={() => refreshNewsMutation.mutate()}
            disabled={refreshNewsMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshNewsMutation.isPending ? 'animate-spin' : ''}`} />
            Actualizar Noticias
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`bg-gradient-to-br ${stat.bgColor} border-slate-700/50`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-slate-400">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Last fetch info */}
      {stats?.lastFetch && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>Última actualización: {new Date(stats.lastFetch).toLocaleString('es-ES')}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            stats.lastFetchStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
            stats.lastFetchStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {stats.lastFetchStatus}
          </span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="text-xs">
            <BarChart3 className="w-4 h-4 mr-1" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="config" className="text-xs">
            <Settings className="w-4 h-4 mr-1" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="sources" className="text-xs">
            <Database className="w-4 h-4 mr-1" />
            Fuentes
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs">
            <Lightbulb className="w-4 h-4 mr-1" />
            Mejoras
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-xs">
            <Archive className="w-4 h-4 mr-1" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="reports" className="text-xs">
            <FileText className="w-4 h-4 mr-1" />
            Informes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <NewsFetchLogs />
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <NewsConfigPanel />
        </TabsContent>

        <TabsContent value="sources" className="mt-4">
          <NewsSourcesManager />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <NewsInsightsPanel />
        </TabsContent>

        <TabsContent value="archived" className="mt-4">
          <NewsArchivedList />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <NewsWeeklyReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};
