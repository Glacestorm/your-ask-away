import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  Brain,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  RefreshCw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface RetentionMetrics {
  nrr: number;
  nrrTrend: number;
  grr: number;
  grrTrend: number;
  churnRate: number;
  churnTrend: number;
  expansionRate: number;
  expansionTrend: number;
  healthyCustomers: number;
  atRiskCustomers: number;
  criticalCustomers: number;
  totalMRR: number;
  atRiskMRR: number;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  action?: string;
  estimatedValue?: number;
}

// Mock data
const mockMetrics: RetentionMetrics = {
  nrr: 112,
  nrrTrend: 3.5,
  grr: 94,
  grrTrend: -1.2,
  churnRate: 2.8,
  churnTrend: -0.5,
  expansionRate: 18,
  expansionTrend: 2.1,
  healthyCustomers: 156,
  atRiskCustomers: 23,
  criticalCustomers: 8,
  totalMRR: 485000,
  atRiskMRR: 78500
};

const mockInsights: AIInsight[] = [
  {
    id: '1',
    type: 'risk',
    title: '8 clientes con señales de churn inminente',
    description: 'Detectamos patrones de desengagement similares a clientes que cancelaron en los últimos 3 meses.',
    impact: 'high',
    confidence: 87,
    action: 'Activar playbook de retención urgente',
    estimatedValue: 45000
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Potencial de upsell en 12 cuentas',
    description: 'Clientes con alto uso que podrían beneficiarse del plan Enterprise.',
    impact: 'high',
    confidence: 82,
    action: 'Programar demos personalizadas',
    estimatedValue: 72000
  },
  {
    id: '3',
    type: 'prediction',
    title: 'NRR proyectado para Q1: 115%',
    description: 'Basado en pipeline actual y patrones históricos de expansión.',
    impact: 'medium',
    confidence: 75
  },
  {
    id: '4',
    type: 'recommendation',
    title: 'Optimizar proceso de onboarding',
    description: 'Clientes que completan onboarding en <14 días tienen 40% menos churn.',
    impact: 'medium',
    confidence: 91,
    action: 'Revisar flujo de onboarding'
  },
  {
    id: '5',
    type: 'risk',
    title: 'Segmento SMB con churn elevado',
    description: 'El churn en SMB es 2x mayor que en Enterprise. Considerar ajuste de pricing o soporte.',
    impact: 'high',
    confidence: 88,
    estimatedValue: 32000
  }
];

const retentionTrendData = [
  { month: 'Jul', nrr: 105, grr: 92, churn: 4.2 },
  { month: 'Ago', nrr: 108, grr: 93, churn: 3.8 },
  { month: 'Sep', nrr: 106, grr: 91, churn: 4.5 },
  { month: 'Oct', nrr: 110, grr: 94, churn: 3.2 },
  { month: 'Nov', nrr: 109, grr: 93, churn: 3.5 },
  { month: 'Dic', nrr: 112, grr: 94, churn: 2.8 }
];

const churnReasonsData = [
  { name: 'Precio', value: 28, color: '#ef4444' },
  { name: 'Falta de uso', value: 24, color: '#f97316' },
  { name: 'Competencia', value: 18, color: '#eab308' },
  { name: 'Soporte', value: 15, color: '#22c55e' },
  { name: 'Otros', value: 15, color: '#6366f1' }
];

const cohortRetentionData = [
  { cohort: 'Q1 2024', m1: 100, m3: 92, m6: 85, m12: 78 },
  { cohort: 'Q2 2024', m1: 100, m3: 94, m6: 88, m12: null },
  { cohort: 'Q3 2024', m1: 100, m3: 95, m6: null, m12: null },
  { cohort: 'Q4 2024', m1: 100, m3: null, m6: null, m12: null }
];

