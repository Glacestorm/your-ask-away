import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Key, 
  Activity, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Square,
  History,
  Settings,
  Wifi,
  WifiOff,
  Lock,
  Unlock
} from 'lucide-react';
import { useRemoteAccessSessions, RemoteAccessSession, ClientInstallation } from '@/hooks/admin/useClientInstallations';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface RemoteAccessManagerProps {
  installation: ClientInstallation;
  onUpdate?: () => void;
}

export function RemoteAccessManager({ installation, onUpdate }: RemoteAccessManagerProps) {
  const { sessions, loading, createSession, endSession } = useRemoteAccessSessions(installation.id);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<RemoteAccessSession | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [newSessionType, setNewSessionType] = useState<string>('support');
  const [pinInput, setPinInput] = useState('');
  const [validatingPin, setValidatingPin] = useState(false);

  const sessionTypes = [
    { value: 'support', label: 'Soporte Técnico', icon: Shield },
    { value: 'update', label: 'Actualización', icon: Activity },
    { value: 'repair', label: 'Reparación', icon: Settings },
    { value: 'diagnostic', label: 'Diagnóstico', icon: Activity },
    { value: 'modification', label: 'Modificación', icon: Settings }
  ];

  const getSessionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500"><Play className="h-3 w-3 mr-1" />Activa</Badge>;
      case 'completed':
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleRemoteAccess = async (enabled: boolean) => {
    try {
      await supabase
        .from('client_installations')
        .update({ remote_access_allowed: enabled })
        .eq('id', installation.id);

      toast.success(enabled ? 'Acceso remoto habilitado' : 'Acceso remoto deshabilitado');
      onUpdate?.();
    } catch (error) {
      console.error('Error toggling remote access:', error);
      toast.error('Error al cambiar el acceso remoto');
    }
  };

  const handleGeneratePin = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_remote_access_pin', {
        p_installation_id: installation.id,
        p_valid_hours: 24
      });

      if (error) throw error;
      toast.success(`PIN generado: ${data}`);
      onUpdate?.();
    } catch (error) {
      console.error('Error generating PIN:', error);
      toast.error('Error al generar el PIN');
    }
  };

  const handleValidateAndStartSession = async () => {
    setValidatingPin(true);
    try {
      const { data: isValid, error } = await supabase.rpc('validate_remote_access_pin', {
        p_installation_id: installation.id,
        p_pin: pinInput
      });

      if (error) throw error;

      if (!isValid) {
        toast.error('PIN inválido o expirado');
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('No estás autenticado');
        return;
      }

      // Create the session
      await createSession({
        installation_id: installation.id,
        support_user_id: user.id,
        session_type: newSessionType,
        session_status: 'active',
        started_at: new Date().toISOString(),
        client_notified_at: new Date().toISOString()
      });

      setShowPinDialog(false);
      setShowStartDialog(false);
      setPinInput('');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('Error al iniciar la sesión');
    } finally {
      setValidatingPin(false);
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    await endSession(selectedSession.id, sessionNotes);
    setShowEndDialog(false);
    setSelectedSession(null);
    setSessionNotes('');
  };

  const activeSessions = sessions.filter(s => s.session_status === 'active');
  const completedSessions = sessions.filter(s => s.session_status === 'completed');

  return (
    <div className="space-y-6">
      {/* Remote Access Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Estado del Acceso Remoto
          </CardTitle>
          <CardDescription>
            Controla el acceso remoto para esta instalación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {installation.remote_access_allowed ? (
                <Wifi className="h-6 w-6 text-green-500" />
              ) : (
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {installation.remote_access_allowed ? 'Acceso Remoto Habilitado' : 'Acceso Remoto Deshabilitado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {installation.remote_access_allowed 
                    ? 'Los técnicos pueden conectarse con un PIN válido'
                    : 'No se permiten conexiones remotas'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={installation.remote_access_allowed}
              onCheckedChange={handleToggleRemoteAccess}
            />
          </div>

          {installation.remote_access_allowed && (
            <>
              {/* PIN Section */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    <span className="font-medium">PIN de Acceso</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGeneratePin}>
                    <Key className="h-4 w-4 mr-2" />
                    Generar Nuevo PIN
                  </Button>
                </div>

                {installation.remote_access_pin ? (
                  <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                    <div>
                      <code className="text-2xl font-mono font-bold tracking-widest">
                        {installation.remote_access_pin}
                      </code>
                      {installation.remote_access_pin_expires_at && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Expira {formatDistanceToNow(new Date(installation.remote_access_pin_expires_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={new Date(installation.remote_access_pin_expires_at || '') > new Date() 
                        ? 'default' 
                        : 'destructive'
                      }
                    >
                      {new Date(installation.remote_access_pin_expires_at || '') > new Date() 
                        ? <Unlock className="h-3 w-3 mr-1" />
                        : <Lock className="h-3 w-3 mr-1" />
                      }
                      {new Date(installation.remote_access_pin_expires_at || '') > new Date() 
                        ? 'Válido' 
                        : 'Expirado'
                      }
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay un PIN activo. Genera uno para permitir el acceso remoto.
                  </p>
                )}
              </div>

              {/* Active Sessions Alert */}
              {activeSessions.length > 0 && (
                <Alert className="border-green-500/20 bg-green-500/10">
                  <Activity className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Hay {activeSessions.length} sesión(es) activa(s) en esta instalación.
                  </AlertDescription>
                </Alert>
              )}

              {/* Start Session Button */}
              <Button 
                className="w-full" 
                onClick={() => setShowStartDialog(true)}
                disabled={!installation.remote_access_pin || new Date(installation.remote_access_pin_expires_at || '') < new Date()}
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Sesión de Soporte
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <Card className="border-green-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Sesiones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <User className="h-8 w-8" />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      </div>
                      <div>
                        <p className="font-medium">{session.support_user?.full_name || 'Técnico'}</p>
                        <p className="text-sm text-muted-foreground">
                          {sessionTypes.find(t => t.value === session.session_type)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Iniciada hace {formatDistanceToNow(new Date(session.started_at || ''), { locale: es })}
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          setSelectedSession(session);
                          setShowEndDialog(true);
                        }}
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Finalizar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Sesiones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Activity className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay sesiones registradas</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {sessionTypes.find(t => t.value === session.session_type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{session.support_user?.full_name || 'N/A'}</TableCell>
                      <TableCell>
                        {session.started_at && format(new Date(session.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {session.started_at && session.ended_at ? (
                          formatDistanceToNow(new Date(session.started_at), { locale: es })
                        ) : session.session_status === 'active' ? (
                          <span className="text-green-500">En curso</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getSessionStatusBadge(session.session_status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Start Session Dialog */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar Sesión de Soporte</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de sesión que vas a realizar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Sesión</Label>
              <Select value={newSessionType} onValueChange={setNewSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Necesitarás el PIN de acceso del cliente para continuar.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              setShowStartDialog(false);
              setShowPinDialog(true);
            }}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Validation Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Introducir PIN de Acceso</DialogTitle>
            <DialogDescription>
              Introduce el PIN proporcionado por el cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>PIN de 6 dígitos</Label>
              <Input
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPinDialog(false);
              setPinInput('');
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleValidateAndStartSession}
              disabled={pinInput.length !== 6 || validatingPin}
            >
              {validatingPin ? 'Validando...' : 'Iniciar Sesión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Session Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Sesión</DialogTitle>
            <DialogDescription>
              Añade notas sobre las acciones realizadas durante la sesión
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notas de la Sesión</Label>
              <Textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Describe las acciones realizadas..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEndDialog(false);
              setSelectedSession(null);
              setSessionNotes('');
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEndSession}>
              Finalizar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
