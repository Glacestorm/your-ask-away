import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy, TrendingUp, Medal, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { subMonths } from 'date-fns';

interface GestorPerformance {
  gestorId: string;
  gestorName: string;
  gestorEmail: string;
  avatarUrl: string | null;
  revenueScore: number;
  affiliationScore: number;
  commissionScore: number;
  overallScore: number;
  totalTerminals: number;
  totalRevenue: number;
  avgAffiliation: number;
  avgCommission: number;
  achievedGoals: number;
  totalGoals: number;
  rank: number;
}

export function TPVGestorRanking() {
  const [rankings, setRankings] = useState<GestorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(6);
  const [selectedMetric, setSelectedMetric] = useState<'overall' | 'revenue' | 'affiliation' | 'commission'>('overall');

  useEffect(() => {
    fetchRankings();
  }, [timeRange]);

  const fetchRankings = async () => {
    try {
      setLoading(true);

      const startDate = subMonths(new Date(), timeRange).toISOString();
      const endDate = new Date().toISOString();

      // Fetch all gestors
      const { data: gestors, error: gestorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url');

      if (gestorsError) throw gestorsError;

      // Fetch goals for the period
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('metric_type', ['tpv_revenue', 'tpv_affiliation', 'tpv_commission'])
        .gte('period_end', startDate)
        .lte('period_start', endDate);

      if (goalsError) throw goalsError;

      // Calculate performance for each gestor
      const performances: GestorPerformance[] = await Promise.all(
        gestors?.map(async (gestor) => {
          // Get companies for this gestor
          const { data: companies } = await supabase
            .from('companies')
            .select('id')
            .eq('gestor_id', gestor.id);

          const companyIds = companies?.map(c => c.id) || [];

          if (companyIds.length === 0) {
            return {
              gestorId: gestor.id,
              gestorName: gestor.full_name || gestor.email,
              gestorEmail: gestor.email,
              avatarUrl: gestor.avatar_url,
              revenueScore: 0,
              affiliationScore: 0,
              commissionScore: 0,
              overallScore: 0,
              totalTerminals: 0,
              totalRevenue: 0,
              avgAffiliation: 0,
              avgCommission: 0,
              achievedGoals: 0,
              totalGoals: 0,
              rank: 0,
            };
          }

          // Get TPV terminals
          const { data: terminals } = await supabase
            .from('company_tpv_terminals' as any)
            .select('annual_revenue, affiliation_percentage, active, id')
            .in('company_id', companyIds);

          const activeTerminals = terminals?.filter((t: any) => t.active) || [];
          const totalRevenue = terminals?.reduce((sum: number, t: any) => sum + (t.annual_revenue || 0), 0) || 0;
          const avgAffiliation = activeTerminals.length > 0
            ? activeTerminals.reduce((sum: number, t: any) => sum + (t.affiliation_percentage || 0), 0) / activeTerminals.length
            : 0;

          // Get commission rates
          const terminalIds = terminals?.map((t: any) => t.id) || [];
          const { data: commissions } = await supabase
            .from('tpv_commission_rates' as any)
            .select('*')
            .in('terminal_id', terminalIds)
            .eq('card_type', 'NACIONAL');

          const avgCommission = commissions && commissions.length > 0
            ? commissions.reduce((sum: number, c: any) => sum + c.commission_rate, 0) / commissions.length
            : 0;

          // Calculate scores based on goals
          let revenueScore = 0;
          let affiliationScore = 0;
          let commissionScore = 0;
          let achievedGoals = 0;

          const revenueGoals = goals?.filter((g: any) => g.metric_type === 'tpv_revenue') || [];
          const affiliationGoals = goals?.filter((g: any) => g.metric_type === 'tpv_affiliation') || [];
          const commissionGoals = goals?.filter((g: any) => g.metric_type === 'tpv_commission') || [];

          if (revenueGoals.length > 0) {
            const avgTarget = revenueGoals.reduce((sum: number, g: any) => sum + g.target_value, 0) / revenueGoals.length;
            revenueScore = avgTarget > 0 ? Math.min(100, (totalRevenue / avgTarget) * 100) : 0;
            if (revenueScore >= 100) achievedGoals++;
          }

          if (affiliationGoals.length > 0) {
            const avgTarget = affiliationGoals.reduce((sum: number, g: any) => sum + g.target_value, 0) / affiliationGoals.length;
            affiliationScore = avgTarget > 0 ? Math.min(100, (avgAffiliation / avgTarget) * 100) : 0;
            if (affiliationScore >= 100) achievedGoals++;
          }

          if (commissionGoals.length > 0) {
            const avgTarget = commissionGoals.reduce((sum: number, g: any) => sum + g.target_value, 0) / commissionGoals.length;
            commissionScore = avgTarget > 0 
              ? Math.min(100, Math.max(0, ((avgTarget - avgCommission) / avgTarget) * 100 + 100))
              : 0;
            if (commissionScore >= 100) achievedGoals++;
          }

          const overallScore = (revenueScore + affiliationScore + commissionScore) / 3;
          const totalGoals = [revenueGoals, affiliationGoals, commissionGoals].filter(arr => arr.length > 0).length;

          return {
            gestorId: gestor.id,
            gestorName: gestor.full_name || gestor.email,
            gestorEmail: gestor.email,
            avatarUrl: gestor.avatar_url,
            revenueScore,
            affiliationScore,
            commissionScore,
            overallScore,
            totalTerminals: terminals?.length || 0,
            totalRevenue,
            avgAffiliation,
            avgCommission,
            achievedGoals,
            totalGoals,
            rank: 0,
          };
        }) || []
      );

      // Sort by selected metric and assign ranks
      const sortKey = selectedMetric === 'overall' ? 'overallScore' :
                      selectedMetric === 'revenue' ? 'revenueScore' :
                      selectedMetric === 'affiliation' ? 'affiliationScore' :
                      'commissionScore';

      const sorted = performances
        .filter(p => p.totalTerminals > 0)
        .sort((a, b) => b[sortKey] - a[sortKey])
        .map((p, index) => ({ ...p, rank: index + 1 }));

      setRankings(sorted);
    } catch (error: any) {
      console.error('Error fetching rankings:', error);
      toast.error('Error al cargar ranking');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 1º</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400">🥈 2º</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600">🥉 3º</Badge>;
    return <Badge variant="outline">{rank}º</Badge>;
  };

  const prepareComparisonChart = () => {
    return rankings.slice(0, 10).map(r => ({
      name: r.gestorName.split(' ')[0],
      facturacion: r.revenueScore,
      vinculacion: r.affiliationScore,
      comision: r.commissionScore,
    }));
  };

  const prepareRadarChart = () => {
    if (rankings.length === 0) return [];
    
    return [
      { subject: 'Facturación', ...rankings.slice(0, 5).reduce((acc, r, i) => ({ ...acc, [`gestor${i + 1}`]: r.revenueScore }), {}) },
      { subject: 'Vinculación', ...rankings.slice(0, 5).reduce((acc, r, i) => ({ ...acc, [`gestor${i + 1}`]: r.affiliationScore }), {}) },
      { subject: 'Comisión', ...rankings.slice(0, 5).reduce((acc, r, i) => ({ ...acc, [`gestor${i + 1}`]: r.commissionScore }), {}) },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Gestores
          </h3>
          <p className="text-sm text-muted-foreground">
            Comparación de cumplimiento de objetivos TPV
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Puntuación Global</SelectItem>
              <SelectItem value="revenue">Facturación</SelectItem>
              <SelectItem value="affiliation">Vinculación</SelectItem>
              <SelectItem value="commission">Comisión</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="grid gap-4 md:grid-cols-3">
          {rankings.slice(0, 3).map((gestor, index) => (
            <Card key={gestor.gestorId} className={index === 0 ? 'border-yellow-500 border-2' : ''}>
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  {getRankIcon(gestor.rank)}
                </div>
                <div className="flex items-center justify-center gap-3 mb-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={gestor.avatarUrl || undefined} />
                    <AvatarFallback>{gestor.gestorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg">{gestor.gestorName}</CardTitle>
                <CardDescription className="text-xs">{gestor.gestorEmail}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Puntuación</span>
                  <span className="font-bold text-lg">{gestor.overallScore.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Objetivos cumplidos</span>
                  <Badge variant="outline">{gestor.achievedGoals}/{gestor.totalGoals}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Terminales</span>
                  <span>{gestor.totalTerminals}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparación por Métrica</CardTitle>
            <CardDescription>Top 10 gestores por puntuación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={prepareComparisonChart()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="facturacion" fill="#22c55e" name="Facturación" />
                <Bar dataKey="vinculacion" fill="#3b82f6" name="Vinculación" />
                <Bar dataKey="comision" fill="#f59e0b" name="Comisión" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {rankings.length >= 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Análisis Multidimensional</CardTitle>
              <CardDescription>Comparación de top 5 gestores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={prepareRadarChart()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  {rankings.slice(0, 5).map((gestor, index) => (
                    <Radar
                      key={gestor.gestorId}
                      name={gestor.gestorName.split(' ')[0]}
                      dataKey={`gestor${index + 1}`}
                      stroke={['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index]}
                      fill={['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][index]}
                      fillOpacity={0.3}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Full Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
          <CardDescription>Todos los gestores ordenados por rendimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rankings.map((gestor) => (
              <div
                key={gestor.gestorId}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 text-center">
                    {getRankBadge(gestor.rank)}
                  </div>
                  <Avatar>
                    <AvatarImage src={gestor.avatarUrl || undefined} />
                    <AvatarFallback>{gestor.gestorName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{gestor.gestorName}</p>
                    <p className="text-sm text-muted-foreground">{gestor.gestorEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Global</p>
                    <p className="font-semibold">{gestor.overallScore.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Facturación</p>
                    <p className="font-semibold">{gestor.revenueScore.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vinculación</p>
                    <p className="font-semibold">{gestor.affiliationScore.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comisión</p>
                    <p className="font-semibold">{gestor.commissionScore.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${gestor.overallScore >= 80 ? 'text-green-500' : gestor.overallScore >= 60 ? 'text-blue-500' : 'text-red-500'}`} />
                    <Badge variant="outline">{gestor.achievedGoals}/{gestor.totalGoals}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{gestor.totalTerminals} TPV</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