export const RetentionInsightsDashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'prediction': return <Brain className="h-4 w-4 text-purple-500" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">Alto impacto</Badge>;
      case 'medium': return <Badge variant="secondary">Medio impacto</Badge>;
      case 'low': return <Badge variant="outline">Bajo impacto</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Retention Intelligence Dashboard
          </h2>
          <p className="text-muted-foreground">
            Insights en tiempo real sobre retención y salud de clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="6m">6M</TabsTrigger>
              <TabsTrigger value="1y">1A</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Revenue Retention</p>
                <p className="text-3xl font-bold">{mockMetrics.nrr}%</p>
              </div>
              <div className={`flex items-center ${mockMetrics.nrrTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockMetrics.nrrTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                <span className="text-sm font-medium">{Math.abs(mockMetrics.nrrTrend)}%</span>
              </div>
            </div>
            <Progress value={mockMetrics.nrr} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gross Revenue Retention</p>
                <p className="text-3xl font-bold">{mockMetrics.grr}%</p>
              </div>
              <div className={`flex items-center ${mockMetrics.grrTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockMetrics.grrTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                <span className="text-sm font-medium">{Math.abs(mockMetrics.grrTrend)}%</span>
              </div>
            </div>
            <Progress value={mockMetrics.grr} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
                <p className="text-3xl font-bold">{mockMetrics.churnRate}%</p>
              </div>
              <div className={`flex items-center ${mockMetrics.churnTrend <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockMetrics.churnTrend <= 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                <span className="text-sm font-medium">{Math.abs(mockMetrics.churnTrend)}%</span>
              </div>
            </div>
            <Progress value={100 - mockMetrics.churnRate * 10} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expansion Rate</p>
                <p className="text-3xl font-bold">{mockMetrics.expansionRate}%</p>
              </div>
              <div className={`flex items-center ${mockMetrics.expansionTrend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {mockMetrics.expansionTrend >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                <span className="text-sm font-medium">{Math.abs(mockMetrics.expansionTrend)}%</span>
              </div>
            </div>
            <Progress value={mockMetrics.expansionRate * 5} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Customer Health Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">Clientes Saludables</p>
                <p className="text-2xl font-bold text-green-600">{mockMetrics.healthyCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">En Riesgo</p>
                <p className="text-2xl font-bold text-yellow-600">{mockMetrics.atRiskCustomers}</p>
                <p className="text-xs text-yellow-600">${(mockMetrics.atRiskMRR * 0.6).toLocaleString()} MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 rounded-full">
                <Shield className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-red-700 dark:text-red-400">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{mockMetrics.criticalCustomers}</p>
                <p className="text-xs text-red-600">${(mockMetrics.atRiskMRR * 0.4).toLocaleString()} MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Retention Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tendencias de Retención
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={retentionTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="nrr" name="NRR %" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Area type="monotone" dataKey="grr" name="GRR %" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Razones de Churn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={churnReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {churnReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {mockInsights.length} insights activos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {mockInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div>
                        <h4 className="font-medium">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {getImpactBadge(insight.impact)}
                          <Badge variant="outline">
                            {insight.confidence}% confianza
                          </Badge>
                          {insight.estimatedValue && (
                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                              ${insight.estimatedValue.toLocaleString()} impacto
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {insight.action && (
                      <Button size="sm" variant="outline">
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Cohort Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis de Cohortes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Cohorte</th>
                  <th className="text-center py-2 px-4">Mes 1</th>
                  <th className="text-center py-2 px-4">Mes 3</th>
                  <th className="text-center py-2 px-4">Mes 6</th>
                  <th className="text-center py-2 px-4">Mes 12</th>
                </tr>
              </thead>
              <tbody>
                {cohortRetentionData.map((cohort, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="py-3 px-4 font-medium">{cohort.cohort}</td>
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 bg-green-500/20 text-green-600 rounded">
                        {cohort.m1}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {cohort.m3 !== null ? (
                        <span className={`px-2 py-1 rounded ${cohort.m3 >= 90 ? 'bg-green-500/20 text-green-600' : cohort.m3 >= 80 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-600'}`}>
                          {cohort.m3}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {cohort.m6 !== null ? (
                        <span className={`px-2 py-1 rounded ${cohort.m6 >= 85 ? 'bg-green-500/20 text-green-600' : cohort.m6 >= 75 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-600'}`}>
                          {cohort.m6}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {cohort.m12 !== null ? (
                        <span className={`px-2 py-1 rounded ${cohort.m12 >= 75 ? 'bg-green-500/20 text-green-600' : cohort.m12 >= 65 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-600'}`}>
                          {cohort.m12}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RetentionInsightsDashboard;
