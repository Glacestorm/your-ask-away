import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Play, 
  BookOpen, 
  Trophy,
  Brain,
  Mic,
  MessageSquare,
  Target,
  Sparkles
} from 'lucide-react';
import { LearningPlayerHub } from '@/components/academia/learning-player';
import { GamificationDashboard } from '@/components/academia/gamification/GamificationDashboard';
import type { Module } from '@/components/academia/learning-player/LessonSidebar';

// Demo data
const demoCourse = {
  id: 'demo-course-001',
  title: 'Introducción a React con TypeScript',
  description: 'Aprende los fundamentos de React usando TypeScript para crear aplicaciones web modernas.',
  instructor: 'Dr. María García',
  duration: '12 horas',
  level: 'Intermedio',
};

// Demo modules matching the Module type
const demoModules: Module[] = [
  { 
    id: 'm1', 
    title: 'Fundamentos de React', 
    lessons: [
      { id: 'l1-1', title: 'Introducción a React', duration: 15, completed: true, type: 'video' },
      { id: 'l1-2', title: 'Componentes y Props', duration: 20, completed: true, type: 'video' },
      { id: 'l1-3', title: 'Estado con useState', duration: 25, completed: false, type: 'video' },
      { id: 'l1-4', title: 'Efectos con useEffect', duration: 22, completed: false, type: 'video' },
      { id: 'l1-5', title: 'Manejo de Eventos', duration: 18, completed: false, type: 'quiz' },
    ]
  },
  { 
    id: 'm2', 
    title: 'TypeScript Esencial', 
    lessons: [
      { id: 'l2-1', title: 'Tipos Básicos', duration: 20, completed: false, type: 'video' },
      { id: 'l2-2', title: 'Interfaces y Types', duration: 25, completed: false, type: 'video' },
      { id: 'l2-3', title: 'Generics', duration: 30, completed: false, type: 'reading' },
      { id: 'l2-4', title: 'TypeScript en React', duration: 28, completed: false, type: 'exercise' },
    ]
  },
  { 
    id: 'm3', 
    title: 'Hooks Avanzados', 
    lessons: [
      { id: 'l3-1', title: 'useCallback y useMemo', duration: 25, completed: false, type: 'video' },
      { id: 'l3-2', title: 'useRef', duration: 20, completed: false, type: 'video' },
      { id: 'l3-3', title: 'useContext', duration: 22, completed: false, type: 'video' },
      { id: 'l3-4', title: 'useReducer', duration: 28, completed: false, type: 'video' },
      { id: 'l3-5', title: 'Custom Hooks', duration: 30, completed: false, type: 'exercise' },
      { id: 'l3-6', title: 'Patrones Avanzados', duration: 35, completed: false, type: 'quiz' },
    ]
  },
  { 
    id: 'm4', 
    title: 'Estado Global', 
    lessons: [
      { id: 'l4-1', title: 'Context API', duration: 25, completed: false, type: 'video' },
      { id: 'l4-2', title: 'Zustand', duration: 20, completed: false, type: 'video' },
      { id: 'l4-3', title: 'React Query', duration: 30, completed: false, type: 'video' },
      { id: 'l4-4', title: 'Patrones de Estado', duration: 25, completed: false, type: 'quiz' },
    ]
  },
];

export default function AcademiaDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLearning, setIsLearning] = useState(false);

  if (isLearning) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsLearning(false)}
              >
                ← Volver al curso
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm font-medium">{demoCourse.title}</span>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              IA Activa
            </Badge>
          </div>
        </div>
        
        <LearningPlayerHub
          courseId={demoCourse.id}
          courseTitle={demoCourse.title}
          modules={demoModules}
          currentLessonId="l1-3"
        />
      </div>
    );
  }

  const totalLessons = demoModules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Academia IA</h1>
                <p className="text-xs text-muted-foreground">Plataforma de Aprendizaje Adaptativo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Brain className="h-3 w-3" />
                Demo Mode
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Course Hero */}
        <div className="mb-8">
          <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                    {demoCourse.level}
                  </Badge>
                  <h2 className="text-3xl font-bold">{demoCourse.title}</h2>
                  <p className="text-muted-foreground">{demoCourse.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {totalLessons} lecciones
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {demoCourse.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {demoCourse.instructor}
                    </span>
                  </div>
                  <Button 
                    size="lg" 
                    className="mt-4 gap-2"
                    onClick={() => setIsLearning(true)}
                  >
                    <Play className="h-5 w-5" />
                    Iniciar Aprendizaje con IA
                  </Button>
                </div>
                
                {/* Features */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Características IA
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: Brain, label: 'Detección Emocional', desc: 'Adapta el contenido a tu estado' },
                      { icon: MessageSquare, label: 'Chat IA Streaming', desc: 'Respuestas en tiempo real' },
                      { icon: Mic, label: 'Tutor por Voz', desc: 'Conversación natural' },
                      { icon: Target, label: 'Quiz Adaptativo', desc: 'Preguntas personalizadas' },
                      { icon: Trophy, label: 'Gamificación', desc: 'Logros y rankings' },
                    ].map(({ icon: Icon, label, desc }) => (
                      <div key={label} className="flex items-start gap-3 p-2 rounded-lg bg-background/50">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Contenido</TabsTrigger>
            <TabsTrigger value="progress">Mi Progreso</TabsTrigger>
            <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {demoModules.map((module, idx) => (
                <Card key={module.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Módulo {idx + 1}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {module.lessons.length} lecciones
                      </span>
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setIsLearning(true)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Comenzar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="mt-6">
            <GamificationDashboard 
              courseId={demoCourse.id}
            />
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking Global
                </CardTitle>
                <CardDescription>
                  Los mejores estudiantes de esta semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { rank: 1, name: 'Ana M.', points: 2450, badge: '🥇' },
                    { rank: 2, name: 'Carlos R.', points: 2280, badge: '🥈' },
                    { rank: 3, name: 'María L.', points: 2100, badge: '🥉' },
                    { rank: 4, name: 'Pedro S.', points: 1950, badge: '' },
                    { rank: 5, name: 'Laura G.', points: 1820, badge: '' },
                  ].map((user) => (
                    <div 
                      key={user.rank}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold w-8">
                          {user.badge || `#${user.rank}`}
                        </span>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <Badge variant="secondary">{user.points} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}