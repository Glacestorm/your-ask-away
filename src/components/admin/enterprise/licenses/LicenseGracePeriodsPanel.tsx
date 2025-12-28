/**
 * License Grace Periods Panel
 * Gestión de períodos de gracia para licencias
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  Plus,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Key,
  Timer,
  Pause,
  Play,
  Info
} from 'lucide-react';
import { useLicenseGrace } from '@/hooks/admin/enterprise/useLicenseGrace';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function LicenseGracePeriodsPanel() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    license_id: '',
    grace_days: 7,
    reason: '',
    notify_customer: true
  });

  const {
    gracePeriods,
    loading,
    fetchGracePeriods,
    createGracePeriod,
    cancelGracePeriod
  } = useLicenseGrace();

  useEffect(() => {
    fetchGracePeriods();
  }, []);

  const handleCreateGrace = async () => {
    if (!formData.license_id) {
      toast.error('Seleccione una licencia');
      return;
    }

    const success = await createGracePeriod({
      license_id: formData.license_id,
      grace_days: formData.grace_days,
      reason: formData.reason
    });

    if (success) {
      setIsCreateOpen(false);
      setFormData({
        license_id: '',
        grace_days: 7,
        reason: '',
        notify_customer: true
      });
    }
  };

  const handleCancel = async (graceId: string) => {
    if (confirm('¿Está seguro de cancelar este período de gracia?')) {
      await cancelGracePeriod(graceId);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20"><Play className="h-3 w-3 mr-1" />Activo</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateProgress = (grace: typeof gracePeriods[0]) => {
    const start = new Date(grace.created_at);
    const end = new Date(grace.grace_end_date);
    const now = new Date();
    
    const totalDays = differenceInDays(end, start);
    const daysElapsed = differenceInDays(now, start);
    const daysRemaining = Math.max(0, differenceInDays(end, now));
    
    return {
      totalDays: totalDays || 1,
      daysElapsed,
      daysRemaining,
      percentage: Math.min(100, Math.max(0, (daysElapsed / (totalDays || 1)) * 100))
    };
  };

  const activeCount = gracePeriods.filter(g => g.status === 'active').length;
  const expiringCount = gracePeriods.filter(g => {
    if (g.status !== 'active') return false;
    const days = differenceInDays(new Date(g.grace_end_date), new Date());
    return days <= 3 && days >= 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Períodos Activos</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximos a Expirar</p>
                <p className="text-2xl font-bold">{expiringCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-500/5 border-gray-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelados</p>
                <p className="text-2xl font-bold">{gracePeriods.filter(g => g.status === 'cancelled').length}</p>
              </div>
              <Pause className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirados</p>
                <p className="text-2xl font-bold">{gracePeriods.filter(g => g.status === 'expired').length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Períodos de Gracia
              </CardTitle>
              <CardDescription>
                Gestione períodos de gracia para licencias expiradas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchGracePeriods()}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Período
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Período de Gracia</DialogTitle>
                    <DialogDescription>
                      Otorgue tiempo adicional a una licencia expirada
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="license">ID de Licencia *</Label>
                      <Input
                        id="license"
                        placeholder="Ingrese el ID de la licencia"
                        value={formData.license_id}
                        onChange={e => setFormData({ ...formData, license_id: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="days">Días de Gracia *</Label>
                      <Select
                        value={String(formData.grace_days)}
                        onValueChange={v => setFormData({ ...formData, grace_days: Number(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 días</SelectItem>
                          <SelectItem value="7">7 días</SelectItem>
                          <SelectItem value="14">14 días</SelectItem>
                          <SelectItem value="30">30 días</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason">Motivo</Label>
                      <Textarea
                        id="reason"
                        placeholder="Describa el motivo..."
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-lg flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <p className="text-xs text-muted-foreground">
                        El período comenzará inmediatamente.
                      </p>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateGrace}>
                      Crear Período
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Licencia</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gracePeriods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay períodos de gracia
                    </TableCell>
                  </TableRow>
                ) : (
                  gracePeriods.map(grace => {
                    const progress = calculateProgress(grace);
                    return (
                      <TableRow key={grace.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Key className="h-4 w-4 text-primary" />
                            </div>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {grace.license_id.slice(0, 8)}...
                            </code>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{format(new Date(grace.created_at), 'dd/MM/yy')}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{format(new Date(grace.grace_end_date), 'dd/MM/yy')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-32 space-y-1">
                            <Progress value={progress.percentage} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {grace.status === 'active' 
                                ? `${progress.daysRemaining} días restantes`
                                : 'Finalizado'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {grace.reason ? (
                            <p className="text-sm max-w-[200px] truncate" title={grace.reason}>
                              {grace.reason}
                            </p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(grace.status)}</TableCell>
                        <TableCell className="text-right">
                          {grace.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleCancel(grace.id)}
                              title="Cancelar período"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseGracePeriodsPanel;
