/**
 * LearningPlayerHub - Hub central que integra todos los componentes del Learning Player
 * Incluye: Video, AI Tutor, Quiz Adaptativo, Ruta de Aprendizaje, Gamificación
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  BookOpen, 
  Brain, 
  Trophy, 
  Route, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Learning Player Components
import { VideoPlayer } from './VideoPlayer';
import { AITutorPanel } from './AITutorPanel';
import { LessonSidebar, Module } from './LessonSidebar';
import { NotesPanel } from './NotesPanel';
import { EmotionalIndicator } from './EmotionalIndicator';

// Phase 2 Components
import { AdaptiveQuizPanel } from '../adaptive-quiz/AdaptiveQuizPanel';
import { LearningPathPanel } from '../learning-path/LearningPathPanel';
import { GamificationDashboard } from '../gamification/GamificationDashboard';

// Hooks
import { useEmotionalDetector } from '@/hooks/academia/useEmotionalDetector';
import { useGamification } from '@/hooks/academia/useGamification';

interface LearningPlayerHubProps {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  currentLessonId?: string;
  onLessonChange?: (lessonId: string) => void;
  className?: string;
}

type ActivePanel = 'video' | 'tutor' | 'quiz' | 'path' | 'gamification';

export function LearningPlayerHub({
  courseId,
  courseTitle,
  modules,
  currentLessonId,
  onLessonChange,
  className
}: LearningPlayerHubProps) {
  // State
  const [activePanel, setActivePanel] = useState<ActivePanel>('video');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState(currentLessonId || '');

  // Hooks
  const { emotionalState } = useEmotionalDetector({
    courseId,
    lessonId: selectedLessonId,
  });

  const { userPoints, level } = useGamification({
    autoLoad: true
  });

  // Calculate progress
  const progress = useMemo(() => {
    const allLessons = modules.flatMap(m => m.lessons);
    const completedLessons = allLessons.filter(l => l.completed);
    return allLessons.length > 0 
      ? Math.round((completedLessons.length / allLessons.length) * 100) 
      : 0;
  }, [modules]);

  // Get current lesson info
  const currentLesson = useMemo(() => 
    modules.flatMap(m => m.lessons).find(l => l.id === selectedLessonId),
    [modules, selectedLessonId]
  );

  const currentModule = useMemo(() => 
    modules.find(m => m.lessons.some(l => l.id === selectedLessonId)),
    [modules, selectedLessonId]
  );

  // Handlers
  const handleLessonSelect = useCallback((lessonId: string) => {
    setSelectedLessonId(lessonId);
    onLessonChange?.(lessonId);
    setActivePanel('video');
  }, [onLessonChange]);

  const handleQuizComplete = useCallback((result: { passed: boolean; percentage: number }) => {
    console.log('[LearningPlayerHub] Quiz completed:', result);
  }, []);

  const handleLessonStart = useCallback((lessonId: string) => {
    handleLessonSelect(lessonId);
  }, [handleLessonSelect]);

  // Panel configurations
  const panels = [
    { id: 'video' as const, label: 'Lección', icon: Play },
    { id: 'tutor' as const, label: 'Tutor IA', icon: MessageSquare },
    { id: 'quiz' as const, label: 'Quiz', icon: Brain },
    { id: 'path' as const, label: 'Ruta', icon: Route },
    { id: 'gamification' as const, label: 'Logros', icon: Trophy },
  ];

  // Map emotional state for indicator
  const emotionalIndicatorState = useMemo(() => {
    const stateMap: Record<string, 'engaged' | 'neutral' | 'confused' | 'frustrated' | 'tired'> = {
      engaged: 'engaged',
      confident: 'engaged',
      neutral: 'neutral',
      confused: 'confused',
      frustrated: 'frustrated',
      disengaged: 'tired',
    };
    return stateMap[emotionalState.state] || 'neutral';
  }, [emotionalState.state]);

  return (
    <div className={cn("flex h-full bg-background", className)}>
      {/* Left Sidebar - Course Navigation */}
      <LessonSidebar
        courseTitle={courseTitle}
        progress={progress}
        modules={modules}
        currentLessonId={selectedLessonId}
        isOpen={sidebarOpen}
        onLessonSelect={handleLessonSelect}
        backUrl="/academia/cursos"
        backLabel="Volver al catálogo"
      />

      {/* Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-6 rounded-l-none bg-muted/80 hover:bg-muted"
        style={{ left: sidebarOpen ? 380 : 0 }}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Panel Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-card/50">
          <div className="flex items-center gap-2">
            {panels.map((panel) => (
              <Button
                key={panel.id}
                variant={activePanel === panel.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActivePanel(panel.id)}
                className="gap-2"
              >
                <panel.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{panel.label}</span>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {level && (
              <Badge variant="secondary" className="text-xs">
                Nivel {level.current} • {userPoints?.totalPoints || 0} pts
              </Badge>
            )}
            <EmotionalIndicator
              state={emotionalIndicatorState}
              engagementLevel={emotionalState.engagementLevel * 100}
              confidenceScore={emotionalState.confidence * 100}
              showDetails={false}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
              className="h-8 w-8"
            >
              {rightPanelExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Main Panel Content */}
        <div className="flex-1 overflow-hidden p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activePanel === 'video' && currentLesson && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  <div className="lg:col-span-2">
                    <VideoPlayer
                      title={currentLesson.title}
                      onComplete={() => {
                        console.log('[LearningPlayerHub] Video completed');
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <NotesPanel
                      courseId={courseId}
                      currentLessonId={selectedLessonId}
                      currentLessonTitle={currentLesson.title}
                    />
                  </div>
                </div>
              )}

              {activePanel === 'video' && !currentLesson && (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Selecciona una lección</h3>
                    <p className="text-muted-foreground text-sm">
                      Elige una lección del menú lateral para comenzar
                    </p>
                  </CardContent>
                </Card>
              )}

              {activePanel === 'tutor' && (
                <AITutorPanel
                  courseId={courseId}
                  currentLessonId={selectedLessonId}
                  currentLessonTitle={currentLesson?.title || ''}
                  courseTitle={courseTitle}
                  courseTopic={currentModule?.title || courseTitle}
                />
              )}

              {activePanel === 'quiz' && (
                <AdaptiveQuizPanel
                  courseId={courseId}
                  lessonId={selectedLessonId}
                  onComplete={handleQuizComplete}
                  className="h-full"
                />
              )}

              {activePanel === 'path' && (
                <LearningPathPanel
                  courseId={courseId}
                  onLessonSelect={handleLessonStart}
                  className="h-full"
                />
              )}

              {activePanel === 'gamification' && (
                <GamificationDashboard
                  className="h-full"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default LearningPlayerHub;
