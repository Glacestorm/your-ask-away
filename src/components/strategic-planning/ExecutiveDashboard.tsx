import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, FileText, Calculator, TrendingUp, 
  CheckCircle, AlertCircle, Clock, ArrowRight,
  Sparkles, BarChart3
} from 'lucide-react';
import { useDafoAnalysis, useBusinessPlanEvaluation, useFinancialPlan } from '@/hooks/useStrategicPlanning';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface ExecutiveDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function ExecutiveDashboard({ onNavigate }: ExecutiveDashboardProps) {
  const { analyses, items } = useDafoAnalysis();
  const { evaluations, sections } = useBusinessPlanEvaluation();
  const { plans, scenarios, ratios } = useFinancialPlan();

  // Calculate KPIs
  const totalDafoAnalyses = analyses.length;
  const completedDafo = analyses.filter(a => a.status === 'completed').length;
  const totalDafoItems = items.length;

  const totalEvaluations = evaluations.length;
  const avgScore = evaluations.length > 0 
    ? evaluations.reduce((sum, e) => sum + e.total_score, 0) / evaluations.length 
    : 0;
  const excellentPlans = evaluations.filter(e => e.viability_level === 'excellent' || e.viability_level === 'good').length;

  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.status === 'active' || p.status === 'draft').length;
  const totalScenarios = scenarios.length;

  // Chart data
  const dafoDistribution = [
    { name: 'Fortalezas', value: items.filter(i => i.category === 'strengths').length, color: '#22c55e' },
    { name: 'Debilidades', value: items.filter(i => i.category === 'weaknesses').length, color: '#ef4444' },
    { name: 'Oportunidades', value: items.filter(i => i.category === 'opportunities').length, color: '#3b82f6' },
    { name: 'Amenazas', value: items.filter(i => i.category === 'threats').length, color: '#f97316' }
  ];

  const evaluationScores = evaluations.slice(0, 5).map(e => ({
    name: e.project_name.substring(0, 15),
    score: e.total_score
  }));

  // Alerts/Recommendations
  const alerts = [];
  if (totalDafoAnalyses === 0) {
    alerts.push({ type: 'info', message: 'Crea tu primer análisis DAFO para comenzar', action: 'dafo' });
  }
  if (totalEvaluations > 0 && avgScore < 50) {
    alerts.push({ type: 'warning', message: 'Puntuación media de Business Plans por debajo del 50%', action: 'business-plan' });
  }
  if (totalPlans > 0 && totalScenarios === 0) {
    alerts.push({ type: 'info', message: 'Genera escenarios para tus planes financieros', action: 'scenarios' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Dashboard Ejecutivo
          </h2>
          <p className="text-muted-foreground">Visión consolidada de tu planificación estratégica</p>
        </div>
        <Badge variant="outline" className="text-xs">
          Última actualización: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </Badge>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                alert.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {alert.type === 'warning' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-blue-600" />
                )}
                <span className="text-sm">{alert.message}</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => onNavigate?.(alert.action)}>
                Ir <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate?.('dafo')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="secondary">{completedDafo}/{totalDafoAnalyses}</Badge>
            </div>
            <p className="text-2xl font-bold mt-3">{totalDafoItems}</p>
            <p className="text-sm text-muted-foreground">Elementos DAFO</p>
            <Progress value={totalDafoAnalyses > 0 ? (completedDafo / totalDafoAnalyses) * 100 : 0} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate?.('business-plan')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant={avgScore >= 70 ? 'default' : avgScore >= 50 ? 'secondary' : 'destructive'}>
                {avgScore.toFixed(0)}%
              </Badge>
            </div>
            <p className="text-2xl font-bold mt-3">{totalEvaluations}</p>
            <p className="text-sm text-muted-foreground">Business Plans</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500" />
              {excellentPlans} con viabilidad alta
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate?.('financial')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calculator className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="outline">{activePlans} activos</Badge>
            </div>
            <p className="text-2xl font-bold mt-3">{totalPlans}</p>
            <p className="text-sm text-muted-foreground">Planes Financieros</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {ratios.length} ratios calculados
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => onNavigate?.('scenarios')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <Badge variant="outline">{scenarios.length}</Badge>
            </div>
            <p className="text-2xl font-bold mt-3">{totalScenarios}</p>
            <p className="text-sm text-muted-foreground">Escenarios</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              VAN, TIR, Payback calculados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribución DAFO</CardTitle>
          </CardHeader>
          <CardContent>
            {totalDafoItems > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dafoDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dafoDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Sin datos DAFO</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {dafoDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Puntuación Business Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {evaluationScores.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evaluationScores} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">Sin evaluaciones</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate?.('dafo')}>
              <Target className="h-4 w-4" /> Nuevo DAFO
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate?.('business-plan')}>
              <FileText className="h-4 w-4" /> Evaluar Plan
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate?.('financial')}>
              <Calculator className="h-4 w-4" /> Modelo Financiero
            </Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onNavigate?.('scenarios')}>
              <TrendingUp className="h-4 w-4" /> Simular Escenarios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
