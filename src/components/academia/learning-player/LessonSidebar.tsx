/**
 * LessonSidebar - Sidebar con contenido del curso y navegación de lecciones
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, CheckCircle, Play, FileText, HelpCircle,
  Code, BookOpen, Lock, Clock
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

export interface Lesson {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
  type: 'video' | 'pdf' | 'quiz' | 'exercise' | 'reading';
  isLocked?: boolean;
  isFree?: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface LessonSidebarProps {
  courseTitle: string;
  progress: number;
  modules: Module[];
  currentLessonId: string;
  isOpen: boolean;
  onLessonSelect: (lessonId: string) => void;
  backUrl?: string;
  backLabel?: string;
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  courseTitle,
  progress,
  modules,
  currentLessonId,
  isOpen,
  onLessonSelect,
  backUrl = '/academia/cursos',
  backLabel = 'Back to catalog',
}) => {
  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.completed) {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    if (lesson.isLocked) {
      return <Lock className="w-5 h-5 text-slate-500" />;
    }
    
    const iconClass = lesson.id === currentLessonId ? 'text-primary' : 'text-slate-500';
    
    switch (lesson.type) {
      case 'video':
        return <Play className={cn("w-5 h-5", iconClass)} />;
      case 'pdf':
      case 'reading':
        return <FileText className={cn("w-5 h-5", iconClass)} />;
      case 'quiz':
        return <HelpCircle className={cn("w-5 h-5", iconClass)} />;
      case 'exercise':
        return <Code className={cn("w-5 h-5", iconClass)} />;
      default:
        return <BookOpen className={cn("w-5 h-5", iconClass)} />;
    }
  };

  const getModuleProgress = (module: Module) => {
    const completed = module.lessons.filter(l => l.completed).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  // Get default expanded modules (current module + first incomplete)
  const getDefaultExpanded = () => {
    const expanded: string[] = [];
    for (const module of modules) {
      const hasCurrentLesson = module.lessons.some(l => l.id === currentLessonId);
      if (hasCurrentLesson) {
        expanded.push(module.id);
        break;
      }
    }
    return expanded.length > 0 ? expanded : [modules[0]?.id].filter(Boolean);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 380, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-slate-900 border-r border-slate-800 overflow-hidden flex-shrink-0 h-screen"
        >
          <div className="w-[380px] h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <Link 
                to={backUrl} 
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Link>
              <h2 className="font-semibold text-white line-clamp-2">{courseTitle}</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>{progress}% complete</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round((100 - progress) * 0.5)}h remaining
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            </div>

            {/* Course Content */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                <Accordion 
                  type="multiple" 
                  defaultValue={getDefaultExpanded()} 
                  className="space-y-2"
                >
                  {modules.map((module, moduleIndex) => {
                    const moduleProgress = getModuleProgress(module);
                    const completedCount = module.lessons.filter(l => l.completed).length;
                    
                    return (
                      <AccordionItem 
                        key={module.id} 
                        value={module.id}
                        className="border border-slate-800 rounded-lg overflow-hidden bg-slate-800/30"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-800/50 text-sm group">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-slate-500 font-medium">
                                Module {moduleIndex + 1}
                              </span>
                              {moduleProgress === 100 && (
                                <Badge variant="secondary" className="h-5 text-xs bg-green-500/20 text-green-400 border-0">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <span className="text-white font-medium">{module.title}</span>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={moduleProgress} className="h-1 flex-1" />
                              <span className="text-xs text-slate-500">
                                {completedCount}/{module.lessons.length}
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <div className="divide-y divide-slate-800">
                            {module.lessons.map((lesson, lessonIndex) => {
                              const isCurrent = lesson.id === currentLessonId;
                              
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => !lesson.isLocked && onLessonSelect(lesson.id)}
                                  disabled={lesson.isLocked}
                                  className={cn(
                                    "w-full flex items-center gap-3 p-3 text-left transition-colors",
                                    isCurrent 
                                      ? "bg-primary/10 border-l-2 border-l-primary"
                                      : "hover:bg-slate-800/50 border-l-2 border-l-transparent",
                                    lesson.isLocked && "opacity-50 cursor-not-allowed"
                                  )}
                                >
                                  <div className="shrink-0 relative">
                                    {getLessonIcon(lesson)}
                                    {lesson.isFree && !lesson.completed && (
                                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-slate-500">
                                        {moduleIndex + 1}.{lessonIndex + 1}
                                      </span>
                                      {lesson.isFree && !lesson.completed && (
                                        <Badge variant="outline" className="h-4 text-[10px] border-green-500/50 text-green-400">
                                          Free
                                        </Badge>
                                      )}
                                    </div>
                                    <p className={cn(
                                      "text-sm line-clamp-1 mt-0.5",
                                      isCurrent ? 'text-white font-medium' : 'text-slate-300'
                                    )}>
                                      {lesson.title}
                                    </p>
                                    {lesson.duration > 0 && (
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        {formatDuration(lesson.duration)}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};

export default LessonSidebar;
