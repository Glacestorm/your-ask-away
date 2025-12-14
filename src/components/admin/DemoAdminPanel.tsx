import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, RefreshCw, Users, Building2, Calendar, Target, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DemoSession {
  id: string;
  role?: string;
  started_at: string;
  ended_at: string | null;
  cleanup_status: string;
  created_companies: number;
  created_visits: number;
  created_goals: number;
  demo_user_id: string | null;
  data_ids: any;
}

export function DemoAdminPanel() {
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningAll, setIsCleaningAll] = useState(false);
  const [cleaningSessionId, setCleaningSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_sessions')
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching demo sessions:', error);
      toast.error('Error al cargar sesiones demo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const cleanupSession = async (sessionId: string) => {
    setCleaningSessionId(sessionId);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-demo-data', {
        body: { sessionId }
      });

      if (error) throw error;
      
      toast.success('Sesión demo limpiada correctamente');
      fetchSessions();
    } catch (error) {
      console.error('Error cleaning session:', error);
      toast.error('Error al limpiar sesión demo');
    } finally {
      setCleaningSessionId(null);
    }
  };

  const cleanupAllSessions = async () => {
    setIsCleaningAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-demo-data', {
        body: { cleanupAll: true }
      });

      if (error) throw error;
      
      toast.success(`${data.sessionsCleared} sesiones demo eliminadas correctamente`);
      fetchSessions();
    } catch (error) {
      console.error('Error cleaning all sessions:', error);
      toast.error('Error al limpiar todas las sesiones demo');
    } finally {
      setIsCleaningAll(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Limpiada</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'active':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Activa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      gestor: 'bg-blue-500',
      director_oficina: 'bg-purple-500',
      admin: 'bg-orange-500'
    };
    const roleLabels: Record<string, string> = {
      gestor: 'Gestor',
      director_oficina: 'Director Oficina',
      admin: 'Administrador'
    };
    return (
      <Badge className={roleColors[role] || 'bg-gray-500'}>
        {roleLabels[role] || role}
      </Badge>
    );
  };

  const getTotalStats = () => {
    const activeSessions = sessions.filter(s => s.cleanup_status !== 'completed');
    return {
      total: sessions.length,
      active: activeSessions.length,
      companies: activeSessions.reduce((sum, s) => sum + (s.created_companies || 0), 0),
      visits: activeSessions.reduce((sum, s) => sum + (s.created_visits || 0), 0),
      goals: activeSessions.reduce((sum, s) => sum + (s.created_goals || 0), 0)
    };
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Demos</h2>
          <p className="text-muted-foreground">Administra y limpia las sesiones de demostración</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {stats.active > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isCleaningAll}>
                  {isCleaningAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Limpiar Todas ({stats.active})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    ¿Eliminar TODAS las demos?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todos los datos de demostración:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>{stats.active}</strong> sesiones de demo</li>
                      <li><strong>{stats.companies}</strong> empresas</li>
                      <li><strong>{stats.visits}</strong> visitas</li>
                      <li><strong>{stats.goals}</strong> objetivos</li>
                      <li>Más todos los datos relacionados (contactos, fichas, estados financieros, etc.)</li>
                    </ul>
                    <p className="mt-3 text-destructive font-medium">Esta acción no se puede deshacer.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={cleanupAllSessions} className="bg-destructive hover:bg-destructive/90">
                    Sí, eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Sesiones Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Sesiones Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.companies}</p>
                <p className="text-xs text-muted-foreground">Empresas Demo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.visits}</p>
                <p className="text-xs text-muted-foreground">Visitas Demo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.goals}</p>
                <p className="text-xs text-muted-foreground">Objetivos Demo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sesiones de Demostración
          </CardTitle>
          <CardDescription>
            Historial completo de todas las sesiones demo creadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones de demostración registradas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rol</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Empresas</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Objetivos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{getRoleBadge(session.role)}</TableCell>
                    <TableCell>
                      {format(new Date(session.started_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      {session.ended_at 
                        ? format(new Date(session.ended_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(session.cleanup_status)}</TableCell>
                    <TableCell className="text-right">{session.created_companies || 0}</TableCell>
                    <TableCell className="text-right">{session.created_visits || 0}</TableCell>
                    <TableCell className="text-right">{session.created_goals || 0}</TableCell>
                    <TableCell className="text-right">
                      {session.cleanup_status !== 'completed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              disabled={cleaningSessionId === session.id}
                            >
                              {cleaningSessionId === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Limpiar esta sesión demo?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Se eliminarán todos los datos creados en esta sesión de demostración.
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => cleanupSession(session.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Limpiar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
