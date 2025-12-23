import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Headphones, Play, Clock, Activity, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SessionActionsTimeline } from '@/components/admin/service-quotes/SessionActionsTimeline';
import { useSessionActionLogger } from '@/hooks/admin/useSessionActionLogger';
import { toast } from '@/hooks/use-toast';

export default function RemoteSupportPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('new-session');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const { 
    logSessionStart, 
    logSessionEnd, 
    getSessionSummary,
    isLogging 
  } = useSessionActionLogger(sessionId);

  const handleStartSession = async () => {
    if (!sessionCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Ingresa un código de sesión válido",
        variant: "destructive"
      });
      return;
    }

    const newSessionId = `session_${Date.now()}_${sessionCode}`;
    setSessionId(newSessionId);
    setIsSessionActive(true);
    
    await logSessionStart();

    toast({
      title: "Sesión iniciada",
      description: `Sesión de soporte remoto activa: ${sessionCode}`,
    });

    setActiveTab('active-session');
  };

  const handleEndSession = async () => {
    const summary = getSessionSummary();
    
    await logSessionEnd({
      resolution: 'completed',
      notes: `Sesión finalizada con ${summary.totalActions} acciones registradas`
    });

    toast({
      title: "Sesión finalizada",
      description: `Duración: ${summary.totalDurationFormatted}`,
    });

    setIsSessionActive(false);
    setSessionId(null);
    setSessionCode('');
    setActiveTab('history');
  };

  const summary = getSessionSummary();

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
            {isSessionActive && (
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
            <TabsTrigger value="new-session" disabled={isSessionActive}>
              <Play className="h-4 w-4 mr-2" />
              Nueva Sesión
            </TabsTrigger>
            <TabsTrigger value="active-session" disabled={!isSessionActive}>
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
                <div className="space-y-2">
                  <Label htmlFor="session-code">Código de Sesión</Label>
                  <Input
                    id="session-code"
                    placeholder="Ej: ABC-123-XYZ"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    className="max-w-sm font-mono"
                  />
                </div>
                <Button 
                  onClick={handleStartSession}
                  disabled={isLogging || !sessionCode.trim()}
                  className="w-full max-w-sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Sesión de Soporte
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
                  <div className="text-2xl font-bold">0</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tiempo Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tasa de Resolución
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="active-session" className="space-y-6">
            {isSessionActive && sessionId && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Sesión: {sessionCode}</h2>
                    <p className="text-sm text-muted-foreground">
                      Duración: {summary.totalDurationFormatted} | Acciones: {summary.totalActions}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleEndSession}
                    disabled={isLogging}
                  >
                    Finalizar Sesión
                  </Button>
                </div>

                <SessionActionsTimeline sessionId={sessionId} />
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
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay sesiones registradas</p>
                  <p className="text-sm">Las sesiones completadas aparecerán aquí</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
