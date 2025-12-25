/**
 * CourseCatalog - Catálogo de cursos de ObelixIA Academia
 * Fase 0: Placeholder con estructura básica
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Grid3X3, List, Star, Clock, Users,
  BookOpen, ArrowRight, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import StoreNavbar from '@/components/store/StoreNavbar';
import { useLanguage } from '@/contexts/LanguageContext';

const CourseCatalog: React.FC = () => {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Placeholder courses for demo
  const placeholderCourses = [
    {
      id: '1',
      title: language === 'es' ? 'CRM Avanzado para Empresas' : 'Advanced CRM for Business',
      instructor: 'María García',
      category: 'CRM',
      level: 'intermediate',
      duration: 12,
      students: 1250,
      rating: 4.8,
      price: 199,
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      title: language === 'es' ? 'Inteligencia Artificial para Negocios' : 'AI for Business',
      instructor: 'Carlos López',
      category: 'IA',
      level: 'beginner',
      duration: 8,
      students: 2340,
      rating: 4.9,
      price: 149,
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    },
    {
      id: '3',
      title: language === 'es' ? 'Compliance y Normativa Empresarial' : 'Compliance & Regulations',
      instructor: 'Ana Martínez',
      category: 'Compliance',
      level: 'advanced',
      duration: 15,
      students: 890,
      rating: 4.7,
      price: 249,
      thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop',
    },
    {
      id: '4',
      title: language === 'es' ? 'Análisis de Datos con IA' : 'Data Analysis with AI',
      instructor: 'Pedro Sánchez',
      category: 'Analytics',
      level: 'intermediate',
      duration: 10,
      students: 1567,
      rating: 4.6,
      price: 179,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    },
  ];

  const getLevelLabel = (level: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      beginner: { es: 'Principiante', en: 'Beginner' },
      intermediate: { es: 'Intermedio', en: 'Intermediate' },
      advanced: { es: 'Avanzado', en: 'Advanced' },
      expert: { es: 'Experto', en: 'Expert' },
    };
    return labels[level]?.[language as 'es' | 'en'] || level;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
      intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      advanced: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      expert: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[level] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />

      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Link to="/academia" className="hover:text-white transition-colors">
              Academia
            </Link>
            <span>/</span>
            <span className="text-white">
              {language === 'es' ? 'Catálogo de Cursos' : 'Course Catalog'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {language === 'es' ? 'Catálogo de Cursos' : 'Course Catalog'}
          </h1>
          <p className="text-slate-400 max-w-2xl">
            {language === 'es' 
              ? 'Explora nuestra selección de cursos profesionales con tutores IA especializados'
              : 'Explore our selection of professional courses with specialized AI tutors'}
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder={language === 'es' ? 'Buscar cursos...' : 'Search courses...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder={language === 'es' ? 'Categoría' : 'Category'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">{language === 'es' ? 'Todas' : 'All'}</SelectItem>
              <SelectItem value="crm">CRM</SelectItem>
              <SelectItem value="ia">{language === 'es' ? 'Inteligencia Artificial' : 'AI'}</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder={language === 'es' ? 'Nivel' : 'Level'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">{language === 'es' ? 'Todos' : 'All'}</SelectItem>
              <SelectItem value="beginner">{language === 'es' ? 'Principiante' : 'Beginner'}</SelectItem>
              <SelectItem value="intermediate">{language === 'es' ? 'Intermedio' : 'Intermediate'}</SelectItem>
              <SelectItem value="advanced">{language === 'es' ? 'Avanzado' : 'Advanced'}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? '' : 'border-slate-700 text-slate-400'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? '' : 'border-slate-700 text-slate-400'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Course Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={viewMode === 'grid' 
            ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'}
        >
          {placeholderCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/academia/curso/${course.id}`}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-all group overflow-hidden h-full">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)}`}>
                      {getLevelLabel(course.level)}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span className="text-primary font-medium">{course.category}</span>
                      <span>•</span>
                      <span>{course.instructor}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.students.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-white">€{course.price}</span>
                      <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                        {language === 'es' ? 'Ver más' : 'View more'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty state for coming soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center py-12 border border-dashed border-slate-700 rounded-2xl"
        >
          <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {language === 'es' ? 'Más cursos próximamente' : 'More courses coming soon'}
          </h3>
          <p className="text-slate-400 mb-4">
            {language === 'es' 
              ? 'Estamos preparando nuevos cursos con tutores IA especializados'
              : 'We are preparing new courses with specialized AI tutors'}
          </p>
          <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
            {language === 'es' ? 'Notificarme' : 'Notify me'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default CourseCatalog;
