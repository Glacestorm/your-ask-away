import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BookOpen, 
  Brain, 
  MessageCircle, 
  LayoutGrid,
  GitMerge,
  Download,
  Sparkles,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  DollarSign,
  Activity
} from 'lucide-react';
import { CSMetricsDashboard } from '@/components/cs-metrics/CSMetricsDashboard';
import { CSMetricsAssistant } from '@/components/cs-metrics/CSMetricsAssistant';
import { PredictiveAnalytics } from '@/components/cs-metrics/PredictiveAnalytics';
import { MetricsCorrelationMatrix } from '@/components/cs-metrics/MetricsCorrelationMatrix';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

// Mock data for analytics
const metricsOverview = [
  { name: 'NPS', value: 72, benchmark: 65, trend: 'up', color: '#10B981' },
  { name: 'NRR', value: 118, benchmark: 100, trend: 'up', color: '#8B5CF6' },
  { name: 'Churn', value: 2.3, benchmark: 5, trend: 'down', color: '#EF4444' },
  { name: 'CSAT', value: 4.5, benchmark: 4.0, trend: 'up', color: '#F59E0B' },
];

const categoryData = [
  { name: 'Percepción', value: 35, color: '#10B981' },
  { name: 'Retención', value: 25, color: '#8B5CF6' },
  { name: 'Valor', value: 20, color: '#3B82F6' },
  { name: 'Engagement', value: 20, color: '#F59E0B' },
];

const trendData = [
  { month: 'Ene', nps: 65, nrr: 105, churn: 3.2 },
  { month: 'Feb', nps: 68, nrr: 108, churn: 2.9 },
  { month: 'Mar', nps: 70, nrr: 112, churn: 2.6 },
  { month: 'Abr', nps: 72, nrr: 118, churn: 2.3 },
];

const healthDistribution = [
  { range: '0-20', count: 5, color: '#EF4444' },
  { range: '21-40', count: 12, color: '#F59E0B' },
  { range: '41-60', count: 25, color: '#FBBF24' },
  { range: '61-80', count: 35, color: '#10B981' },
  { range: '81-100', count: 23, color: '#059669' },
];

export default function CSMetricsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('CS Metrics Report', 14, 25);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 35);
    
    doc.setTextColor(0, 0, 0);
    let yPos = 55;
    
    // Métricas Principales
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Principales', 14, yPos);
    yPos += 15;
    
    metricsOverview.forEach((metric, i) => {
      const xPos = 14 + (i % 2) * 95;
      const boxY = yPos + Math.floor(i / 2) * 30;
      
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(xPos, boxY, 90, 25, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.name, xPos + 5, boxY + 10);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${metric.value}${metric.name === 'NRR' ? '%' : metric.name === 'Churn' ? '%' : ''}`, xPos + 5, boxY + 21);
      
      doc.setFontSize(9);
      doc.setTextColor(metric.trend === 'up' ? 16 : 239, metric.trend === 'up' ? 185 : 68, metric.trend === 'up' ? 129 : 68);
      doc.text(metric.trend === 'up' ? '↑' : '↓', xPos + 75, boxY + 21);
      doc.setTextColor(0, 0, 0);
    });
    
    yPos += 70;
    
    // Análisis por Categoría
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Distribución por Categoría', 14, yPos);
    yPos += 12;
    
    categoryData.forEach(cat => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• ${cat.name}: ${cat.value}%`, 20, yPos);
      yPos += 8;
    });
    
    yPos += 10;
    
    // Tendencias
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Tendencias Recientes', 14, yPos);
    yPos += 12;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('• NPS: +7 puntos en los últimos 4 meses', 20, yPos);
    yPos += 8;
    doc.text('• NRR: +13% de mejora trimestral', 20, yPos);
    yPos += 8;
    doc.text('• Churn: Reducción del 28% (3.2% → 2.3%)', 20, yPos);
    yPos += 15;
    
    // Recomendaciones
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones IA', 14, yPos);
    yPos += 12;
    
    const recommendations = [
      '1. Implementar programa de advocacy para promotores NPS',
      '2. Revisar clientes con Health Score < 40',
      '3. Optimizar onboarding para reducir Time-to-Value',
      '4. Crear playbooks de expansion para cuentas con alto engagement',
    ];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach(rec => {
      doc.text(rec, 14, yPos);
      yPos += 8;
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Reporte generado por CS Metrics Knowledge Hub', 14, 285);
    
    doc.save(`cs-metrics-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Reporte PDF exportado correctamente');
  }, []);

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
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
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
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
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

        {/* Analytics Tab - NEW */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricsOverview.map((metric) => (
              <Card key={metric.name} className="relative overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {metric.value}{metric.name === 'NRR' || metric.name === 'Churn' ? '%' : ''}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${metric.trend === 'up' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {metric.trend === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Benchmark: {metric.benchmark}{metric.name === 'NRR' || metric.name === 'Churn' ? '%' : ''}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: metric.color }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart - Distribución por Categoría */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Distribución por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Line Chart - Tendencias */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Evolución de Métricas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="nps" name="NPS" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="nrr" name="NRR" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Health Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Distribución Health Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={healthDistribution}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" name="Clientes" radius={[4, 4, 0, 0]}>
                        {healthDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Area Chart - Churn Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Tendencia de Churn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="churn" 
                        name="Churn %" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Insights IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-700 dark:text-green-400">Positivo</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    NRR ha aumentado 13 puntos en el último trimestre, superando el benchmark de la industria.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">Oportunidad</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    17 clientes en el rango 41-60 de Health Score podrían convertirse en promotores con intervención proactiva.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-700 dark:text-blue-400">Revenue</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    La correlación NPS-Expansion sugiere €45K potenciales en upsells de promotores actuales.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
