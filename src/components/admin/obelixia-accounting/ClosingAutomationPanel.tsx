/**
 * Closing Automation Panel - Phase 15
 * Automated accounting closing management
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Play,
  RotateCcw,
  FileText,
  Lock,
  Unlock,
  Settings,
  ListChecks,
  Zap
} from 'lucide-react';
import { useObelixiaClosingAutomation } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ClosingAutomationPanel() {
  const [activeTab, setActiveTab] = useState('periods');
  
  const {
    isLoading,
    isProcessing,
    periods,
    activePeriod,
    checklist,
    validations,
    adjustments,
    fetchPeriods,
    fetchChecklist,
    executeAutomatedTask
  } = useObelixiaClosingAutomation();

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  useEffect(() => {
    if (activePeriod?.id) {
      fetchChecklist(activePeriod.id);
    }
  }, [activePeriod, fetchChecklist]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'passed':
      case 'closed': 
        return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'pending': 
      case 'open':
        return 'bg-yellow-500 text-black';
      case 'failed': 
      case 'blocked':
        return 'bg-destructive text-destructive-foreground';
      case 'locked': return 'bg-primary text-primary-foreground';
      case 'pending_review': return 'bg-orange-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      closed: 'Cerrado',
      locked: 'Bloqueado',
      in_progress: 'En Proceso',
      pending: 'Pendiente',
      open: 'Abierto',
      pending_review: 'En Revisión',
      completed: 'Completado',
      passed: 'Aprobado',
      failed: 'Fallido',
      warning: 'Advertencia',
      proposed: 'Propuesto',
      approved: 'Aprobado',
      posted: 'Contabilizado',
      rejected: 'Rechazado'
    };
    return labels[status] || status;
  };

  // Get tasks from checklist
  const tasks = checklist?.categories.flatMap(cat => cat.tasks) || [];
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  const getPeriodLabel = (period: typeof periods[0]) => {
    if (period.type === 'monthly' && period.month) {
      return `${format(new Date(period.year, period.month - 1), 'MMMM yyyy', { locale: es })}`;
    }
    if (period.type === 'quarterly' && period.quarter) {
      return `Q${period.quarter} ${period.year}`;
    }
    return `Año ${period.year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Calendar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cierre Contable Automatizado</h1>
            <p className="text-muted-foreground">
              Gestión inteligente de cierres periódicos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Button size="sm" disabled={isProcessing}>
            <Zap className="h-4 w-4 mr-2" />
            Iniciar Cierre
          </Button>
        </div>
      </div>

      {/* Current Period Status */}
      {activePeriod && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Período Actual: {getPeriodLabel(activePeriod)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(activePeriod.startDate), 'dd MMM yyyy', { locale: es })} - 
                    {format(new Date(activePeriod.endDate), 'dd MMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold">{Math.round(progressPercentage)}%</p>
                  <p className="text-xs text-muted-foreground">Completado</p>
                </div>
                <Badge className={getStatusColor(activePeriod.status)}>
                  {getStatusLabel(activePeriod.status)}
                </Badge>
              </div>
            </div>
            <Progress value={progressPercentage} className="mt-4 h-2" />
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Períodos
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Tareas
          </TabsTrigger>
          <TabsTrigger value="validations" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Validaciones
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Ajustes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Períodos</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {periods.map((period) => (
                    <div key={period.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            period.status === 'closed' || period.status === 'locked' 
                              ? "bg-green-500/10" : "bg-primary/10"
                          )}>
                            {period.status === 'closed' || period.status === 'locked' ? 
                              <Lock className="h-5 w-5 text-green-500" /> :
                              <Unlock className="h-5 w-5 text-primary" />
                            }
                          </div>
                          <div>
                            <h4 className="font-medium">{getPeriodLabel(period)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(period.startDate), 'dd/MM/yyyy')} - {format(new Date(period.endDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(period.status)}>
                            {getStatusLabel(period.status)}
                          </Badge>
                          {(period.status === 'closed' || period.status === 'locked') && (
                            <Button variant="ghost" size="sm">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {periods.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>No hay períodos registrados</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Tareas de Cierre</CardTitle>
              <Button variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Ejecutar Todas
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            task.status === 'completed' ? "bg-green-500 text-white" :
                            task.status === 'in_progress' ? "bg-blue-500 text-white" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {task.status === 'completed' ? <CheckCircle className="h-4 w-4" /> : index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{task.name}</h4>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.category}</Badge>
                          {task.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => executeAutomatedTask(task.id)}
                            >
                              Ejecutar
                            </Button>
                          )}
                        </div>
                      </div>
                      {task.status === 'in_progress' && (
                        <Progress value={50} className="mt-3 h-1" />
                      )}
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListChecks className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>No hay tareas de cierre pendientes</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validations" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Validaciones Automáticas</CardTitle>
              <Button variant="outline" size="sm">
                <CheckCircle className="h-4 w-4 mr-2" />
                Validar Todo
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {validations.map((validation) => (
                    <div key={validation.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            validation.status === 'passed' ? "bg-green-500/10" :
                            validation.status === 'failed' ? "bg-destructive/10" :
                            validation.status === 'warning' ? "bg-yellow-500/10" :
                            "bg-muted"
                          )}>
                            {validation.status === 'passed' ? 
                              <CheckCircle className="h-5 w-5 text-green-500" /> :
                              validation.status === 'failed' ?
                              <AlertTriangle className="h-5 w-5 text-destructive" /> :
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            }
                          </div>
                          <div>
                            <h4 className="font-medium">{validation.name}</h4>
                            <p className="text-sm text-muted-foreground">{validation.description}</p>
                            {validation.recommendation && (
                              <p className={cn(
                                "text-xs mt-1",
                                validation.status === 'failed' ? "text-destructive" :
                                validation.status === 'warning' ? "text-yellow-600" :
                                "text-green-600"
                              )}>
                                {validation.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(validation.status)}>
                          {getStatusLabel(validation.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {validations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>No hay validaciones configuradas</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Ajustes de Cierre</CardTitle>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Nuevo Ajuste
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {adjustments.map((adjustment) => (
                    <div key={adjustment.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{adjustment.type}</Badge>
                            <Badge className={getStatusColor(adjustment.status)}>
                              {getStatusLabel(adjustment.status)}
                            </Badge>
                          </div>
                          <h4 className="font-medium mt-2">{adjustment.description}</h4>
                          <p className="text-sm text-muted-foreground">
                            Monto: €{adjustment.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {format(new Date(adjustment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                      </div>
                    </div>
                  ))}
                  {adjustments.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p>No hay ajustes registrados</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClosingAutomationPanel;
