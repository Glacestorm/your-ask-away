import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  TrendingDown,
  Users,
  RefreshCw,
  Shield,
  Target,
  Zap,
  ChevronRight,
  Activity,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useAcademiaChurnPrediction, ChurnPrediction, ChurnIntervention } from '@/hooks/academia/useAcademiaChurnPrediction';
import { cn } from '@/lib/utils';

interface ChurnPredictionPanelProps {
  courseId?: string;
  className?: string;
}

export function ChurnPredictionPanel({ courseId, className }: ChurnPredictionPanelProps) {
  const [selectedStudent, setSelectedStudent] = useState<ChurnPrediction | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    predictions,
    riskFactors,
    interventions,
    isLoading,
    predictChurn,
    getRiskFactors,
    getInterventions,
    getRiskColor,
    getHighRiskStudents
  } = useAcademiaChurnPrediction();

  useEffect(() => {
    if (courseId) {
      predictChurn(courseId);
    }
  }, [courseId, predictChurn]);

  const handleSelectStudent = async (prediction: ChurnPrediction) => {
    setSelectedStudent(prediction);
    await Promise.all([
      getRiskFactors(prediction.user_id, prediction.course_id),
      getInterventions(prediction.user_id, prediction.course_id)
    ]);
  };

  const highRiskStudents = getHighRiskStudents();

  const getRiskIcon = (level: ChurnPrediction['risk_level']) => {
    switch (level) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <TrendingDown className="h-4 w-4" />;
      case 'medium': return <Activity className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-4", className)}>
      {/* Panel de Lista de Estudiantes */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Riesgo de Abandono
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => courseId && predictChurn(courseId)}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
          {highRiskStudents.length > 0 && (
            <Badge variant="destructive" className="w-fit">
              {highRiskStudents.length} estudiantes en riesgo alto
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <button
                  key={prediction.user_id}
                  onClick={() => handleSelectStudent(prediction)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    "hover:bg-muted/50",
                    selectedStudent?.user_id === prediction.user_id && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm truncate">
                      Usuario {prediction.user_id.slice(0, 8)}...
                    </span>
                    <Badge className={getRiskColor(prediction.risk_level)}>
                      {getRiskIcon(prediction.risk_level)}
                      <span className="ml-1 capitalize">{prediction.risk_level}</span>
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Probabilidad de abandono</span>
                      <span className="font-medium">{Math.round(prediction.churn_probability * 100)}%</span>
                    </div>
                    <Progress 
                      value={prediction.churn_probability * 100} 
                      className="h-1.5"
                    />
                  </div>
                  {prediction.predicted_churn_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Predicción: {new Date(prediction.predicted_churn_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </button>
              ))}
              {predictions.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay predicciones disponibles</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Panel de Detalles */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {selectedStudent ? 'Análisis Detallado' : 'Selecciona un estudiante'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedStudent ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="factors">Factores</TabsTrigger>
                <TabsTrigger value="interventions">Intervenciones</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold text-destructive">
                      {Math.round(selectedStudent.churn_probability * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Prob. Abandono</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold">
                      {Math.round(selectedStudent.confidence * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Confianza</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-2xl font-bold">
                      {selectedStudent.risk_factors.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Factores</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Badge className={cn("text-lg px-3 py-1", getRiskColor(selectedStudent.risk_level))}>
                      {selectedStudent.risk_level}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">Nivel</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Señales de Alerta Temprana
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.early_warning_signals.map((signal, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {signal}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="factors">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {riskFactors?.risk_factors.map((factor, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{factor.factor}</span>
                          <Badge variant={factor.severity === 'critical' ? 'destructive' : 'secondary'}>
                            {factor.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{factor.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span>Actual: <strong>{factor.current_value}</strong></span>
                          <span>Umbral: <strong>{factor.threshold_value}</strong></span>
                          <Badge variant="outline" className={cn(
                            factor.trend === 'improving' && 'text-green-600',
                            factor.trend === 'declining' && 'text-red-600'
                          )}>
                            {factor.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="interventions">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {interventions?.interventions.map((intervention, idx) => (
                      <InterventionCard key={idx} intervention={intervention} />
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Selecciona un estudiante para ver el análisis detallado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InterventionCard({ intervention }: { intervention: ChurnIntervention }) {
  const getTypeIcon = () => {
    switch (intervention.type) {
      case 'automated': return <Zap className="h-4 w-4" />;
      case 'personal': return <MessageSquare className="h-4 w-4" />;
      case 'content': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-3 rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          <span className="font-medium text-sm">{intervention.action}</span>
        </div>
        <Badge variant="outline">
          Impacto: {Math.round(intervention.expected_impact * 100)}%
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{intervention.message_template}</p>
      <div className="flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {intervention.timing}
        </span>
        <Badge variant="secondary" className="text-xs">
          Esfuerzo: {intervention.effort_required}
        </Badge>
      </div>
      <Button variant="ghost" size="sm" className="w-full mt-2">
        Ejecutar Intervención
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

export default ChurnPredictionPanel;
