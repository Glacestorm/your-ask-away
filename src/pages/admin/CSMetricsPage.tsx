import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Brain, 
  MessageCircle, 
  LayoutGrid,
  GitMerge,
  Download,
  Sparkles
} from 'lucide-react';
import { CSMetricsDashboard } from '@/components/cs-metrics/CSMetricsDashboard';
import { CSMetricsAssistant } from '@/components/cs-metrics/CSMetricsAssistant';
import { PredictiveAnalytics } from '@/components/cs-metrics/PredictiveAnalytics';
import { MetricsCorrelationMatrix } from '@/components/cs-metrics/MetricsCorrelationMatrix';

export default function CSMetricsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            CS Metrics Knowledge Hub
          </h1>
          <p className="text-muted-foreground mt-1">
            Centro de conocimiento y análisis de métricas Customer Success
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            Incluye métricas 2025
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap h-auto p-1">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Asistente IA</span>
          </TabsTrigger>
          <TabsTrigger value="predictive" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Predictivo</span>
          </TabsTrigger>
          <TabsTrigger value="correlations" className="gap-2">
            <GitMerge className="h-4 w-4" />
            <span className="hidden sm:inline">Correlaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="mt-4">
          <CSMetricsDashboard />
        </TabsContent>

        {/* Assistant Tab */}
        <TabsContent value="assistant" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <CSMetricsAssistant />
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Capacidades del Asistente
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span><strong>Explicar métricas</strong>: Definiciones, fórmulas y contexto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span><strong>Calcular valores</strong>: Ayuda con cálculos paso a paso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span><strong>Interpretar resultados</strong>: Qué significa tu valor y cómo mejorarlo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span><strong>Comparar benchmarks</strong>: Tu posición vs la industria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                    <span><strong>Recomendar acciones</strong>: Pasos concretos para mejorar</span>
                  </li>
                </ul>
              </div>

              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <h3 className="font-semibold mb-3">Ejemplos de preguntas</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>"¿Qué es el NRR y por qué es importante?"</li>
                  <li>"Mi churn es 8% mensual, ¿es malo?"</li>
                  <li>"¿Cómo calculo el CLV si tengo ARPU de €200 y duración media de 18 meses?"</li>
                  <li>"¿Cuál debería ser mi objetivo de Quick Ratio?"</li>
                  <li>"¿Cómo se relaciona el NPS con el churn?"</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Predictive Tab */}
        <TabsContent value="predictive" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <PredictiveAnalytics />
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl p-6 border border-purple-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Sobre el Analytics Predictivo
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Nuestro sistema de IA analiza patrones de comportamiento, métricas históricas
                  y señales de engagement para predecir eventos futuros.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium">🎯 Predicción de Churn</p>
                    <p className="text-xs text-muted-foreground">
                      Identifica clientes con alto riesgo de abandono antes de que ocurra
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium">📈 Oportunidades de Expansión</p>
                    <p className="text-xs text-muted-foreground">
                      Detecta clientes listos para upsell basándose en su uso y satisfacción
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium">🔄 Probabilidad de Renovación</p>
                    <p className="text-xs text-muted-foreground">
                      Anticipa renovaciones exitosas o problemáticas
                    </p>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <p className="text-sm font-medium">❤️ Declive de Salud</p>
                    <p className="text-xs text-muted-foreground">
                      Alerta temprana cuando un cliente está perdiendo engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <MetricsCorrelationMatrix />
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-6 border border-border/50">
                <h3 className="font-semibold mb-3">¿Por qué importan las correlaciones?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Entender cómo se relacionan las métricas te permite:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span>Priorizar esfuerzos en métricas con mayor impacto downstream</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span>Identificar indicadores adelantados de problemas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span>Construir modelos predictivos más precisos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <span>Demostrar ROI de iniciativas de CS</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl p-6 border border-blue-500/20">
                <h3 className="font-semibold mb-3">Correlaciones más importantes</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                    <span className="text-sm">Health Score → Churn</span>
                    <Badge variant="outline" className="text-red-500 border-red-500/30">-0.85</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                    <span className="text-sm">TTV → Activación</span>
                    <Badge variant="outline" className="text-red-500 border-red-500/30">-0.82</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                    <span className="text-sm">NPS → NRR</span>
                    <Badge variant="outline" className="text-green-500 border-green-500/30">+0.78</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                    <span className="text-sm">NPS → Churn</span>
                    <Badge variant="outline" className="text-red-500 border-red-500/30">-0.72</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
