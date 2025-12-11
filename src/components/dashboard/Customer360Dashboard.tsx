import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, TrendingUp, TrendingDown, RefreshCw, AlertTriangle, 
  CheckCircle, Clock, Phone, Mail, Calendar, Package, 
  DollarSign, Activity, Target, Zap, BarChart3, PieChart,
  ArrowRight, Star, Shield, Building2, CreditCard, FileText
} from 'lucide-react';
import { useCustomer360, Customer360Profile, CustomerInteraction } from '@/hooks/useCustomer360';
import { useCreditScoring, CreditScoreResult, CreditFactor } from '@/hooks/useCreditScoring';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar
} from 'recharts';

interface Customer360DashboardProps {
  companyId: string;
  companyName?: string;
}

export function Customer360Dashboard({ companyId, companyName }: Customer360DashboardProps) {
  const { 
    profile, 
    interactions, 
    transactions,
    isLoading, 
    isCalculating, 
    calculateProfile 
  } = useCustomer360(companyId);

  const {
    calculateScore,
    result: creditScore,
    isLoading: isCreditLoading,
    getRatingColor
  } = useCreditScoring();

  if (isLoading) {
    return <Customer360Skeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Vista 360° del Cliente
          </h2>
          {companyName && (
            <p className="text-muted-foreground">{companyName}</p>
          )}
        </div>
        <Button 
          onClick={calculateProfile} 
          disabled={isCalculating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Calculando...' : 'Actualizar Perfil'}
        </Button>
      </div>

      {!profile ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Sin perfil 360°</h3>
            <p className="text-muted-foreground">
              Haz clic en "Actualizar Perfil" para generar el análisis completo del cliente.
            </p>
            <Button onClick={calculateProfile} disabled={isCalculating}>
              {isCalculating ? 'Calculando...' : 'Generar Perfil 360°'}
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <KPICard 
              title="Health Score" 
              value={profile.health_score || 0} 
              suffix="%" 
              icon={Activity}
              color={getHealthColor(profile.health_score || 0)}
            />
            <KPICard 
              title="Churn Risk" 
              value={Math.round((profile.churn_probability || 0) * 100)} 
              suffix="%" 
              icon={AlertTriangle}
              color={getChurnColor(profile.churn_probability || 0)}
              inverse
            />
            <KPICard 
              title="RFM Score" 
              value={profile.rfm_score?.score || 0} 
              suffix="/15" 
              icon={Star}
              color="text-yellow-500"
            />
            <KPICard 
              title="CLV" 
              value={formatCurrency(profile.clv_score || 0)} 
              icon={DollarSign}
              color="text-emerald-500"
            />
            <KPICard 
              title="Productos" 
              value={profile.active_products} 
              suffix={`/${profile.total_products}`}
              icon={Package}
              color="text-blue-500"
            />
            <KPICard 
              title="Visitas" 
              value={profile.successful_visits} 
              suffix={`/${profile.total_visits}`}
              icon={CheckCircle}
              color="text-green-500"
            />
          </div>

          {/* Segment & Tier Badges */}
          <div className="flex flex-wrap gap-2">
            {profile.segment && (
              <Badge variant="outline" className="text-sm py-1 px-3">
                Segmento: <span className="font-bold ml-1">{profile.segment}</span>
              </Badge>
            )}
            {profile.tier && (
              <Badge className={getTierColor(profile.tier)}>
                Tier: {profile.tier}
              </Badge>
            )}
            {profile.lifecycle_stage && (
              <Badge variant="secondary">
                {profile.lifecycle_stage}
              </Badge>
            )}
            {profile.compliance_status && (
              <Badge variant={profile.compliance_status === 'compliant' ? 'default' : 'destructive'}>
                <Shield className="h-3 w-3 mr-1" />
                {profile.compliance_status === 'compliant' ? 'Cumplimiento OK' : 'Revisar'}
              </Badge>
            )}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="rfm">RFM</TabsTrigger>
              <TabsTrigger value="credit">Credit Score</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="transactions">Transacciones</TabsTrigger>
              <TabsTrigger value="recommendations">Acciones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <OverviewTab profile={profile} />
            </TabsContent>

            <TabsContent value="rfm" className="space-y-4">
              <RFMTab profile={profile} />
            </TabsContent>

            <TabsContent value="credit" className="space-y-4">
              <CreditScoringTab 
                companyId={companyId}
                creditScore={creditScore}
                isLoading={isCreditLoading}
                onCalculate={() => calculateScore(companyId)}
                getRatingColor={getRatingColor}
              />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <TimelineTab interactions={interactions || []} />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionsTab transactions={transactions || []} />
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <RecommendationsTab profile={profile} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Sub-components

function KPICard({ 
  title, 
  value, 
  suffix, 
  icon: Icon, 
  color,
  inverse = false 
}: { 
  title: string; 
  value: number | string; 
  suffix?: string; 
  icon: any; 
  color: string;
  inverse?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <Icon className={`h-5 w-5 ${color}`} />
        {inverse ? (
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">
          {value}{suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{title}</p>
      </div>
    </Card>
  );
}

function OverviewTab({ profile }: { profile: Customer360Profile }) {
  const summary = profile.interaction_summary;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Health Score Gauge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative pt-1">
              <Progress 
                value={profile.health_score || 0} 
                className="h-4"
              />
              <div className="flex justify-between text-xs mt-1">
                <span>Crítico</span>
                <span>Excelente</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {getHealthDescription(profile.health_score || 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Visit Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Resumen de Visitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total visitas</span>
              <span className="font-medium">{summary?.total_visits || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Últimos 30 días</span>
              <span className="font-medium">{summary?.last_30_days || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Última visita</span>
              <span className="font-medium">
                {profile.last_visit_date 
                  ? formatDistanceToNow(new Date(profile.last_visit_date), { addSuffix: true, locale: es })
                  : 'Nunca'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Frecuencia media</span>
              <span className="font-medium">
                {profile.avg_visit_frequency_days 
                  ? `${Math.round(profile.avg_visit_frequency_days)} días`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visit Results Distribution */}
      {summary?.by_result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resultado Visitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={[
                      { name: 'Positivas', value: summary.by_result.positive, fill: '#22c55e' },
                      { name: 'Negativas', value: summary.by_result.negative, fill: '#ef4444' },
                      { name: 'Pendientes', value: summary.by_result.pending, fill: '#f59e0b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels Used */}
      {summary?.channels_used && summary.channels_used.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Canales de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.channels_used.map((channel, i) => (
                <Badge key={i} variant="outline">
                  {channel}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RFMTab({ profile }: { profile: Customer360Profile }) {
  const rfm = profile.rfm_score;
  
  if (!rfm) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No hay datos RFM disponibles</p>
      </Card>
    );
  }

  const radarData = [
    { metric: 'Recencia', value: rfm.r, fullMark: 5 },
    { metric: 'Frecuencia', value: rfm.f, fullMark: 5 },
    { metric: 'Monetario', value: rfm.m, fullMark: 5 },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Análisis RFM</CardTitle>
          <CardDescription>
            Recencia, Frecuencia y Valor Monetario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 5]} />
                <Radar
                  name="RFM"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle RFM</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Recencia (R)</span>
              <span className="text-sm text-muted-foreground">{rfm.r}/5</span>
            </div>
            <Progress value={(rfm.r / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getRDescription(rfm.r)}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Frecuencia (F)</span>
              <span className="text-sm text-muted-foreground">{rfm.f}/5</span>
            </div>
            <Progress value={(rfm.f / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getFDescription(rfm.f)}
            </p>
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Monetario (M)</span>
              <span className="text-sm text-muted-foreground">{rfm.m}/5</span>
            </div>
            <Progress value={(rfm.m / 5) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {getMDescription(rfm.m)}
            </p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Score Total</span>
              <Badge className="text-lg px-3 py-1">{rfm.score}/15</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineTab({ interactions }: { interactions: CustomerInteraction[] }) {
  if (interactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay interacciones registradas</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline de Interacciones</CardTitle>
        <CardDescription>
          Historial de contactos y actividades con el cliente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {interactions.map((interaction, i) => (
              <div key={interaction.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${getInteractionColor(interaction.interaction_type)}`}>
                    {getInteractionIcon(interaction.interaction_type)}
                  </div>
                  {i < interactions.length - 1 && (
                    <div className="w-0.5 h-full bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{interaction.subject || interaction.interaction_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(interaction.interaction_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </span>
                  </div>
                  {interaction.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {interaction.description}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {interaction.channel && (
                      <Badge variant="outline" className="text-xs">{interaction.channel}</Badge>
                    )}
                    {interaction.outcome && (
                      <Badge variant={interaction.outcome === 'positive' ? 'default' : 'secondary'} className="text-xs">
                        {interaction.outcome}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TransactionsTab({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay transacciones enriquecidas</p>
      </Card>
    );
  }

  // Group by category
  const byCategory = transactions.reduce((acc, tx) => {
    const cat = tx.category || 'Sin categoría';
    if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
    acc[cat].total += Math.abs(tx.amount || 0);
    acc[cat].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const categoryData = Object.entries(byCategory).map(([name, data]: [string, { total: number; count: number }]) => ({
    name,
    value: data.total,
    count: data.count,
  }));

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {transactions.slice(0, 10).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{tx.merchant_name || tx.raw_description || 'Transacción'}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{tx.category}</Badge>
                      {tx.is_recurring && (
                        <Badge variant="secondary" className="text-xs">Recurrente</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.transaction_date), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function CreditScoringTab({ 
  companyId, 
  creditScore, 
  isLoading, 
  onCalculate,
  getRatingColor 
}: { 
  companyId: string;
  creditScore: CreditScoreResult | null;
  isLoading: boolean;
  onCalculate: () => void;
  getRatingColor: (rating: CreditScoreResult['rating']) => string;
}) {
  if (!creditScore) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <CreditCard className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">Scoring Creditici</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Calcula el scoring creditici basat en dades financeres, comportamentals i relació bancària.
          </p>
          <Button onClick={onCalculate} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Calculant...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                Calcular Score
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  const factorsData = creditScore.factors?.map(f => ({
    name: f.name.substring(0, 15),
    value: f.value,
    benchmark: f.benchmark,
    impact: f.impact
  })) || [];

  return (
    <div className="space-y-4">
      {/* Score Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Credit Score</p>
              <p className="text-5xl font-bold">{creditScore.score}</p>
              <p className="text-sm text-muted-foreground">/1000</p>
              <Progress value={creditScore.score / 10} className="h-3 mt-4" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Rating</p>
            <p className={`text-4xl font-bold mt-2 ${getRatingColor(creditScore.rating)}`}>
              {creditScore.rating}
            </p>
            <Badge variant="outline" className="mt-2">
              {getRiskLevelLabel(creditScore.riskLevel)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Probabilitat Default</p>
            <p className="text-4xl font-bold mt-2">
              {(creditScore.probability_of_default * 100).toFixed(1)}%
            </p>
            <Badge 
              variant={creditScore.probability_of_default < 0.1 ? 'default' : 'destructive'} 
              className="mt-2"
            >
              {creditScore.probability_of_default < 0.1 ? 'Baix Risc' : 'Alt Risc'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Factors Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Factors d'Avaluació</CardTitle>
            <CardDescription>Comparació amb benchmark sectorial</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" name="Actual" />
                  <Bar dataKey="benchmark" fill="hsl(var(--muted-foreground))" name="Benchmark" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Factors Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Detall Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {creditScore.factors?.map((factor, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{factor.name}</span>
                      <Badge 
                        variant={factor.impact === 'positive' ? 'default' : factor.impact === 'negative' ? 'destructive' : 'secondary'}
                      >
                        {factor.impact === 'positive' ? '↑' : factor.impact === 'negative' ? '↓' : '→'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                    <div className="flex justify-between text-xs mt-2">
                      <span>Valor: {factor.value.toFixed(2)}</span>
                      <span>Benchmark: {factor.benchmark.toFixed(2)}</span>
                      <span>Pes: {(factor.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recomanacions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditScore.recommendations && creditScore.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {creditScore.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sense recomanacions</p>
            )}
          </CardContent>
        </Card>

        {/* Explainability */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Explicabilitat (XAI)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Metodologia</p>
              <p className="text-sm">{creditScore.explainability?.methodology || 'N/A'}</p>
            </div>
            
            <div>
              <p className="text-xs text-muted-foreground mb-2">Factors Clau</p>
              <div className="flex flex-wrap gap-1">
                {creditScore.explainability?.key_drivers?.map((driver, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{driver}</Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Confiança Model</p>
                <div className="flex items-center gap-2">
                  <Progress value={(creditScore.explainability?.model_confidence || 0) * 100} className="h-2 flex-1" />
                  <span className="text-sm font-medium">
                    {((creditScore.explainability?.model_confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Qualitat Dades</p>
                <div className="flex items-center gap-2">
                  <Progress value={(creditScore.explainability?.data_quality_score || 0) * 100} className="h-2 flex-1" />
                  <span className="text-sm font-medium">
                    {((creditScore.explainability?.data_quality_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">Compliment Regulatori</p>
              <div className="flex flex-wrap gap-1">
                {creditScore.explainability?.regulatory_compliance?.map((reg, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{reg}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recalculate Button */}
      <div className="flex justify-center">
        <Button onClick={onCalculate} disabled={isLoading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Recalcular Scoring
        </Button>
      </div>
    </div>
  );
}

function getRiskLevelLabel(riskLevel: string): string {
  switch (riskLevel) {
    case 'very_low': return 'Risc Molt Baix';
    case 'low': return 'Risc Baix';
    case 'moderate': return 'Risc Moderat';
    case 'high': return 'Risc Alt';
    case 'very_high': return 'Risc Molt Alt';
    default: return riskLevel;
  }
}

function RecommendationsTab({ profile }: { profile: Customer360Profile }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Recommended Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4" />
            Productos Recomendados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.recommended_products && profile.recommended_products.length > 0 ? (
            <ul className="space-y-2">
              {profile.recommended_products.map((product, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  {product}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin recomendaciones</p>
          )}
        </CardContent>
      </Card>

      {/* Cross-sell Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Oportunidades Cross-sell
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.cross_sell_opportunities && profile.cross_sell_opportunities.length > 0 ? (
            <ul className="space-y-3">
              {profile.cross_sell_opportunities.map((opp, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{opp.product}</span>
                    <Badge variant={opp.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                      {opp.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{opp.reason}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin oportunidades</p>
          )}
        </CardContent>
      </Card>

      {/* Next Best Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Próximas Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.next_best_actions && profile.next_best_actions.length > 0 ? (
            <ul className="space-y-3">
              {profile.next_best_actions.map((action, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{action.action}</span>
                    <Badge variant={action.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                      {action.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{action.expected_impact}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin acciones pendientes</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Customer360Skeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  );
}

// Helper functions
function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getChurnColor(prob: number): string {
  if (prob <= 0.2) return 'text-green-500';
  if (prob <= 0.4) return 'text-yellow-500';
  if (prob <= 0.6) return 'text-orange-500';
  return 'text-red-500';
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'Platinum': return 'bg-slate-800 text-white';
    case 'Gold': return 'bg-yellow-500 text-white';
    case 'Silver': return 'bg-slate-400 text-white';
    default: return 'bg-amber-700 text-white';
  }
}

function getHealthDescription(score: number): string {
  if (score >= 80) return 'Cliente muy saludable con alta probabilidad de retención';
  if (score >= 60) return 'Cliente en buen estado, mantener seguimiento regular';
  if (score >= 40) return 'Cliente en riesgo moderado, requiere atención';
  return 'Cliente en riesgo alto, acción urgente necesaria';
}

function getRDescription(r: number): string {
  if (r >= 4) return 'Contacto muy reciente';
  if (r >= 3) return 'Contacto reciente';
  if (r >= 2) return 'Hace tiempo sin contacto';
  return 'Inactivo por largo período';
}

function getFDescription(f: number): string {
  if (f >= 4) return 'Cliente muy frecuente';
  if (f >= 3) return 'Frecuencia regular';
  if (f >= 2) return 'Frecuencia baja';
  return 'Muy pocas interacciones';
}

function getMDescription(m: number): string {
  if (m >= 4) return 'Alto valor monetario';
  if (m >= 3) return 'Valor medio-alto';
  if (m >= 2) return 'Valor moderado';
  return 'Bajo valor monetario';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getInteractionColor(type: string): string {
  switch (type) {
    case 'visit': return 'bg-blue-100 text-blue-600';
    case 'call': return 'bg-green-100 text-green-600';
    case 'email': return 'bg-purple-100 text-purple-600';
    case 'transaction': return 'bg-amber-100 text-amber-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getInteractionIcon(type: string) {
  const iconClass = 'h-4 w-4';
  switch (type) {
    case 'visit': return <Calendar className={iconClass} />;
    case 'call': return <Phone className={iconClass} />;
    case 'email': return <Mail className={iconClass} />;
    case 'transaction': return <DollarSign className={iconClass} />;
    default: return <Activity className={iconClass} />;
  }
}
