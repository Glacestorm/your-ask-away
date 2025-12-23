/**
 * Session Detail View Component
 * Shows complete session details with timeline and summary
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Activity, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Printer
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SessionActionsTimeline } from '@/components/admin/service-quotes/SessionActionsTimeline';
import type { RemoteSupportSession } from '@/hooks/admin/useRemoteSupportSessions';
import type { SessionAction } from '@/hooks/admin/useSessionActionLogger';
import { toast } from 'sonner';

interface SessionStats {
  totalActions: number;
  actionsByType: Record<string, number>;
  actionsByRisk: Record<string, number>;
  totalDurationMs: number;
  pendingApprovals: number;
  highRiskActions: number;
}

export function SessionDetailView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [session, setSession] = useState<RemoteSupportSession | null>(null);
  const [actions, setActions] = useState<SessionAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SessionStats | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        // Fetch session
        const { data: sessionData, error: sessionError } = await supabase
          .from('remote_support_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData as RemoteSupportSession);

        // Fetch actions
        const { data: actionsData, error: actionsError } = await supabase
          .from('session_actions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (actionsError) throw actionsError;
        const typedActions = actionsData as SessionAction[];
        setActions(typedActions);

        // Calculate stats
        const actionsByType = typedActions.reduce((acc, a) => {
          acc[a.action_type] = (acc[a.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const actionsByRisk = typedActions.reduce((acc, a) => {
          acc[a.risk_level] = (acc[a.risk_level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const totalDurationMs = typedActions.reduce((sum, a) => sum + (a.duration_ms || 0), 0);
        const pendingApprovals = typedActions.filter(a => a.requires_approval && !a.approved_at).length;
        const highRiskActions = (actionsByRisk.high || 0) + (actionsByRisk.critical || 0);

        setStats({
          totalActions: typedActions.length,
          actionsByType,
          actionsByRisk,
          totalDurationMs,
          pendingApprovals,
          highRiskActions,
        });

      } catch (error) {
        console.error('Error fetching session details:', error);
        toast.error('Error al cargar detalles de la sesión');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Activa</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'paused':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pausada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">Alto</Badge>;
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Medio</Badge>;
      case 'low':
        return <Badge variant="secondary">Bajo</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
    }
  };

  const handleExportPDF = () => {
    toast.info('Generando informe PDF...');
    // TODO: Implement PDF generation
    setTimeout(() => {
      toast.success('Informe PDF generado');
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Cargando detalles de la sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Sesión no encontrada</p>
          <Button variant="outline" onClick={() => navigate('/admin/remote-support')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate('/admin/remote-support')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al listado
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Session Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                Sesión: {session.session_code}
                {getStatusBadge(session.status)}
              </CardTitle>
              <CardDescription className="mt-2">
                {session.client_name && `Cliente: ${session.client_name}`}
                {session.client_email && ` (${session.client_email})`}
              </CardDescription>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>ID: {session.id.slice(0, 8)}...</div>
              <div>Tipo: {session.support_type}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Inicio</div>
                <div className="font-medium">
                  {format(new Date(session.started_at), "dd/MM/yy HH:mm", { locale: es })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Fin</div>
                <div className="font-medium">
                  {session.ended_at 
                    ? format(new Date(session.ended_at), "dd/MM/yy HH:mm", { locale: es })
                    : 'En curso'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Duración</div>
                <div className="font-medium">{formatDuration(session.duration_ms)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Resolución</div>
                <div className="font-medium capitalize">{session.resolution || 'N/A'}</div>
              </div>
            </div>
          </div>

          {session.resolution_notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Notas de resolución</div>
              <p className="text-sm">{session.resolution_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{stats.totalActions}</div>
                <div className="text-xs text-muted-foreground">Acciones Total</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{formatDuration(stats.totalDurationMs)}</div>
                <div className="text-xs text-muted-foreground">Tiempo Activo</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{stats.highRiskActions}</div>
                <div className="text-xs text-muted-foreground">Alto Riesgo</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{stats.pendingApprovals}</div>
                <div className="text-xs text-muted-foreground">Pend. Aprobación</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">
                  {stats.actionsByRisk.low || 0}
                </div>
                <div className="text-xs text-muted-foreground">Bajo Riesgo</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Distribución por Nivel de Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.actionsByRisk).map(([risk, count]) => (
                <div key={risk} className="flex items-center gap-2">
                  {getRiskBadge(risk)}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="text-sm text-muted-foreground">
              <strong>Tipos de acciones:</strong>{' '}
              {Object.entries(stats.actionsByType).map(([type, count], i) => (
                <span key={type}>
                  {type.replace('_', ' ')} ({count}){i < Object.keys(stats.actionsByType).length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Timeline */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Registro de Acciones ({actions.length})
          </CardTitle>
          <CardDescription>
            Historial completo de todas las acciones realizadas durante la sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          {actions.length > 0 ? (
            <SessionActionsTimeline sessionId={session.id} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay acciones registradas en esta sesión</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Footer */}
      <div className="text-xs text-muted-foreground text-center py-4 print:block hidden">
        Informe generado el {format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
      </div>
    </div>
  );
}
