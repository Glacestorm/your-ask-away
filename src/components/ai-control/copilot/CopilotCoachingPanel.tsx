/**
 * CopilotCoachingPanel - Panel de Coaching IA 2026
 * Coaching personalizado, skill assessment, goal tracking y micro-learning
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GraduationCap, 
  Target, 
  Star, 
  TrendingUp,
  Award,
  BookOpen,
  Lightbulb,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Zap,
  Brain,
  Sparkles,
  Users,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachingGoal, LearningResource, CopilotMetrics2026 } from '@/hooks/useRoleCopilot2026';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface CopilotCoachingPanelProps {
  metrics?: CopilotMetrics2026 | null;
  coachingGoals?: CoachingGoal[];
  learningResources?: LearningResource[];
  onStartSession?: () => void;
  onCompleteGoal?: (goalId: string) => void;
  onConsumeResource?: (resourceId: string) => void;
  isLoading?: boolean;
}

// Mock skill data for radar chart
const SKILL_DATA = [
  { skill: 'Ventas', current: 78, target: 90, sector: 80 },
  { skill: 'Negociación', current: 65, target: 85, sector: 75 },
  { skill: 'Producto', current: 82, target: 90, sector: 78 },
  { skill: 'CRM', current: 90, target: 95, sector: 85 },
  { skill: 'Comunicación', current: 75, target: 88, sector: 82 },
  { skill: 'Análisis', current: 70, target: 85, sector: 72 },
];

// Mock coaching goals
const MOCK_GOALS: CoachingGoal[] = [
  { id: '1', goal: 'Mejorar tasa de cierre en 15%', progress: 67, deadline: '2026-02-28', status: 'active' },
  { id: '2', goal: 'Completar certificación CRM Pro', progress: 45, deadline: '2026-03-15', status: 'active' },
  { id: '3', goal: 'Reducir ciclo de venta 20%', progress: 30, deadline: '2026-04-01', status: 'active' },
];

// Mock learning resources
const MOCK_RESOURCES: LearningResource[] = [
  { id: '1', title: 'Técnicas avanzadas de cierre', type: 'video', duration: 15, relevance: 95 },
  { id: '2', title: 'Manejo de objeciones', type: 'article', duration: 8, relevance: 88 },
  { id: '3', title: 'Negociación B2B Masterclass', type: 'course', duration: 120, relevance: 82 },
  { id: '4', title: 'Podcast: Sales Insights', type: 'podcast', duration: 30, relevance: 75 },
];

// Mock peer comparison
const PEER_COMPARISON = {
  rank: 12,
  totalPeers: 45,
  percentile: 73,
  topSkill: 'CRM',
  improvementArea: 'Negociación',
  trend: 'up',
};

export function CopilotCoachingPanel({
  metrics,
  coachingGoals = MOCK_GOALS,
  learningResources = MOCK_RESOURCES,
  onStartSession,
  onCompleteGoal,
  onConsumeResource,
  isLoading,
}: CopilotCoachingPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'course': return GraduationCap;
      case 'podcast': return Lightbulb;
      default: return BookOpen;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500/20 text-blue-600';
      case 'completed': return 'bg-green-500/20 text-green-600';
      case 'paused': return 'bg-amber-500/20 text-amber-600';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-[400px] bg-muted/50" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coaching Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent border-purple-500/20">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Brain className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold">Centro de Coaching IA</h3>
                <p className="text-sm text-muted-foreground">
                  Desarrollo personalizado basado en tu rendimiento
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">
                  {metrics?.coachingSessionsCompleted || 12}
                </p>
                <p className="text-xs text-muted-foreground">Sesiones completadas</p>
              </div>
              <Button onClick={onStartSession} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Zap className="h-4 w-4" />
                Nueva Sesión
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Star className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-2">
            <Target className="h-4 w-4" />
            Skills
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Trophy className="h-4 w-4" />
            Objetivos
          </TabsTrigger>
          <TabsTrigger value="learning" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Learning
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Key Metrics */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics?.productivityGain || 23}%</p>
                    <p className="text-xs text-muted-foreground">Mejora productividad</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics?.learningResourcesConsumed || 18}</p>
                    <p className="text-xs text-muted-foreground">Recursos consumidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20">
                    <Flame className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{metrics?.accuracyScore || 85}%</p>
                    <p className="text-xs text-muted-foreground">Precisión IA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Top {100 - PEER_COMPARISON.percentile}%</p>
                    <p className="text-xs text-muted-foreground">Ranking peers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Peer Comparison Card */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Comparación con Peers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">#{PEER_COMPARISON.rank}</span>
                      <span className="text-muted-foreground">de {PEER_COMPARISON.totalPeers}</span>
                    </div>
                    <Progress value={PEER_COMPARISON.percentile} className="h-2 mt-2" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mejor skill:</span>
                      <Badge variant="secondary">{PEER_COMPARISON.topSkill}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">A mejorar:</span>
                      <Badge variant="outline">{PEER_COMPARISON.improvementArea}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Coaching Tip */}
            <Card className="md:col-span-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Tip del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  💡 <strong>Mejora tu negociación:</strong> Según tu último mes, 
                  podrías aumentar tu tasa de cierre un 12% si implementas la técnica 
                  de "descubrimiento profundo" en las primeras reuniones.
                </p>
                <Button variant="link" className="px-0 mt-2 h-auto">
                  Ver más detalles →
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Mapa de Competencias</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={SKILL_DATA}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="skill" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name="Tu nivel"
                      dataKey="current"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Objetivo"
                      dataKey="target"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.1}
                    />
                    <Radar
                      name="Media sector"
                      dataKey="sector"
                      stroke="#f59e0b"
                      fill="transparent"
                      strokeDasharray="5 5"
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Skills List */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Detalle por Skill</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-4">
                    {SKILL_DATA.map((skill) => {
                      const gap = skill.target - skill.current;
                      const vsAvg = skill.current - skill.sector;
                      return (
                        <div key={skill.skill} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{skill.skill}</span>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  vsAvg >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                                )}
                              >
                                {vsAvg >= 0 ? '+' : ''}{vsAvg} vs media
                              </Badge>
                              <span className="text-sm font-medium">{skill.current}%</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={skill.current} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground">
                              Objetivo: {skill.target}%
                            </span>
                          </div>
                          {gap > 10 && (
                            <p className="text-xs text-amber-600">
                              ⚡ Recomendado: Priorizar mejora (-{gap} puntos del objetivo)
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Objetivos de Desarrollo</CardTitle>
                <Button variant="outline" size="sm">
                  + Nuevo Objetivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coachingGoals.map((goal) => (
                  <div 
                    key={goal.id} 
                    className="p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{goal.goal}</h4>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status === 'active' ? 'Activo' : 
                             goal.status === 'completed' ? 'Completado' : 'Pausado'}
                          </Badge>
                        </div>
                        {goal.deadline && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Fecha límite: {new Date(goal.deadline).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">{goal.progress}%</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                    {goal.progress >= 90 && goal.status === 'active' && (
                      <Button 
                        size="sm" 
                        className="mt-3 gap-2"
                        onClick={() => onCompleteGoal?.(goal.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Marcar como completado
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recommended Resources */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Recursos Recomendados para Ti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {learningResources.map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <div 
                        key={resource.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => onConsumeResource?.(resource.id)}
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{resource.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {resource.type}
                            </Badge>
                            {resource.duration && (
                              <>
                                <Clock className="h-3 w-3" />
                                {resource.duration}min
                              </>
                            )}
                            <span className="ml-auto text-amber-600">
                              {resource.relevance}% relevante
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tu Progreso Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Videos vistos</span>
                    <span className="font-medium">12 / 20</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Artículos leídos</span>
                    <span className="font-medium">8 / 15</span>
                  </div>
                  <Progress value={53} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cursos completados</span>
                    <span className="font-medium">2 / 5</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Streak */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Racha de Aprendizaje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-orange-500">7</div>
                  <p className="text-sm text-muted-foreground">días consecutivos</p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <div 
                        key={day}
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          day <= 7 ? "bg-orange-500 text-white" : "bg-muted"
                        )}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    ¡Sigue así! 3 días más para desbloquear insignia
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CopilotCoachingPanel;
