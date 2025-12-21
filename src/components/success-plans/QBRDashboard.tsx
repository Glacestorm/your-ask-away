import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  Video,
  ChevronRight,
  Plus
} from 'lucide-react';
import { useSuccessPlans, QBRRecord } from '@/hooks/useSuccessPlans';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface QBRDashboardProps {
  companyId: string;
}

const statusColors = {
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-muted text-muted-foreground',
};

export function QBRDashboard({ companyId }: QBRDashboardProps) {
  const {
    qbrRecords,
    loadingQBRs,
    generateQBR,
    isGeneratingQBR,
    scheduleQBR,
    getUpcomingQBRs,
  } = useSuccessPlans(companyId);

  const [selectedQBR, setSelectedQBR] = useState<QBRRecord | null>(null);

  const upcomingQBRs = getUpcomingQBRs();
  const completedQBRs = qbrRecords?.filter(q => q.status === 'completed') || [];

  const getCurrentQuarter = () => {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  };

  const handleGenerateQBR = () => {
    generateQBR({
      companyId,
      quarter: getCurrentQuarter(),
      year: new Date().getFullYear(),
    });
  };

  if (loadingQBRs) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Quarterly Business Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Revisa el progreso y planifica el próximo trimestre
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleGenerateQBR}
            disabled={isGeneratingQBR}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGeneratingQBR ? 'Generando...' : 'Generar QBR con IA'}
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Programar QBR
          </Button>
        </div>
      </div>

      {/* Upcoming QBRs */}
      {upcomingQBRs.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximos QBRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingQBRs.map((qbr) => {
                const isUrgent = qbr.scheduled_date && isBefore(new Date(qbr.scheduled_date), addDays(new Date(), 7));
                
                return (
                  <div
                    key={qbr.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      isUrgent && 'border-yellow-500/50 bg-yellow-500/5'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'p-3 rounded-lg',
                        isUrgent ? 'bg-yellow-500/20' : 'bg-primary/10'
                      )}>
                        <Calendar className={cn(
                          'h-5 w-5',
                          isUrgent ? 'text-yellow-500' : 'text-primary'
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">
                          {qbr.quarter} {qbr.year}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {qbr.scheduled_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(qbr.scheduled_date), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                          )}
                          {qbr.attendees && qbr.attendees.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {qbr.attendees.length} asistentes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border', statusColors[qbr.status as keyof typeof statusColors])}>
                        {qbr.status}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedQBR(qbr)}>
                            Ver detalles
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>QBR {qbr.quarter} {qbr.year}</DialogTitle>
                          </DialogHeader>
                          <QBRDetails qbr={qbr} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed QBRs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de QBRs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completedQBRs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay QBRs completados aún</p>
              <p className="text-sm">Genera tu primer QBR con IA para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedQBRs.map((qbr) => (
                <div
                  key={qbr.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedQBR(qbr)}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {qbr.quarter} {qbr.year}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {qbr.actual_date && (
                          <span>
                            Completado el {format(new Date(qbr.actual_date), 'dd MMM yyyy', { locale: es })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {qbr.health_score_at_review !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-semibold">{qbr.health_score_at_review}</p>
                        <p className="text-xs text-muted-foreground">Health Score</p>
                      </div>
                    )}
                    {qbr.nps_at_review !== undefined && (
                      <div className="text-right">
                        <p className="text-lg font-semibold">{qbr.nps_at_review}</p>
                        <p className="text-xs text-muted-foreground">NPS</p>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QBRDetails({ qbr }: { qbr: QBRRecord }) {
  return (
    <div className="space-y-6 max-h-[60vh] overflow-y-auto">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {qbr.health_score_at_review !== undefined && (
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{qbr.health_score_at_review}</div>
            <div className="text-xs text-muted-foreground">Health Score</div>
          </div>
        )}
        {qbr.nps_at_review !== undefined && (
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{qbr.nps_at_review}</div>
            <div className="text-xs text-muted-foreground">NPS</div>
          </div>
        )}
        {qbr.customer_satisfaction_score !== undefined && (
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{qbr.customer_satisfaction_score}</div>
            <div className="text-xs text-muted-foreground">CSAT</div>
          </div>
        )}
      </div>

      {/* Achievements */}
      {qbr.achievements && qbr.achievements.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Logros del Trimestre
          </h4>
          <div className="space-y-2">
            {qbr.achievements.map((achievement, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="font-medium text-sm">{achievement.achievement}</p>
                <p className="text-xs text-muted-foreground">{achievement.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges */}
      {qbr.challenges && qbr.challenges.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Desafíos
          </h4>
          <div className="space-y-2">
            {qbr.challenges.map((challenge, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{challenge.challenge}</p>
                  <Badge variant="outline" className="text-xs">{challenge.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{challenge.action_plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Quarter Goals */}
      {qbr.next_quarter_goals && qbr.next_quarter_goals.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Objetivos Próximo Trimestre
          </h4>
          <div className="space-y-2">
            {qbr.next_quarter_goals.map((goal, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-medium text-sm">{goal.title}</p>
                <p className="text-xs text-muted-foreground">{goal.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {qbr.ai_generated_recommendations && qbr.ai_generated_recommendations.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Recomendaciones IA
          </h4>
          <div className="space-y-2">
            {qbr.ai_generated_recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                <Badge variant="outline" className="text-xs shrink-0">{rec.priority}</Badge>
                <p className="text-sm">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Risk Assessment */}
      {qbr.ai_risk_assessment && (
        <div className="p-3 rounded-lg bg-muted/50 border">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Evaluación de Riesgo IA
          </h4>
          <Badge className={cn(
            qbr.ai_risk_assessment.level === 'high' && 'bg-red-500',
            qbr.ai_risk_assessment.level === 'medium' && 'bg-yellow-500',
            qbr.ai_risk_assessment.level === 'low' && 'bg-green-500'
          )}>
            Riesgo {qbr.ai_risk_assessment.level}
          </Badge>
          {qbr.ai_risk_assessment.factors && (
            <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
              {qbr.ai_risk_assessment.factors.map((factor, idx) => (
                <li key={idx}>{factor}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Summary */}
      {qbr.ai_generated_summary && (
        <div className="p-3 rounded-lg bg-muted/30 border-dashed border">
          <h4 className="font-medium mb-2">Resumen Ejecutivo</h4>
          <p className="text-sm text-muted-foreground">{qbr.ai_generated_summary}</p>
        </div>
      )}
    </div>
  );
}
