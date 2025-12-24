import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Target,
  Zap,
  RefreshCw,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Prediction {
  id: string;
  type: 'churn' | 'expansion' | 'renewal' | 'health_decline';
  entityName: string;
  probability: number;
  confidence: number;
  factors: Array<{
    name: string;
    impact: number;
    direction: 'positive' | 'negative';
  }>;
  recommendedActions: string[];
  timeframe: string;
}

interface PredictiveAnalyticsProps {
  className?: string;
}

// Mock predictions for demonstration
const MOCK_PREDICTIONS: Prediction[] = [
  {
    id: '1',
    type: 'churn',
    entityName: 'Acme Corp',
    probability: 78,
    confidence: 85,
    factors: [
      { name: 'NPS descendente', impact: 35, direction: 'negative' },
      { name: 'Tickets soporte +40%', impact: 25, direction: 'negative' },
      { name: 'Uso bajo features clave', impact: 20, direction: 'negative' },
      { name: 'Sin login 14 días', impact: 20, direction: 'negative' }
    ],
    recommendedActions: [
      'Agendar llamada de rescate urgente',
      'Ofrecer sesión de training gratuita',
      'Revisar tickets abiertos y resolver prioritariamente'
    ],
    timeframe: 'Próximos 30 días'
  },
  {
    id: '2',
    type: 'expansion',
    entityName: 'TechStart Inc',
    probability: 85,
    confidence: 92,
    factors: [
      { name: 'NPS = 70', impact: 30, direction: 'positive' },
      { name: 'Uso al 95% de licencias', impact: 35, direction: 'positive' },
      { name: 'Solicitudes de nuevas features', impact: 20, direction: 'positive' },
      { name: 'Renovación en 60 días', impact: 15, direction: 'positive' }
    ],
    recommendedActions: [
      'Proponer upgrade a plan Enterprise',
      'Presentar nuevas funcionalidades premium',
      'Ofrecer descuento por compromiso anual'
    ],
    timeframe: 'Próximos 60 días'
  },
  {
    id: '3',
    type: 'health_decline',
    entityName: 'Global Services',
    probability: 62,
    confidence: 78,
    factors: [
      { name: 'CSAT bajó 15 puntos', impact: 40, direction: 'negative' },
      { name: 'Engagement -20%', impact: 30, direction: 'negative' },
      { name: 'Sin respuesta a encuestas', impact: 30, direction: 'negative' }
    ],
    recommendedActions: [
      'Contactar para entender situación',
      'Revisar últimas interacciones de soporte',
      'Enviar encuesta de satisfacción personalizada'
    ],
    timeframe: 'Próximas 2 semanas'
  },
  {
    id: '4',
    type: 'renewal',
    entityName: 'DataFlow Ltd',
    probability: 92,
    confidence: 95,
    factors: [
      { name: 'NRR histórico 120%', impact: 40, direction: 'positive' },
      { name: 'Sin tickets críticos', impact: 25, direction: 'positive' },
      { name: 'Uso diario consistente', impact: 35, direction: 'positive' }
    ],
    recommendedActions: [
      'Iniciar proceso de renovación anticipada',
      'Explorar oportunidad de upsell',
      'Solicitar caso de éxito / referencia'
    ],
    timeframe: 'Próximos 90 días'
  }
];

const TYPE_CONFIG = {
  churn: {
    label: 'Riesgo Churn',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30'
  },
  expansion: {
    label: 'Oportunidad Expansión',
    icon: <TrendingUp className="h-4 w-4" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  renewal: {
    label: 'Renovación',
    icon: <RefreshCw className="h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  health_decline: {
    label: 'Declive de Salud',
    icon: <TrendingDown className="h-4 w-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  }
};

export function PredictiveAnalytics({ className }: PredictiveAnalyticsProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedPrediction, setExpandedPrediction] = useState<string | null>(null);

  const filteredPredictions = useMemo(() => {
    if (selectedType === 'all') return MOCK_PREDICTIONS;
    return MOCK_PREDICTIONS.filter(p => p.type === selectedType);
  }, [selectedType]);

  const stats = useMemo(() => ({
    churn: MOCK_PREDICTIONS.filter(p => p.type === 'churn').length,
    expansion: MOCK_PREDICTIONS.filter(p => p.type === 'expansion').length,
    renewal: MOCK_PREDICTIONS.filter(p => p.type === 'renewal').length,
    health_decline: MOCK_PREDICTIONS.filter(p => p.type === 'health_decline').length
  }), []);

  const renderPredictionCard = (prediction: Prediction) => {
    const config = TYPE_CONFIG[prediction.type];
    const isExpanded = expandedPrediction === prediction.id;

    return (
      <Card 
        key={prediction.id}
        className={cn(
          "border transition-all duration-300 cursor-pointer hover:shadow-md",
          config.borderColor,
          isExpanded && "ring-2 ring-primary/20"
        )}
        onClick={() => setExpandedPrediction(isExpanded ? null : prediction.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <span className={config.color}>{config.icon}</span>
              </div>
              <div>
                <h4 className="font-semibold">{prediction.entityName}</h4>
                <Badge variant="outline" className={cn("text-xs", config.color, config.borderColor)}>
                  {config.label}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className={cn("text-2xl font-bold", config.color)}>
                {prediction.probability}%
              </p>
              <p className="text-xs text-muted-foreground">
                Confianza: {prediction.confidence}%
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Probabilidad</span>
              <span className="text-muted-foreground">{prediction.timeframe}</span>
            </div>
            <Progress 
              value={prediction.probability} 
              className={cn("h-2", prediction.type === 'expansion' || prediction.type === 'renewal' 
                ? "[&>div]:bg-green-500" 
                : "[&>div]:bg-red-500"
              )}
            />
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="pt-3 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Factors */}
              <div>
                <p className="text-sm font-medium mb-2">Factores de influencia</p>
                <div className="space-y-2">
                  {prediction.factors.map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        factor.direction === 'positive' ? "bg-green-500" : "bg-red-500"
                      )} />
                      <span className="text-sm flex-1">{factor.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {factor.impact}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended actions */}
              <div>
                <p className="text-sm font-medium mb-2">Acciones recomendadas</p>
                <ul className="space-y-1.5">
                  {prediction.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button className="w-full" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Tomar acción
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Analytics Predictivo
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  IA 2025
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Predicciones basadas en comportamiento y métricas
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
            const config = TYPE_CONFIG[type];
            return (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(selectedType === type ? 'all' : type)}
                className={cn(
                  "justify-start gap-1.5 h-auto py-2",
                  selectedType !== type && config.borderColor
                )}
              >
                <span className={selectedType !== type ? config.color : ''}>
                  {config.icon}
                </span>
                <span className="text-xs">{stats[type]}</span>
              </Button>
            );
          })}
        </div>

        {/* Predictions list */}
        <div className="space-y-3">
          {filteredPredictions.map(renderPredictionCard)}
        </div>

        {filteredPredictions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay predicciones para este filtro</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PredictiveAnalytics;
