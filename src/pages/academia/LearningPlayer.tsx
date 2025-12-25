/**
 * LearningPlayer - Reproductor de contenido del curso
 * Integración completa de todos los componentes del reproductor
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Menu, X, FileText, Download, 
  CheckCircle, Layers, MessageSquare, Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  VideoPlayer,
  LessonSidebar,
  NotesPanel,
  ResourcesPanel,
  AITutorPanel,
  QuizPlayer,
  type Module,
  type Resource,
} from '@/components/academia/learning-player';
import { GamificationMiniWidget } from '@/components/academia';

// Mock data para demostración
const generateMockCourse = (language: string) => ({
  id: 'course-1',
  title: language === 'es' ? 'CRM Avanzado para Empresas' : 'Advanced CRM for Business',
  modules: [
    {
      id: 'mod-1',
      title: language === 'es' ? 'Introducción al CRM' : 'Introduction to CRM',
      lessons: [
        { 
          id: 'les-1-1', 
          title: language === 'es' ? 'Bienvenida al curso' : 'Welcome to the course', 
          duration: 300, 
          completed: true, 
          type: 'video' as const,
          isFree: true 
        },
        { 
          id: 'les-1-2', 
          title: language === 'es' ? '¿Qué es un CRM?' : 'What is a CRM?', 
          duration: 600, 
          completed: true, 
          type: 'video' as const 
        },
        { 
          id: 'les-1-3', 
          title: language === 'es' ? 'Beneficios del CRM' : 'CRM Benefits', 
          duration: 480, 
          completed: true, 
          type: 'video' as const 
        },
        { 
          id: 'les-1-4', 
          title: language === 'es' ? 'Tipos de CRM' : 'Types of CRM', 
          duration: 540, 
          completed: false, 
          type: 'video' as const 
        },
        { 
          id: 'les-1-5', 
          title: language === 'es' ? 'Quiz: Conceptos básicos' : 'Quiz: Basic concepts', 
          duration: 0, 
          completed: false, 
          type: 'quiz' as const 
        },
      ],
    },
    {
      id: 'mod-2',
      title: language === 'es' ? 'Configuración Avanzada' : 'Advanced Configuration',
      lessons: [
        { 
          id: 'les-2-1', 
          title: language === 'es' ? 'Configuración inicial' : 'Initial setup', 
          duration: 720, 
          completed: false, 
          type: 'video' as const 
        },
        { 
          id: 'les-2-2', 
          title: language === 'es' ? 'Personalización de campos' : 'Field customization', 
          duration: 600, 
          completed: false, 
          type: 'video' as const 
        },
        { 
          id: 'les-2-3', 
          title: language === 'es' ? 'Ejercicio práctico' : 'Practical exercise', 
          duration: 0, 
          completed: false, 
          type: 'exercise' as const 
        },
        { 
          id: 'les-2-4', 
          title: language === 'es' ? 'Flujos de trabajo' : 'Workflows', 
          duration: 900, 
          completed: false, 
          type: 'video' as const 
        },
      ],
    },
    {
      id: 'mod-3',
      title: language === 'es' ? 'Automatización y Reportes' : 'Automation and Reports',
      lessons: [
        { 
          id: 'les-3-1', 
          title: language === 'es' ? 'Introducción a la automatización' : 'Introduction to automation', 
          duration: 540, 
          completed: false, 
          type: 'video' as const 
        },
        { 
          id: 'les-3-2', 
          title: language === 'es' ? 'Creando reglas automáticas' : 'Creating automatic rules', 
          duration: 720, 
          completed: false, 
          type: 'video' as const 
        },
        { 
          id: 'les-3-3', 
          title: language === 'es' ? 'Material de lectura' : 'Reading material', 
          duration: 0, 
          completed: false, 
          type: 'reading' as const 
        },
        { 
          id: 'les-3-4', 
          title: language === 'es' ? 'Proyecto final' : 'Final project', 
          duration: 0, 
          completed: false, 
          type: 'pdf' as const 
        },
      ],
    },
  ] as Module[],
});

const generateMockResources = (language: string): Resource[] => [
  {
    id: 'res-1',
    title: language === 'es' ? 'Guía de configuración CRM' : 'CRM Configuration Guide',
    type: 'pdf',
    url: '#',
    size: '2.4 MB',
    lessonId: 'les-2-1',
  },
  {
    id: 'res-2',
    title: language === 'es' ? 'Plantilla de flujos de trabajo' : 'Workflow Template',
    type: 'spreadsheet',
    url: '#',
    size: '156 KB',
    lessonId: 'les-2-4',
  },
  {
    id: 'res-3',
    title: language === 'es' ? 'Código de ejemplo - Automatización' : 'Sample Code - Automation',
    type: 'code',
    url: '#',
    size: '12 KB',
    lessonId: 'les-3-2',
  },
  {
    id: 'res-4',
    title: language === 'es' ? 'Presentación del módulo 1' : 'Module 1 Presentation',
    type: 'doc',
    url: '#',
    size: '5.8 MB',
  },
  {
    id: 'res-5',
    title: language === 'es' ? 'Video complementario' : 'Supplementary Video',
    type: 'video',
    url: '#',
    size: '124 MB',
    lessonId: 'les-1-3',
  },
];

const mockQuizQuestions = [
  {
    id: 'q1',
    question: '¿Cuál es el principal beneficio de un CRM?',
    options: [
      'Reducir costos de hardware',
      'Centralizar la información del cliente',
      'Aumentar el número de empleados',
      'Eliminar la necesidad de marketing',
    ],
    correctIndex: 1,
    explanation: 'Un CRM permite centralizar toda la información del cliente en un solo lugar, facilitando el acceso y la gestión de las relaciones con los clientes.',
  },
  {
    id: 'q2',
    question: '¿Qué tipo de CRM se enfoca en la automatización de ventas y marketing?',
    options: [
      'CRM Analítico',
      'CRM Colaborativo',
      'CRM Operativo',
      'CRM Social',
    ],
    correctIndex: 2,
    explanation: 'El CRM Operativo se centra en automatizar y mejorar los procesos de cara al cliente, incluyendo ventas, marketing y servicio.',
  },
  {
    id: 'q3',
    question: '¿Cuál es un KPI común para medir el éxito de un CRM?',
    options: [
      'Número de páginas web',
      'Tasa de retención de clientes',
      'Velocidad del servidor',
      'Cantidad de emails enviados',
    ],
    correctIndex: 1,
    explanation: 'La tasa de retención de clientes es un indicador clave que muestra qué tan efectivo es el CRM en mantener relaciones duraderas con los clientes.',
  },
];

const LearningPlayer: React.FC = () => {
  const { courseId } = useParams();
  const { language } = useLanguage();
  
  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLessonId, setCurrentLessonId] = useState('les-1-4');
  const [completedLessons, setCompletedLessons] = useState<string[]>(['les-1-1', 'les-1-2', 'les-1-3']);
  const [rightPanelTab, setRightPanelTab] = useState<string>('notes');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  // Mock data
  const course = useMemo(() => generateMockCourse(language), [language]);
  const resources = useMemo(() => generateMockResources(language), [language]);

  // Derived state
  const allLessons = useMemo(() => 
    course.modules.flatMap(m => m.lessons), 
    [course]
  );
  
  const currentLessonIndex = useMemo(() => 
    allLessons.findIndex(l => l.id === currentLessonId),
    [allLessons, currentLessonId]
  );
  
  const currentLesson = allLessons[currentLessonIndex];
  
  const currentModule = useMemo(() => 
    course.modules.find(m => m.lessons.some(l => l.id === currentLessonId)),
    [course.modules, currentLessonId]
  );

  const courseProgress = useMemo(() => {
    const total = allLessons.length;
    const completed = completedLessons.length;
    return Math.round((completed / total) * 100);
  }, [allLessons.length, completedLessons.length]);

  // Handlers
  const handleLessonSelect = useCallback((lessonId: string) => {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson?.type === 'quiz') {
      setShowQuiz(true);
    } else {
      setShowQuiz(false);
    }
    setCurrentLessonId(lessonId);
    setCurrentVideoTime(0);
  }, [allLessons]);

  const handleMarkComplete = useCallback(() => {
    if (!completedLessons.includes(currentLessonId)) {
      setCompletedLessons(prev => [...prev, currentLessonId]);
      toast.success(language === 'es' ? 'Lección completada' : 'Lesson completed');
    }
  }, [completedLessons, currentLessonId, language]);

  const handlePreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      const prevLesson = allLessons[currentLessonIndex - 1];
      handleLessonSelect(prevLesson.id);
    }
  }, [currentLessonIndex, allLessons, handleLessonSelect]);

  const handleNextLesson = useCallback(() => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      handleLessonSelect(nextLesson.id);
    }
  }, [currentLessonIndex, allLessons, handleLessonSelect]);

  const handleVideoComplete = useCallback(() => {
    handleMarkComplete();
    // Auto-advance to next lesson after a short delay
    setTimeout(() => {
      if (currentLessonIndex < allLessons.length - 1) {
        handleNextLesson();
      }
    }, 2000);
  }, [handleMarkComplete, currentLessonIndex, allLessons.length, handleNextLesson]);

  const handleQuizComplete = useCallback((score: number, passed: boolean) => {
    if (passed) {
      handleMarkComplete();
    }
    toast[passed ? 'success' : 'info'](
      passed 
        ? (language === 'es' ? '¡Excelente! Has aprobado el quiz' : 'Excellent! You passed the quiz')
        : (language === 'es' ? 'Necesitas más práctica' : 'You need more practice')
    );
  }, [handleMarkComplete, language]);

  const handleTimestampClick = useCallback((lessonId: string, timestamp: number) => {
    if (lessonId !== currentLessonId) {
      handleLessonSelect(lessonId);
    }
    setCurrentVideoTime(timestamp);
  }, [currentLessonId, handleLessonSelect]);

  // Modules with updated completion status
  const modulesWithProgress = useMemo(() => 
    course.modules.map(module => ({
      ...module,
      lessons: module.lessons.map(lesson => ({
        ...lesson,
        completed: completedLessons.includes(lesson.id),
      })),
    })),
    [course.modules, completedLessons]
  );

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 text-slate-400 hover:text-white bg-slate-900/80 backdrop-blur"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[350px] p-0 bg-slate-900 border-slate-800">
          <LessonSidebar
            courseTitle={course.title}
            progress={courseProgress}
            modules={modulesWithProgress}
            currentLessonId={currentLessonId}
            isOpen={true}
            onLessonSelect={handleLessonSelect}
            backUrl="/academia/cursos"
            backLabel={language === 'es' ? 'Volver al catálogo' : 'Back to catalog'}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 380 : 0 }}
        className="hidden lg:block bg-slate-900 border-r border-slate-800 overflow-hidden flex-shrink-0"
      >
        <div className="w-[380px] h-screen">
          <LessonSidebar
            courseTitle={course.title}
            progress={courseProgress}
            modules={modulesWithProgress}
            currentLessonId={currentLessonId}
            isOpen={sidebarOpen}
            onLessonSelect={handleLessonSelect}
            backUrl="/academia/cursos"
            backLabel={language === 'es' ? 'Volver al catálogo' : 'Back to catalog'}
          />
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{currentLesson?.title}</p>
            <p className="text-xs text-slate-500 truncate">{currentModule?.title}</p>
          </div>
          
          <Badge variant="outline" className="border-slate-700 text-slate-400 hidden sm:flex">
            {language === 'es' ? `Lección ${currentLessonIndex + 1} de ${allLessons.length}` : `Lesson ${currentLessonIndex + 1} of ${allLessons.length}`}
          </Badge>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`text-slate-400 hover:text-white ${showRightPanel ? 'bg-slate-800' : ''}`}
            >
              <Layers className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Video/Quiz Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {showQuiz && currentLesson?.type === 'quiz' ? (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-auto"
                >
                  <QuizPlayer
                    quizId={currentLesson.id}
                    title={currentLesson.title}
                    questions={mockQuizQuestions}
                    passingScore={70}
                    onComplete={handleQuizComplete}
                    onRetry={() => setShowQuiz(true)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="video"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1"
                >
                  <VideoPlayer
                    title={currentLesson?.title || ''}
                    onComplete={handleVideoComplete}
                    onTimeUpdate={(time) => setCurrentVideoTime(time)}
                    onPrevious={currentLessonIndex > 0 ? handlePreviousLesson : undefined}
                    onNext={currentLessonIndex < allLessons.length - 1 ? handleNextLesson : undefined}
                    hasPrevious={currentLessonIndex > 0}
                    hasNext={currentLessonIndex < allLessons.length - 1}
                    autoPlay={false}
                    startTime={currentVideoTime}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4">
              <Button 
                variant="ghost" 
                className="text-slate-400 hover:text-white gap-2"
                onClick={handlePreviousLesson}
                disabled={currentLessonIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'es' ? 'Anterior' : 'Previous'}</span>
              </Button>

              <Button 
                className="gap-2"
                onClick={handleMarkComplete}
                disabled={completedLessons.includes(currentLessonId)}
                variant={completedLessons.includes(currentLessonId) ? 'secondary' : 'default'}
              >
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {completedLessons.includes(currentLessonId) 
                    ? (language === 'es' ? 'Completado' : 'Completed')
                    : (language === 'es' ? 'Marcar como completado' : 'Mark as completed')
                  }
                </span>
              </Button>

              <Button 
                variant="ghost" 
                className="text-slate-400 hover:text-white gap-2"
                onClick={handleNextLesson}
                disabled={currentLessonIndex === allLessons.length - 1}
              >
                <span className="hidden sm:inline">{language === 'es' ? 'Siguiente' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </footer>
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {showRightPanel && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 400, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-900 border-l border-slate-800 overflow-hidden hidden md:block"
              >
                <div className="w-[400px] h-full flex flex-col">
                  <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 m-2 mx-4">
                      <TabsTrigger value="notes" className="text-xs gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="hidden lg:inline">{language === 'es' ? 'Notas' : 'Notes'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="resources" className="text-xs gap-1">
                        <Download className="w-3 h-3" />
                        <span className="hidden lg:inline">{language === 'es' ? 'Recursos' : 'Resources'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="ai" className="text-xs gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span className="hidden lg:inline">{language === 'es' ? 'Tutor' : 'Tutor'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="progress" className="text-xs gap-1">
                        <Trophy className="w-3 h-3" />
                        <span className="hidden lg:inline">{language === 'es' ? 'Logros' : 'Progress'}</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
                      <NotesPanel
                        courseId={courseId || 'course-1'}
                        currentLessonId={currentLessonId}
                        currentLessonTitle={currentLesson?.title || ''}
                        currentVideoTime={currentVideoTime}
                        onTimestampClick={handleTimestampClick}
                      />
                    </TabsContent>

                    <TabsContent value="resources" className="flex-1 m-0 overflow-hidden">
                      <ResourcesPanel
                        resources={resources}
                        currentLessonId={currentLessonId}
                        showAllResources={true}
                      />
                    </TabsContent>

                    <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
                      <AITutorPanel
                        courseId={courseId || 'course-1'}
                        currentLessonId={currentLessonId}
                        currentLessonTitle={currentLesson?.title || ''}
                        courseTitle={course.title}
                        courseTopic="CRM"
                      />
                    </TabsContent>

                    <TabsContent value="progress" className="flex-1 m-0 overflow-auto p-4">
                      <GamificationMiniWidget 
                        courseProgress={courseProgress}
                        showCertificateButton={courseProgress >= 100}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Right Panel */}
      <Sheet open={showRightPanel} onOpenChange={setShowRightPanel}>
        <SheetContent side="right" className="w-full sm:w-[400px] p-0 bg-slate-900 border-slate-800 md:hidden">
          <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 m-2 mx-4">
              <TabsTrigger value="notes" className="text-xs gap-1">
                <FileText className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="resources" className="text-xs gap-1">
                <Download className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs gap-1">
                <MessageSquare className="w-3 h-3" />
              </TabsTrigger>
              <TabsTrigger value="progress" className="text-xs gap-1">
                <Trophy className="w-3 h-3" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="flex-1 m-0 overflow-hidden">
              <NotesPanel
                courseId={courseId || 'course-1'}
                currentLessonId={currentLessonId}
                currentLessonTitle={currentLesson?.title || ''}
                currentVideoTime={currentVideoTime}
                onTimestampClick={handleTimestampClick}
              />
            </TabsContent>

            <TabsContent value="resources" className="flex-1 m-0 overflow-hidden">
              <ResourcesPanel
                resources={resources}
                currentLessonId={currentLessonId}
                showAllResources={true}
              />
            </TabsContent>

            <TabsContent value="ai" className="flex-1 m-0 overflow-hidden">
              <AITutorPanel
                courseId={courseId || 'course-1'}
                currentLessonId={currentLessonId}
                currentLessonTitle={currentLesson?.title || ''}
                courseTitle={course.title}
                courseTopic="CRM"
              />
            </TabsContent>

            <TabsContent value="progress" className="flex-1 m-0 overflow-auto p-4">
              <GamificationMiniWidget 
                courseProgress={courseProgress}
                showCertificateButton={courseProgress >= 100}
              />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LearningPlayer;
