import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFeedbackLoops } from '@/hooks/useFeedbackLoops';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowUpRight,
  RefreshCw,
  User,
  Building2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FeedbackLoopDashboardProps {
  companyId?: string;
  compact?: boolean;
}

export function FeedbackLoopDashboard({ companyId, compact = false }: FeedbackLoopDashboardProps) {
  const { 
    feedbackLoops, 
    stats, 
    isLoading, 
    processAction, 
    isProcessing,
    getStatusColor,
    getStatusLabel,
    getPriorityColor,
  } = useFeedbackLoops();

  const filteredLoops = companyId 
    ? feedbackLoops?.filter(loop => loop.company_id === companyId)
    : feedbackLoops;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {!compact && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Abiertos</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">En Progreso</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Recuperados</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.recovered}</p>
              <p className="text-xs text-muted-foreground">
                {stats.recoveryRate}% tasa de recuperación
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">SLA Incumplido</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.slaBreach}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Loops List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Bucles de Feedback
            {filteredLoops && filteredLoops.length > 0 && (
              <Badge variant="secondary">{filteredLoops.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
            <div className="space-y-3">
              {filteredLoops?.map((loop) => (
                <Card key={loop.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(loop.status)}>
                          {getStatusLabel(loop.status)}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(loop.priority)}>
                          {loop.priority}
                        </Badge>
                        {loop.sla_breached && (
                          <Badge variant="destructive">SLA Incumplido</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        {loop.company && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{loop.company.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span>Score original: </span>
                          <span className="font-medium text-foreground">
                            {loop.original_score}
                          </span>
                        </div>
                        {loop.recovery_score && (
                          <div className="flex items-center gap-1 text-green-600">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>Recuperado: {loop.recovery_score}</span>
                          </div>
                        )}
                      </div>

                      {loop.root_cause && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Causa raíz:</strong> {loop.root_cause}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Creado {formatDistanceToNow(new Date(loop.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </span>
                        {loop.sla_deadline && (
                          <span>
                            SLA: {format(new Date(loop.sla_deadline), 'dd MMM HH:mm', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {loop.status !== 'recovered' && loop.status !== 'resolved' && (
                      <div className="flex flex-col gap-2">
                        {loop.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => processAction({ 
                              feedbackId: loop.id, 
                              action: 'start_followup' 
                            })}
                          >
                            Iniciar
                          </Button>
                        )}
                        {loop.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => processAction({ 
                              feedbackId: loop.id, 
                              action: 'mark_contacted' 
                            })}
                          >
                            Contactado
                          </Button>
                        )}
                        {(loop.status === 'contacted' || loop.status === 'in_progress') && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              disabled={isProcessing}
                              onClick={() => processAction({ 
                                feedbackId: loop.id, 
                                action: 'mark_recovered' 
                              })}
                            >
                              Recuperado
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isProcessing}
                              onClick={() => processAction({ 
                                feedbackId: loop.id, 
                                action: 'escalate' 
                              })}
                            >
                              Escalar
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {(!filteredLoops || filteredLoops.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay bucles de feedback activos</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
