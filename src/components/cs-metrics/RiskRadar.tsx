/**
 * Risk Radar 360
 * Visualización radar de múltiples dimensiones de riesgo
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';

interface RiskDimension {
  dimension: string;
  fullName: string;
  current: number;
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

const mockRiskData: RiskDimension[] = [
  { dimension: 'Engagement', fullName: 'Engagement Risk', current: 35, benchmark: 20, trend: 'up', impact: 'high', description: 'Riesgo por bajo engagement digital' },
  { dimension: 'Usage', fullName: 'Usage Decline', current: 28, benchmark: 15, trend: 'up', impact: 'critical', description: 'Caída en uso del producto' },
  { dimension: 'Support', fullName: 'Support Issues', current: 42, benchmark: 25, trend: 'stable', impact: 'medium', description: 'Tickets de soporte elevados' },
  { dimension: 'Payment', fullName: 'Payment Risk', current: 15, benchmark: 10, trend: 'down', impact: 'low', description: 'Riesgo de impago' },
  { dimension: 'Satisfaction', fullName: 'Satisfaction Drop', current: 45, benchmark: 20, trend: 'up', impact: 'critical', description: 'Caída en NPS/CSAT' },
  { dimension: 'Competition', fullName: 'Competitive Risk', current: 30, benchmark: 25, trend: 'stable', impact: 'medium', description: 'Evaluando competidores' },
  { dimension: 'Champion', fullName: 'Champion Loss', current: 55, benchmark: 15, trend: 'up', impact: 'critical', description: 'Pérdida de sponsor interno' },
  { dimension: 'Adoption', fullName: 'Low Adoption', current: 38, benchmark: 20, trend: 'down', impact: 'high', description: 'Baja adopción de features' },
];

interface RiskAlert {
  id: string;
  customerId: string;
  customerName: string;
  riskScore: number;
  primaryRisk: string;
  mrr: number;
  daysAtRisk: number;
}

const mockAlerts: RiskAlert[] = [
  { id: '1', customerId: 'c1', customerName: 'TechCorp Enterprise', riskScore: 82, primaryRisk: 'Champion Loss', mrr: 15000, daysAtRisk: 14 },
  { id: '2', customerId: 'c2', customerName: 'Global Finance Ltd', riskScore: 75, primaryRisk: 'Usage Decline', mrr: 28000, daysAtRisk: 7 },
  { id: '3', customerId: 'c3', customerName: 'InnovateTech', riskScore: 68, primaryRisk: 'Satisfaction Drop', mrr: 8500, daysAtRisk: 21 },
  { id: '4', customerId: 'c4', customerName: 'MegaRetail Co', riskScore: 65, primaryRisk: 'Low Adoption', mrr: 12000, daysAtRisk: 30 },
];

const getImpactColor = (impact: string): string => {
  switch (impact) {
    case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30';
    case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
    default: return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  }
};

const getRiskScoreColor = (score: number): string => {
  if (score >= 70) return 'text-red-500';
  if (score >= 50) return 'text-orange-500';
  if (score >= 30) return 'text-amber-500';
  return 'text-emerald-500';
};

export function RiskRadar() {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);

  const criticalCount = useMemo(() => 
    mockRiskData.filter(r => r.impact === 'critical').length, 
    []
  );

  const totalMrrAtRisk = useMemo(() => 
    mockAlerts.reduce((sum, a) => sum + a.mrr, 0),
    []
  );

  const avgRiskScore = useMemo(() => 
    Math.round(mockRiskData.reduce((sum, r) => sum + r.current, 0) / mockRiskData.length),
    []
  );

  const radarData = useMemo(() => 
    mockRiskData.map(r => ({
      ...r,
      current: r.current,
      benchmark: r.benchmark,
    })),
    []
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Risk Radar 360°</CardTitle>
              <p className="text-sm text-muted-foreground">
                Análisis multidimensional de riesgos de churn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedSegment} onValueChange={setSelectedSegment}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="mid-market">Mid-Market</SelectItem>
                <SelectItem value="smb">SMB</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="border-red-500/50 text-red-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalCount} críticos
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-muted-foreground">MRR en Riesgo</p>
            <p className="text-2xl font-bold text-red-500">€{(totalMrrAtRisk / 1000).toFixed(0)}K</p>
          </div>
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-xs text-muted-foreground">Cuentas en Riesgo</p>
            <p className="text-2xl font-bold text-orange-500">{mockAlerts.length}</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-muted-foreground">Risk Score Promedio</p>
            <p className="text-2xl font-bold text-amber-500">{avgRiskScore}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Dimensiones Críticas</p>
            <p className="text-2xl font-bold">{criticalCount}/8</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Mapa de Riesgo
            </h4>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="dimension" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                  />
                  <Radar
                    name="Benchmark"
                    dataKey="benchmark"
                    stroke="hsl(142 76% 36%)"
                    fill="hsl(142 76% 36%)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Radar
                    name="Riesgo Actual"
                    dataKey="current"
                    stroke="hsl(0 84% 60%)"
                    fill="hsl(0 84% 60%)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Dimensions */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Dimensiones de Riesgo
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {mockRiskData
                .sort((a, b) => b.current - a.current)
                .map((risk) => (
                <div
                  key={risk.dimension}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedDimension === risk.dimension 
                      ? "ring-2 ring-primary bg-primary/5" 
                      : "hover:bg-muted/50",
                    getImpactColor(risk.impact)
                  )}
                  onClick={() => setSelectedDimension(
                    selectedDimension === risk.dimension ? null : risk.dimension
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{risk.fullName}</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {risk.impact}
                      </Badge>
                    </div>
                    <span className={cn("text-lg font-bold", getRiskScoreColor(risk.current))}>
                      {risk.current}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{risk.description}</span>
                    <span className="flex items-center gap-1">
                      {risk.trend === 'up' && <TrendingDown className="h-3 w-3 text-red-500 rotate-180" />}
                      {risk.trend === 'down' && <TrendingDown className="h-3 w-3 text-emerald-500" />}
                      {risk.trend === 'stable' && <span className="w-3 h-0.5 bg-muted-foreground rounded" />}
                      vs {risk.benchmark} benchmark
                    </span>
                  </div>
                  {/* Risk Bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        risk.current >= 50 ? "bg-red-500" : risk.current >= 30 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${risk.current}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* High Risk Accounts */}
        <div className="mt-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Cuentas de Alto Riesgo
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {mockAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl border bg-gradient-to-r from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{alert.customerName}</span>
                  <Badge variant="destructive" className="text-xs">
                    Score: {alert.riskScore}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">MRR</p>
                    <p className="font-medium">€{alert.mrr.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Riesgo Principal</p>
                    <p className="font-medium">{alert.primaryRisk}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Días en Riesgo</p>
                    <p className="font-medium text-red-500">{alert.daysAtRisk}</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Ver Playbook
                  </Button>
                  <Button size="sm" className="flex-1 h-7 text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    Contactar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/20">
          <h4 className="font-medium mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
            <Zap className="h-4 w-4" />
            Acciones Prioritarias IA
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">1</span>
              <span>Agendar llamada urgente con TechCorp (sponsor perdido hace 14 días)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">2</span>
              <span>Enviar análisis de valor a Global Finance (uso en declive)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">3</span>
              <span>Programar QBR anticipado con InnovateTech (NPS cayendo)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RiskRadar;
