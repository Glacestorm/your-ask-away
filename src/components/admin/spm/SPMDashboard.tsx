import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Trophy, TrendingUp, Users, Zap, 
  Award, Medal, Star, Crown, Flame,
  RefreshCw, Calendar, BarChart3
} from 'lucide-react';
import { useSalesQuotas, useSalesLeaderboard, useSalesAchievements, useCalculateSalesPerformance } from '@/hooks/useSalesPerformance';
import { useAuth } from '@/hooks/useAuth';
import { GamificationWidget } from './GamificationWidget';
import { PipelineIntelligence } from './PipelineIntelligence';
import { RevenueIntelligence } from './RevenueIntelligence';
import { AutonomousAIPanel } from './AutonomousAIPanel';

export function SPMDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: quotas, isLoading: quotasLoading } = useSalesQuotas(undefined, 'monthly');
  const { data: leaderboard, isLoading: leaderboardLoading } = useSalesLeaderboard('monthly');
  const { data: achievements, isLoading: achievementsLoading } = useSalesAchievements();
  const { calculate, isCalculating } = useCalculateSalesPerformance();

  const currentQuota = quotas?.[0];
  const totalTeamValue = quotas?.reduce((sum, q) => sum + (q.actual_value || 0), 0) || 0;
  const totalTeamTarget = quotas?.reduce((sum, q) => sum + (q.target_value || 0), 0) || 0;
  const teamProgress = totalTeamTarget > 0 ? (totalTeamValue / totalTeamTarget) * 100 : 0;

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-muted-foreground font-bold">{position}</span>;
    }
  };

  const getRankChangeIndicator = (change: number) => {
    if (change > 0) return <span className="text-green-500 text-xs">↑{change}</span>;
    if (change < 0) return <span className="text-red-500 text-xs">↓{Math.abs(change)}</span>;
    return <span className="text-muted-foreground text-xs">-</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Sales Performance Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de rendimiento, gamificación e inteligencia de ventas
          </p>
        </div>
        <Button 
          onClick={() => calculate()} 
          disabled={isCalculating}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isCalculating ? 'animate-spin' : ''}`} />
          Recalcular Métricas
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progreso Equipo</p>
                <p className="text-2xl font-bold">{teamProgress.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-80" />
            </div>
            <Progress value={teamProgress} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Conseguido</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalTeamValue)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              de {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalTeamTarget)} objetivo
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Logros Desbloqueados</p>
                <p className="text-2xl font-bold">{achievements?.length || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Este mes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gestores Activos</p>
                <p className="text-2xl font-bold">{leaderboard?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">En el ranking</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Leaderboard</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="ai-tasks" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">IA Autónoma</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gamification Widget */}
            <div className="lg:col-span-2">
              <GamificationWidget />
            </div>

            {/* Top 5 Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Top 5 del Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard?.slice(0, 5).map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          entry.rank_position <= 3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : ''
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(entry.rank_position)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.gestor?.full_name || 'Usuario'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.total_points} pts
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(entry.total_value)}
                          </p>
                          {getRankChangeIndicator(entry.rank_change)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Ranking Completo de Gestores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <div key={i} className="h-16 bg-muted/50 animate-pulse rounded" />
                  ))}
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        entry.rank_position === 1 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30' :
                        entry.rank_position === 2 ? 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30' :
                        entry.rank_position === 3 ? 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30' :
                        'bg-card'
                      }`}
                    >
                      <div className="w-10 h-10 flex items-center justify-center">
                        {getRankIcon(entry.rank_position)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{entry.gestor?.full_name || 'Usuario'}</p>
                          {entry.streak_days >= 5 && (
                            <Badge variant="secondary" className="gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              {entry.streak_days} días
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.gestor?.oficina || 'Sin oficina'} • {entry.total_visits} visitas • {entry.total_deals_won} deals
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{entry.total_points}</p>
                          <p className="text-xs text-muted-foreground">puntos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(entry.total_value)}
                          </p>
                          <p className="text-xs text-muted-foreground">valor</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getRankChangeIndicator(entry.rank_change)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>No hay datos de ranking disponibles</p>
                  <p className="text-sm">Ejecuta el cálculo de rendimiento para generar el leaderboard</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="mt-6">
          <PipelineIntelligence />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <RevenueIntelligence />
        </TabsContent>

        <TabsContent value="ai-tasks" className="mt-6">
          <AutonomousAIPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
