/**
 * CourseCardWithAI - Tarjeta de curso con integración de IA
 * Muestra información del curso y recomendaciones personalizadas
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  Users,
  Play,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CourseCardData {
  id: string;
  title: string;
  shortDescription?: string;
  instructorName?: string;
  category: string;
  level: 'principiante' | 'intermedio' | 'avanzado';
  durationHours?: number;
  totalLessons?: number;
  totalStudents?: number;
  averageRating?: number;
  totalReviews?: number;
  price?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  thumbnailUrl?: string;
  slug: string;
  // AI recommendations
  aiMatchScore?: number;
  aiReason?: string;
  // User progress (if enrolled)
  progressPercentage?: number;
  isEnrolled?: boolean;
}

interface CourseCardWithAIProps {
  course: CourseCardData;
  index?: number;
  showAIInsights?: boolean;
  variant?: 'grid' | 'list' | 'compact';
  className?: string;
}

export function CourseCardWithAI({
  course,
  index = 0,
  showAIInsights = false,
  variant = 'grid',
  className
}: CourseCardWithAIProps) {
  const { language } = useLanguage();

  const getLevelLabel = (level: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      principiante: { es: 'Principiante', en: 'Beginner' },
      intermedio: { es: 'Intermedio', en: 'Intermediate' },
      avanzado: { es: 'Avanzado', en: 'Advanced' },
    };
    return labels[level]?.[language as 'es' | 'en'] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      principiante: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      intermedio: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      avanzado: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };
    return colors[level] || 'bg-slate-500/20 text-slate-400';
  };

  const formatPrice = (price?: number, isFree?: boolean) => {
    if (isFree || price === 0) return language === 'es' ? 'Gratis' : 'Free';
    if (!price) return '';
    return `€${price}`;
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={className}
      >
        <Link to={`/academia/curso/${course.slug}`}>
          <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-all">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=75&fit=crop'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white truncate">{course.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-[10px]", getLevelColor(course.level))}>
                    {getLevelLabel(course.level)}
                  </Badge>
                  {course.averageRating && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {course.averageRating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
              {showAIInsights && course.aiMatchScore && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-primary text-xs">
                    <Sparkles className="w-3 h-3" />
                    {course.aiMatchScore}%
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(variant === 'list' ? 'w-full' : '', className)}
    >
      <Link to={`/academia/curso/${course.slug}`}>
        <Card className={cn(
          "bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-all group overflow-hidden h-full",
          variant === 'list' ? 'flex flex-row' : ''
        )}>
          <div className={cn(
            "relative overflow-hidden",
            variant === 'list' ? 'w-64 flex-shrink-0' : 'aspect-video'
          )}>
            <img
              src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badges */}
            <Badge className={cn("absolute top-3 left-3", getLevelColor(course.level))}>
              {getLevelLabel(course.level)}
            </Badge>
            
            {course.isFeatured && (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}

            {/* AI Match Score */}
            {showAIInsights && course.aiMatchScore && course.aiMatchScore >= 80 && (
              <Badge className="absolute bottom-3 right-3 bg-gradient-to-r from-primary to-accent text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                {course.aiMatchScore}% Match
              </Badge>
            )}

            {/* Progress overlay for enrolled courses */}
            {course.isEnrolled && course.progressPercentage !== undefined && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center justify-between text-xs text-white mb-1">
                  <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                  <span>{course.progressPercentage}%</span>
                </div>
                <Progress value={course.progressPercentage} className="h-1.5" />
              </div>
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>

          <CardContent className={cn("p-4 flex flex-col", variant === 'list' ? 'flex-1' : '')}>
            {/* Category & Type */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                {course.category}
              </Badge>
              {course.durationHours && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {course.durationHours}h
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
              {course.title}
            </h3>

            {/* Description */}
            {course.shortDescription && (
              <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                {course.shortDescription}
              </p>
            )}

            {/* AI Recommendation Reason */}
            {showAIInsights && course.aiReason && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 mb-3">
                <p className="text-xs text-primary flex items-start gap-1">
                  <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {course.aiReason}
                </p>
              </div>
            )}

            {/* Instructor */}
            {course.instructorName && (
              <p className="text-sm text-slate-400 mb-3">
                {language === 'es' ? 'Por' : 'By'} {course.instructorName}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-400 mt-auto">
              {course.averageRating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-white font-medium">{course.averageRating.toFixed(1)}</span>
                  {course.totalReviews && (
                    <span className="text-slate-500">({course.totalReviews})</span>
                  )}
                </span>
              )}
              {course.totalStudents && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {course.totalStudents.toLocaleString()}
                </span>
              )}
              {course.totalLessons && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {course.totalLessons} {language === 'es' ? 'lecciones' : 'lessons'}
                </span>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700">
              <div>
                <span className="text-lg font-bold text-white">
                  {formatPrice(course.price, course.isFree)}
                </span>
              </div>
              <Button size="sm" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                {course.isEnrolled 
                  ? (language === 'es' ? 'Continuar' : 'Continue')
                  : (language === 'es' ? 'Ver curso' : 'View course')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default CourseCardWithAI;
