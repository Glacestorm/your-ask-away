import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, CheckCircle, XCircle, AlertTriangle, 
  FileText, Database, Timer
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FetchLog {
  id: string;
  execution_time: string;
  duration_ms: number;
  articles_fetched: number;
  articles_processed: number;
  articles_saved: number;
  errors: string[] | null;
  warnings: string[] | null;
  sources_status: Record<string, { fetched: number; relevant: number; error?: string }> | null;
  status: string;
}

export const NewsFetchLogs: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['news-fetch-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_fetch_logs')
        .select('*')
        .order('execution_time', { ascending: false })
        .limit(20) as { data: FetchLog[] | null; error: any };
      if (error) throw error;
      return data as FetchLog[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'completed_with_errors':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      success: 'bg-emerald-500/20 text-emerald-400',
      failed: 'bg-red-500/20 text-red-400',
      completed_with_errors: 'bg-amber-500/20 text-amber-400',
      pending: 'bg-slate-500/20 text-slate-400'
    };
    const labels: Record<string, string> = {
      success: 'Éxito',
      failed: 'Error',
      completed_with_errors: 'Con errores',
      pending: 'Pendiente'
    };
    return (
      <Badge className={styles[status] || styles.pending}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Historial de Ejecuciones</h3>
        <span className="text-sm text-slate-400">Últimas 20 ejecuciones</span>
      </div>

      {logs?.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No hay logs de ejecución</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-3">
            {logs?.map((log) => (
              <Card key={log.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="text-sm font-medium text-white">
                          {format(new Date(log.execution_time), 'dd MMM yyyy, HH:mm', { locale: es })}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(log.execution_time), { locale: es, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(log.status)}
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Timer className="w-3 h-3" />
                        {(log.duration_ms / 1000).toFixed(1)}s
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="bg-slate-900/50 p-2 rounded text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400">
                        <Database className="w-3 h-3" />
                        <span className="text-lg font-bold">{log.articles_fetched}</span>
                      </div>
                      <p className="text-xs text-slate-500">Obtenidos</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-400">
                        <FileText className="w-3 h-3" />
                        <span className="text-lg font-bold">{log.articles_processed}</span>
                      </div>
                      <p className="text-xs text-slate-500">Procesados</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded text-center">
                      <div className="flex items-center justify-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-lg font-bold">{log.articles_saved}</span>
                      </div>
                      <p className="text-xs text-slate-500">Guardados</p>
                    </div>
                  </div>

                  {/* Sources Status */}
                  {log.sources_status && Object.keys(log.sources_status).length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-slate-400 mb-2">Estado por fuente:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(log.sources_status).map(([name, status]) => (
                          <Badge 
                            key={name}
                            variant="outline"
                            className={`text-xs ${
                              status.error ? 'border-red-500/50 text-red-400' : 
                              status.relevant > 0 ? 'border-emerald-500/50 text-emerald-400' : 
                              'border-slate-500/50 text-slate-400'
                            }`}
                          >
                            {name}: {status.relevant}/{status.fetched}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors */}
                  {log.errors && log.errors.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                      <p className="text-xs text-red-400 font-medium mb-1">Errores:</p>
                      {log.errors.map((error, i) => (
                        <p key={i} className="text-xs text-red-300">{error}</p>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {log.warnings && log.warnings.length > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mt-2">
                      <p className="text-xs text-amber-400 font-medium mb-1">Advertencias:</p>
                      {log.warnings.map((warning, i) => (
                        <p key={i} className="text-xs text-amber-300">{warning}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
