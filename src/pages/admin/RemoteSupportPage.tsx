import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Headphones, Play, Clock, Activity, Shield, Pause, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SessionActionsTimeline } from '@/components/admin/service-quotes/SessionActionsTimeline';
import { SessionDetailView } from '@/components/admin/remote-support/SessionDetailView';
import { SessionSummaryCard } from '@/components/admin/remote-support/SessionSummaryCard';
import { ActionQuickLog } from '@/components/admin/remote-support/ActionQuickLog';
import { useSessionActionLogger } from '@/hooks/admin/useSessionActionLogger';
import { useRemoteSupportSessions } from '@/hooks/admin/useRemoteSupportSessions';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RemoteSupportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewSessionId = searchParams.get('session');
  
  const [activeTab, setActiveTab] = useState<string>('new-session');
  const [sessionCode, setSessionCode] = useState('');
  const [clientName, setClientName] = useState('');
  
  const {
    sessions,
    activeSession,
    loading,
    isCreating,
    createSession,
    endSession,
    pauseSession,
    resumeSession,
    getTodayStats,
  } = useRemoteSupportSessions();
  
  const { 
    logSessionStart, 
    logSessionEnd, 
    logAction,
    getSessionSummary,
    isLogging 
  } = useSessionActionLogger(activeSession?.id || null);

  const stats = getTodayStats();

  const handleStartSession = async () => {
    if (!sessionCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Ingresa un código de sesión válido",
        variant: "destructive"
      });
      return;
    }

    const session = await createSession({
      sessionCode: sessionCode.trim(),
      clientName: clientName.trim() || undefined,
    });

    if (session) {
      await logSessionStart();
      setActiveTab('active-session');
      setSessionCode('');
      setClientName('');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    const summary = getSessionSummary();
    
    await logSessionEnd({
      resolution: 'completed',
      notes: `Sesión finalizada con ${summary.totalActions} acciones registradas`
    });

    await endSession(activeSession.id, {
      resolution: 'completed',
      resolutionNotes: `Sesión completada exitosamente`,
      actionsCount: summary.totalActions,
      highRiskActionsCount: summary.highRiskActions,
    });

    setActiveTab('history');
  };

  const handleCancelSession = async () => {
    if (!activeSession) return;

    await endSession(activeSession.id, {
      resolution: 'cancelled',
      resolutionNotes: 'Sesión cancelada por el operador',
    });

    setActiveTab('history');
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;
    await pauseSession(activeSession.id);
  };

  const handleResumeSession = async (sessionId: string) => {
    await resumeSession(sessionId);
    setActiveTab('active-session');
  };

  const summary = getSessionSummary();

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

  const formatDuration = (ms?: number) => {
    if (!ms) return '--';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Auto-switch to active session tab when a session becomes active
  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      setActiveTab('active-session');
    }
  }, [activeSession]);

  // If viewing a specific session, show the detail view
  if (viewSessionId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <SessionDetailView />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Headphones className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Soporte Remoto</h1>
                  <p className="text-sm text-muted-foreground">
                    Gestiona sesiones de soporte técnico remoto
                  </p>
                </div>
              </div>
            </div>
            {activeSession && activeSession.status === 'active' && (
              <Badge variant="default" className="animate-pulse">
                <Activity className="h-3 w-3 mr-1" />
                Sesión Activa
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="new-session" disabled={activeSession?.status === 'active'}>
              <Play className="h-4 w-4 mr-2" />
              Nueva Sesión
            </TabsTrigger>
            <TabsTrigger value="active-session" disabled={!activeSession || activeSession.status !== 'active'}>
              <Activity className="h-4 w-4 mr-2" />
              Sesión Activa
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-session" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Iniciar Sesión de Soporte
                </CardTitle>
                <CardDescription>
                  Ingresa el código proporcionado por el cliente para iniciar la sesión de soporte remoto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 max-w-lg">
                  <div className="space-y-2">
                    <Label htmlFor="session-code">Código de Sesión *</Label>
                    <Input
                      id="session-code"
                      placeholder="Ej: ABC-123-XYZ"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-name">Nombre del Cliente</Label>
                    <Input
                      id="client-name"
                      placeholder="Ej: Empresa ABC"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleStartSession}
                  disabled={isCreating || !sessionCode.trim()}
                  className="w-full max-w-lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isCreating ? 'Iniciando...' : 'Iniciar Sesión de Soporte'}
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sesiones Hoy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sessionsToday}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tiempo Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgDurationFormatted}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasa de Resolución
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.resolutionRate}%</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="active-session" className="space-y-6">
            {activeSession && activeSession.status === 'active' && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          Sesión: {activeSession.session_code}
                          {getStatusBadge(activeSession.status)}
                        </CardTitle>
                        <CardDescription>
                          {activeSession.client_name && `Cliente: ${activeSession.client_name} | `}
                          Iniciada: {format(new Date(activeSession.started_at), "HH:mm 'del' d 'de' MMMM", { locale: es })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={handlePauseSession}
                          disabled={isLogging}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Pausar
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelSession}
                          disabled={isLogging}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleEndSession}
                          disabled={isLogging}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Finalizar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{summary.totalActions}</div>
                        <div className="text-xs text-muted-foreground">Acciones</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{summary.totalDurationFormatted}</div>
                        <div className="text-xs text-muted-foreground">Duración</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{summary.highRiskActions}</div>
                        <div className="text-xs text-muted-foreground">Alto Riesgo</div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{summary.pendingApprovals}</div>
                        <div className="text-xs text-muted-foreground">Pendientes</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Action Log */}
                <ActionQuickLog 
                  onLogAction={logAction} 
                  isLogging={isLogging} 
                />

                {/* Session Summary */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <SessionActionsTimeline sessionId={activeSession.id} />
                  </div>
                  <SessionSummaryCard
                    totalActions={summary.totalActions}
                    totalDuration={summary.totalDurationFormatted}
                    highRiskActions={summary.highRiskActions}
                    pendingApprovals={summary.pendingApprovals}
                    completedActions={summary.totalActions - summary.pendingApprovals}
                    actionsByType={summary.actionsByType}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sesiones</CardTitle>
                <CardDescription>
                  Revisa las sesiones de soporte anteriores y sus registros de auditoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Cargando sesiones...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay sesiones registradas</p>
                    <p className="text-sm">Las sesiones completadas aparecerán aquí</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Acciones</TableHead>
                        <TableHead className="text-right">Opciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono font-medium">
                            {session.session_code}
                          </TableCell>
                          <TableCell>{session.client_name || '-'}</TableCell>
                          <TableCell>{getStatusBadge(session.status)}</TableCell>
                          <TableCell>
                            {format(new Date(session.started_at), "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell>{formatDuration(session.duration_ms)}</TableCell>
                          <TableCell>{session.actions_count}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {session.status === 'paused' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeSession(session.id)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Reanudar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/remote-support?session=${session.id}`)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
