/**
 * CopilotLearningHub - Hub de Aprendizaje del Copiloto 2026
 * Recursos personalizados, cursos recomendados y progreso de aprendizaje
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  TrendingUp,
  Star,
  FileText,
  Video,
  Headphones,
  ExternalLink,
  CheckCircle,
  Circle,
  Sparkles
} from 'lucide-react';
import { CopilotConfig2026 } from '@/hooks/useRoleCopilot2026';
import { cn } from '@/lib/utils';

interface CopilotLearningHubProps {
  config: CopilotConfig2026 | null;
  className?: string;
}

// Mock data para cursos y recursos
const mockCourses = [
  {
    id: '1',
    title: 'Técnicas Avanzadas de Negociación',
    description: 'Domina el arte de cerrar tratos complejos',
    duration: '4h 30min',
    progress: 65,
    type: 'video',
    level: 'avanzado',
    rating: 4.8,
    isRecommended: true,
  },
  {
    id: '2',
    title: 'Cross-Selling Estratégico',
    description: 'Maximiza el valor de cada cliente',
    duration: '2h 15min',
    progress: 30,
    type: 'video',
    level: 'intermedio',
    rating: 4.6,
    isRecommended: true,
  },
  {
    id: '3',
    title: 'Gestión de Objeciones',
    description: 'Convierte objeciones en oportunidades',
    duration: '1h 45min',
    progress: 0,
    type: 'audio',
    level: 'básico',
    rating: 4.9,
    isRecommended: false,
  },
];

const mockResources = [
  {
    id: '1',
    title: 'Guía: Presentaciones Ejecutivas',
    type: 'pdf',
    readTime: '15 min',
    category: 'Ventas',
  },
  {
    id: '2',
    title: 'Template: Propuesta Comercial 2026',
    type: 'doc',
    readTime: '5 min',
    category: 'Templates',
  },
  {
    id: '3',
    title: 'Checklist: Due Diligence Cliente',
    type: 'pdf',
    readTime: '8 min',
    category: 'Compliance',
  },
];

const mockCertifications = [
  {
    id: '1',
    title: 'Certificación Ventas Consultivas',
    progress: 80,
    modulesCompleted: 8,
    totalModules: 10,
    deadline: '2026-02-15',
  },
  {
    id: '2',
    title: 'Especialización Sector Financiero',
    progress: 45,
    modulesCompleted: 9,
    totalModules: 20,
    deadline: '2026-04-30',
  },
];

export function CopilotLearningHub({ config, className }: CopilotLearningHubProps) {
  const [activeSubTab, setActiveSubTab] = useState('recommended');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'audio': return <Headphones className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'básico': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'intermedio': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'avanzado': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="space-y-4 pr-4">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-xs text-muted-foreground">Cursos Completados</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-500">48h</div>
              <div className="text-xs text-muted-foreground">Tiempo Aprendiendo</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-500">3</div>
              <div className="text-xs text-muted-foreground">Certificaciones</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de contenido */}
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommended" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Para ti
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Recursos
            </TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Certificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="mt-3 space-y-3">
            {mockCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      course.type === 'video' ? 'bg-red-500/10' : 'bg-blue-500/10'
                    )}>
                      {getTypeIcon(course.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm flex items-center gap-1">
                            {course.title}
                            {course.isRecommended && (
                              <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary">
                                IA
                              </Badge>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {course.description}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("text-[10px]", getLevelColor(course.level))}>
                          {course.level}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {course.rating}
                        </span>
                      </div>

                      {course.progress > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span className="font-medium">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-1.5" />
                        </div>
                      )}

                      <div className="mt-2 flex gap-2">
                        <Button size="sm" className="h-7 text-xs flex-1">
                          <Play className="h-3 w-3 mr-1" />
                          {course.progress > 0 ? 'Continuar' : 'Empezar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="resources" className="mt-3 space-y-2">
            {mockResources.map((resource) => (
              <Card key={resource.id} className="hover:shadow-sm transition-shadow cursor-pointer">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{resource.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">
                          {resource.category}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {resource.readTime}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="certifications" className="mt-3 space-y-3">
            {mockCertifications.map((cert) => (
              <Card key={cert.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                      <Award className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{cert.title}</h4>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{cert.modulesCompleted}/{cert.totalModules} módulos</span>
                        <span>•</span>
                        <span>Fecha límite: {new Date(cert.deadline).toLocaleDateString('es-ES')}</span>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium">{cert.progress}%</span>
                        </div>
                        <Progress value={cert.progress} className="h-2" />
                      </div>

                      <Button size="sm" className="mt-2 h-7 text-xs">
                        Continuar Certificación
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}

export default CopilotLearningHub;
