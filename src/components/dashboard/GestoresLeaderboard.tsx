import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Medal, 
  Award,
  TrendingUp,
  Target,
  Star,
  Crown,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth } from 'date-fns';

interface GestorPerformance {
  gestor_id: string;
  gestor_name: string;
  gestor_email: string;
  avatar_url: string | null;
  total_visits: number;
  successful_visits: number;
  conversion_rate: number;
  avg_vinculacion: number;
  total_vinculacion: number;
  rank: number;
  score: number;
}

type RankingMetric = 'overall' | 'visits' | 'conversion' | 'vinculacion';

export const GestoresLeaderboard = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<GestorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<RankingMetric>('overall');

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Fetch all visits with gestor info
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits' as any)
        .select(`
          gestor_id,
          result,
          porcentaje_vinculacion,
          profiles!visits_gestor_id_fkey (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .gte('visit_date', monthStart)
        .lte('visit_date', monthEnd);

      if (visitsError) throw visitsError;

      // Group visits by gestor and calculate metrics
      const gestorMap = new Map<string, GestorPerformance>();

      (visitsData as any)?.forEach((visit: any) => {
        const gestorId = visit.gestor_id;
        const profile = visit.profiles;

        if (!gestorId || !profile) return;

        if (!gestorMap.has(gestorId)) {
          gestorMap.set(gestorId, {
            gestor_id: gestorId,
            gestor_name: profile.full_name || profile.email || 'Sin nombre',
            gestor_email: profile.email,
            avatar_url: profile.avatar_url,
            total_visits: 0,
            successful_visits: 0,
            conversion_rate: 0,
            avg_vinculacion: 0,
            total_vinculacion: 0,
            rank: 0,
            score: 0,
          });
        }

        const gestorStats = gestorMap.get(gestorId)!;
        gestorStats.total_visits++;

        // Count successful visits
        if (
          visit.result === 'positivo' ||
          visit.result === 'contrato' ||
          (visit.porcentaje_vinculacion && visit.porcentaje_vinculacion > 50)
        ) {
          gestorStats.successful_visits++;
        }

        // Sum vinculación
        if (visit.porcentaje_vinculacion) {
          gestorStats.total_vinculacion += visit.porcentaje_vinculacion;
        }
      });

      // Calculate final metrics and scores
      const gestoresArray = Array.from(gestorMap.values()).map((gestor) => {
        const conversion_rate = gestor.total_visits > 0
          ? (gestor.successful_visits / gestor.total_visits) * 100
          : 0;

        const avg_vinculacion = gestor.successful_visits > 0
          ? gestor.total_vinculacion / gestor.successful_visits
          : 0;

        // Calculate overall score (weighted)
        const score = 
          (gestor.total_visits * 2) + // Visits weight: 2
          (conversion_rate * 1.5) +    // Conversion weight: 1.5
          (avg_vinculacion * 1);       // Vinculación weight: 1

        return {
          ...gestor,
          conversion_rate,
          avg_vinculacion,
          score,
        };
      });

      // Sort by overall score and assign ranks
      gestoresArray.sort((a, b) => b.score - a.score);
      gestoresArray.forEach((gestor, index) => {
        gestor.rank = index + 1;
      });

      setRankings(gestoresArray);
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      toast.error('Error al cargar el ranking');
    } finally {
      setLoading(false);
    }
  };

  const getSortedRankings = (metric: RankingMetric): GestorPerformance[] => {
    const sorted = [...rankings];
    
    switch (metric) {
      case 'visits':
        sorted.sort((a, b) => b.total_visits - a.total_visits);
        break;
      case 'conversion':
        sorted.sort((a, b) => b.conversion_rate - a.conversion_rate);
        break;
      case 'vinculacion':
        sorted.sort((a, b) => b.avg_vinculacion - a.avg_vinculacion);
        break;
      case 'overall':
      default:
        sorted.sort((a, b) => b.score - a.score);
    }

    return sorted.map((gestor, index) => ({
      ...gestor,
      rank: index + 1,
    }));
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🏆 Campeón</Badge>;
    if (rank === 2) return <Badge variant="secondary">🥈 Segundo</Badge>;
    if (rank === 3) return <Badge variant="secondary">🥉 Tercero</Badge>;
    if (rank <= 5) return <Badge variant="outline">⭐ Top 5</Badge>;
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCurrentUser = (gestorId: string) => gestorId === user?.id;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Gestores</CardTitle>
          <CardDescription>Cargando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentRankings = getSortedRankings(selectedMetric);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Ranking de Gestores
            </CardTitle>
            <CardDescription>
              Clasificación por rendimiento del mes actual
            </CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {rankings.length} gestores activos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as RankingMetric)}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overall" className="gap-1">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Visitas</span>
            </TabsTrigger>
            <TabsTrigger value="conversion" className="gap-1">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Conversión</span>
            </TabsTrigger>
            <TabsTrigger value="vinculacion" className="gap-1">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Vinculación</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedMetric} className="space-y-4">
            {currentRankings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>No hay datos de rendimiento disponibles para este mes</p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium */}
                {currentRankings.length >= 3 && (
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    {/* Second Place */}
                    <div className="flex flex-col items-center space-y-2 pt-8">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-4 border-gray-400">
                          <AvatarImage src={currentRankings[1].avatar_url || undefined} />
                          <AvatarFallback className="bg-gray-100">
                            {getInitials(currentRankings[1].gestor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 bg-gray-400 rounded-full p-1">
                          <Medal className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-center">
                        {currentRankings[1].gestor_name}
                      </p>
                      <Badge variant="secondary">2º</Badge>
                    </div>

                    {/* First Place */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-yellow-500">
                          <AvatarImage src={currentRankings[0].avatar_url || undefined} />
                          <AvatarFallback className="bg-yellow-100">
                            {getInitials(currentRankings[0].gestor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-center">
                        {currentRankings[0].gestor_name}
                      </p>
                      <Badge className="bg-yellow-500">🏆 1º</Badge>
                    </div>

                    {/* Third Place */}
                    <div className="flex flex-col items-center space-y-2 pt-8">
                      <div className="relative">
                        <Avatar className="h-16 w-16 border-4 border-amber-600">
                          <AvatarImage src={currentRankings[2].avatar_url || undefined} />
                          <AvatarFallback className="bg-amber-100">
                            {getInitials(currentRankings[2].gestor_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 bg-amber-600 rounded-full p-1">
                          <Award className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-center">
                        {currentRankings[2].gestor_name}
                      </p>
                      <Badge variant="secondary">3º</Badge>
                    </div>
                  </div>
                )}

                {/* Full Rankings List */}
                <div className="space-y-2">
                  {currentRankings.map((gestor) => (
                    <div
                      key={gestor.gestor_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        isCurrentUser(gestor.gestor_id)
                          ? 'bg-primary/10 border-primary shadow-md'
                          : 'bg-card hover:bg-accent/50'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(gestor.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={gestor.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(gestor.gestor_name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name & Badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {gestor.gestor_name}
                            {isCurrentUser(gestor.gestor_id) && (
                              <span className="ml-2 text-xs text-primary">(Tú)</span>
                            )}
                          </p>
                          {getRankBadge(gestor.rank)}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {gestor.gestor_email}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-xs text-muted-foreground">Visitas</p>
                          <p className="text-lg font-bold">{gestor.total_visits}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversión</p>
                          <p className="text-lg font-bold">
                            {gestor.conversion_rate.toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Vinculación</p>
                          <p className="text-lg font-bold">
                            {gestor.avg_vinculacion.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
