/**
 * LearningPlayer - Reproductor de contenido del curso
 * Fase 0: Placeholder con estructura básica
 */

import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Settings, CheckCircle, BookOpen, MessageSquare,
  ChevronLeft, ChevronRight, Menu, X, FileText, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useLanguage } from '@/contexts/LanguageContext';

const LearningPlayer: React.FC = () => {
  const { courseId } = useParams();
  const { language } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  // Placeholder data
  const course = {
    title: language === 'es' ? 'CRM Avanzado para Empresas' : 'Advanced CRM for Business',
    progress: 35,
    modules: [
      {
        id: '1',
        title: language === 'es' ? 'Introducción al CRM' : 'Introduction to CRM',
        lessons: [
          { id: '1-1', title: language === 'es' ? 'Bienvenida al curso' : 'Welcome to the course', duration: 300, completed: true, type: 'video' },
          { id: '1-2', title: language === 'es' ? '¿Qué es un CRM?' : 'What is a CRM?', duration: 600, completed: true, type: 'video' },
          { id: '1-3', title: language === 'es' ? 'Beneficios del CRM' : 'CRM Benefits', duration: 480, completed: true, type: 'video' },
          { id: '1-4', title: language === 'es' ? 'Tipos de CRM' : 'Types of CRM', duration: 540, completed: false, type: 'video', current: true },
          { id: '1-5', title: language === 'es' ? 'Material complementario' : 'Supplementary material', duration: 0, completed: false, type: 'pdf' },
        ],
      },
      {
        id: '2',
        title: language === 'es' ? 'Configuración Avanzada' : 'Advanced Configuration',
        lessons: [
          { id: '2-1', title: language === 'es' ? 'Configuración inicial' : 'Initial setup', duration: 720, completed: false, type: 'video' },
          { id: '2-2', title: language === 'es' ? 'Personalización de campos' : 'Field customization', duration: 600, completed: false, type: 'video' },
          { id: '2-3', title: language === 'es' ? 'Flujos de trabajo' : 'Workflows', duration: 900, completed: false, type: 'video' },
        ],
      },
    ],
  };

  const currentLesson = course.modules[0].lessons[3]; // Simulating current lesson

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 380 : 0 }}
        className="bg-slate-900 border-r border-slate-800 overflow-hidden flex-shrink-0"
      >
        <div className="w-[380px] h-screen flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800">
            <Link to="/academia/cursos" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3">
              <ChevronLeft className="w-4 h-4" />
              {language === 'es' ? 'Volver al catálogo' : 'Back to catalog'}
            </Link>
            <h2 className="font-semibold text-white line-clamp-1">{course.title}</h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{course.progress}% {language === 'es' ? 'completado' : 'completed'}</span>
              </div>
              <Progress value={course.progress} className="h-1.5" />
            </div>
          </div>

          {/* Course Content */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              <Accordion type="multiple" defaultValue={['1']} className="space-y-2">
                {course.modules.map((module) => (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className="border border-slate-800 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 text-sm">
                      <span className="text-white text-left">{module.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="divide-y divide-slate-800">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                              lesson.current 
                                ? 'bg-primary/10 border-l-2 border-l-primary'
                                : 'hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="shrink-0">
                              {lesson.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              ) : lesson.type === 'video' ? (
                                <Play className={`w-5 h-5 ${lesson.current ? 'text-primary' : 'text-slate-500'}`} />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm line-clamp-1 ${lesson.current ? 'text-white font-medium' : 'text-slate-300'}`}>
                                {lesson.title}
                              </p>
                              {lesson.duration > 0 && (
                                <p className="text-xs text-slate-500">{formatDuration(lesson.duration)}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>

          {/* AI Chatbot Button */}
          <div className="p-4 border-t border-slate-800">
            <Button className="w-full gap-2" variant="outline">
              <MessageSquare className="w-4 h-4" />
              {language === 'es' ? 'Preguntar al Tutor IA' : 'Ask AI Tutor'}
            </Button>
          </div>
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
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{currentLesson.title}</p>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            {language === 'es' ? 'Lección 4 de 48' : 'Lesson 4 of 48'}
          </Badge>
        </header>

        {/* Video Player */}
        <div className="flex-1 bg-black flex items-center justify-center relative group">
          {/* Placeholder Video */}
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary/30 transition-colors"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="w-12 h-12 text-primary" />
                ) : (
                  <Play className="w-12 h-12 text-primary ml-2" />
                )}
              </motion.div>
              <p className="text-slate-400">
                {language === 'es' ? 'Reproducción no disponible en demo' : 'Playback not available in demo'}
              </p>
            </div>
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={35} className="h-1 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <SkipBack className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <SkipForward className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/10"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>
                <span className="text-white text-sm ml-2">3:24 / 9:00</span>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Settings className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4">
          <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
            <ChevronLeft className="w-4 h-4" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </Button>

          <Button className="gap-2">
            <CheckCircle className="w-4 h-4" />
            {language === 'es' ? 'Marcar como completado' : 'Mark as completed'}
          </Button>

          <Button variant="ghost" className="text-slate-400 hover:text-white gap-2">
            {language === 'es' ? 'Siguiente' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </footer>
      </main>
    </div>
  );
};

export default LearningPlayer;
